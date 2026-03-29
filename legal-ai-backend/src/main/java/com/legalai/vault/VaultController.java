package com.legalai.vault;

import com.legalai.security.JwtUtil;
import com.legalai.service.OllamaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vault")
public class VaultController {

    private static final Logger log = LoggerFactory.getLogger(VaultController.class);

    private final VaultService vaultService;
    private final JwtUtil jwtUtil;
    private final OllamaService ollamaService;

    public VaultController(VaultService vaultService, JwtUtil jwtUtil, OllamaService ollamaService) {
        this.vaultService = vaultService;
        this.jwtUtil = jwtUtil;
        this.ollamaService = ollamaService;
    }

    private String getUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new RuntimeException("Unauthorized");
        return jwtUtil.extractUsername(authHeader.substring(7));
    }

    // POST /vault/upload?category=FIR
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestHeader("Authorization") String auth,
            @RequestParam("category") String category,
            @RequestParam("file") MultipartFile file) {
        try {
            String username = getUsername(auth);
            VaultFileDTO dto = vaultService.uploadFile(username, category, null, file);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /vault/files
    @GetMapping("/files")
    public ResponseEntity<?> listFiles(@RequestHeader("Authorization") String auth) {
        try {
            return ResponseEntity.ok(vaultService.listFiles(getUsername(auth)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /vault/files/category?category=FIR
    @GetMapping("/files/category")
    public ResponseEntity<?> listByCategory(
            @RequestHeader("Authorization") String auth,
            @RequestParam("category") String category) {
        try {
            return ResponseEntity.ok(vaultService.listByCategory(getUsername(auth), category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /vault/download/{id}
    @GetMapping("/download/{id}")
    public ResponseEntity<?> download(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id) {
        try {
            VaultFile file = vaultService.downloadFile(getUsername(auth), id);
            byte[] bytes   = vaultService.getFileBytes(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(file.getFileType()))
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /vault/delete/{id}
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id) {
        try {
            vaultService.deleteFile(getUsername(auth), id);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /vault/summarise/{id}
    @PostMapping("/summarise/{id}")
    public ResponseEntity<?> summarise(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id) {
        try {
            VaultFileDTO dto = vaultService.summariseFile(getUsername(auth), id);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /vault/predict — AI win prediction based on case description
    @PostMapping("/predict")
    public ResponseEntity<?> predict(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            getUsername(auth); // validate token
            String caseDescription = body.get("caseDescription");
            String caseType = body.getOrDefault("caseType", "General");

            if (caseDescription == null || caseDescription.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Case description is required."));

            String prompt = "You are an experienced Indian legal analyst. Based on the following case details, " +
                "provide a structured analysis with:\n" +
                "1. Win Probability (give a percentage like 65%)\n" +
                "2. Key Strengths of the case\n" +
                "3. Key Weaknesses or risks\n" +
                "4. Relevant IPC sections that apply\n" +
                "5. Recommended next steps\n\n" +
                "Case Type: " + caseType + "\n" +
                "Case Description: " + caseDescription + "\n\n" +
                "Be realistic and concise. End with: 'Disclaimer: This is not legal advice. Consult a qualified lawyer.'";

            String prediction = ollamaService.getChatResponse(prompt, "");
            return ResponseEntity.ok(Map.of("prediction", prediction));
        } catch (Exception e) {
            log.error("Prediction error: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /vault/stats — file counts per category for dashboard
    @GetMapping("/stats")
    public ResponseEntity<?> stats(@RequestHeader("Authorization") String auth) {
        try {
            String username = getUsername(auth);
            List<VaultFileDTO> all = vaultService.listFiles(username);
            Map<String, Long> counts = Map.of(
                "total",    (long) all.size(),
                "FIR",      all.stream().filter(f -> "FIR".equals(f.getCategory())).count(),
                "VIDEO",    all.stream().filter(f -> "VIDEO".equals(f.getCategory())).count(),
                "CASE_FILE",all.stream().filter(f -> "CASE_FILE".equals(f.getCategory())).count(),
                "AADHAAR",  all.stream().filter(f -> "AADHAAR".equals(f.getCategory())).count(),
                "PERSONAL", all.stream().filter(f -> "PERSONAL".equals(f.getCategory())).count()
            );
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
