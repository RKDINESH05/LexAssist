package com.legalai.vault;

import com.legalai.service.CloudinaryService;
import com.legalai.service.OllamaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VaultService {

    private static final Logger log = LoggerFactory.getLogger(VaultService.class);

    private final VaultFileRepository vaultFileRepository;
    private final OllamaService ollamaService;
    private final CloudinaryService cloudinaryService;

    public VaultService(VaultFileRepository vaultFileRepository,
                        OllamaService ollamaService,
                        CloudinaryService cloudinaryService) {
        this.vaultFileRepository = vaultFileRepository;
        this.ollamaService       = ollamaService;
        this.cloudinaryService   = cloudinaryService;
    }

    // Upload file — stores in Cloudinary, saves metadata in MySQL
    public VaultFileDTO uploadFile(String username, String category, Long caseId, MultipartFile file) throws Exception {
        VaultFile vaultFile = new VaultFile();
        vaultFile.setUsername(username);
        vaultFile.setCategory(category.toUpperCase());
        vaultFile.setCaseId(caseId);
        vaultFile.setFileName(file.getOriginalFilename());
        vaultFile.setFileType(file.getContentType());

        // Upload to Cloudinary
        Map<String, String> result = cloudinaryService.uploadFile(file, category);
        vaultFile.setS3Key(result.get("public_id"));
        vaultFile.setCloudinaryUrl(result.get("secure_url"));
        log.info("File uploaded to Cloudinary: {}", result.get("secure_url"));

        vaultFileRepository.save(vaultFile);

        VaultFileDTO dto = new VaultFileDTO(vaultFile);
        dto.setS3Url(result.get("secure_url"));
        return dto;
    }

    // List all files for a user
    public List<VaultFileDTO> listFiles(String username) {
        return vaultFileRepository.findByUsernameOrderByUploadedAtDesc(username)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // List files by category
    public List<VaultFileDTO> listByCategory(String username, String category) {
        return vaultFileRepository.findByUsernameAndCategoryOrderByUploadedAtDesc(username, category.toUpperCase())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // List files for a specific case
    public List<VaultFileDTO> listFilesByCase(String username, Long caseId) {
        return vaultFileRepository.findByUsernameAndCaseIdOrderByUploadedAtDesc(username, caseId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // List files for a specific case and category
    public List<VaultFileDTO> listFilesByCaseAndCategory(String username, Long caseId, String category) {
        return vaultFileRepository.findByUsernameAndCaseIdAndCategoryOrderByUploadedAtDesc(username, caseId, category.toUpperCase())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Download file bytes from Cloudinary or DB fallback
    public VaultFile downloadFile(String username, Long fileId) {
        return vaultFileRepository.findByIdAndUsername(fileId, username)
                .orElseThrow(() -> new RuntimeException("File not found."));
    }

    // Get raw bytes — from DB (files uploaded before Cloudinary)
    public byte[] getFileBytes(VaultFile file) {
        return file.getFileData();
    }

    // Delete file from Cloudinary and MySQL
    public void deleteFile(String username, Long fileId) {
        VaultFile file = vaultFileRepository.findByIdAndUsername(fileId, username)
                .orElseThrow(() -> new RuntimeException("File not found."));

        // Delete from Cloudinary if public_id exists
        if (file.getS3Key() != null && !file.getS3Key().isBlank()) {
            try {
                cloudinaryService.deleteFile(file.getS3Key(), "raw");
            } catch (Exception e) {
                log.warn("Cloudinary delete failed for {}: {}", file.getS3Key(), e.getMessage());
            }
        }

        vaultFileRepository.delete(file);
        log.info("Deleted file {} for user {}", fileId, username);
    }

    // Summarise a case file using Ollama
    public VaultFileDTO summariseFile(String username, Long fileId) throws Exception {
        VaultFile file = vaultFileRepository.findByIdAndUsername(fileId, username)
                .orElseThrow(() -> new RuntimeException("File not found."));

        if (!file.getCategory().equals("CASE_FILE"))
            throw new RuntimeException("Only CASE_FILE documents can be summarised.");

        byte[] fileBytes = file.getFileData();
        if (fileBytes == null || fileBytes.length == 0)
            throw new RuntimeException("File content not available for summarisation. Please re-upload the file.");

        String fileText = extractText(file.getFileName(), file.getFileType(), fileBytes);
        if (fileText.isBlank())
            throw new RuntimeException("Could not extract text. Please upload a .txt or text-based PDF.");

        if (fileText.length() > 3000)
            fileText = fileText.substring(0, 3000) + "...[truncated]";

        String prompt = "You are an Indian legal assistant. Summarise the following legal case file clearly. " +
                "Include: parties involved, key facts, legal sections mentioned, and outcome if available. " +
                "Be concise. End with: 'Disclaimer: This is not legal advice. Consult a qualified lawyer.'\n\n" +
                "Case File Content:\n" + fileText;

        log.info("Summarising file {} for user {}", file.getFileName(), username);
        String summary = ollamaService.getChatResponse(prompt, "");
        file.setSummary(summary);
        vaultFileRepository.save(file);
        return toDTO(file);
    }

    private VaultFileDTO toDTO(VaultFile f) {
        VaultFileDTO dto = new VaultFileDTO(f);
        if (f.getCloudinaryUrl() != null) dto.setS3Url(f.getCloudinaryUrl());
        return dto;
    }

    private String extractText(String fileName, String fileType, byte[] bytes) {
        try {
            String type = fileType != null ? fileType : "";
            if (type.contains("text") || fileName.endsWith(".txt"))
                return new String(bytes, "UTF-8");
            if (type.contains("pdf") || fileName.endsWith(".pdf")) {
                String raw = new String(bytes, "ISO-8859-1");
                StringBuilder sb = new StringBuilder();
                for (char c : raw.toCharArray()) {
                    if (c >= 32 && c < 127) sb.append(c);
                    else if (c == '\n' || c == '\r') sb.append('\n');
                }
                return sb.toString().replaceAll("\\s{3,}", "\n").trim();
            }
            return "";
        } catch (Exception e) {
            log.error("Text extraction failed: {}", e.getMessage());
            return "";
        }
    }
}
