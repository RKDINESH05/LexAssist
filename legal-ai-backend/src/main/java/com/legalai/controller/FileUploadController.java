package com.legalai.controller;

import com.legalai.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/upload")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    private final CloudinaryService cloudinaryService;

    public FileUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    // POST /upload/file?folder=FIR
    // Accepts any file (PDF, video, image) and uploads to Cloudinary
    @PostMapping("/file")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file")   MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {

        log.info("POST /upload/file — name: {} | folder: {} | size: {} bytes",
                file.getOriginalFilename(), folder, file.getSize());

        if (file.isEmpty()) {
            log.warn("Upload rejected — empty file");
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty."));
        }

        try {
            Map<String, String> result = cloudinaryService.uploadFile(file, folder);
            log.info("Upload successful — url: {}", result.get("secure_url"));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // DELETE /upload/file?publicId=legalai/FIR/abc123&resourceType=raw
    @DeleteMapping("/file")
    public ResponseEntity<?> deleteFile(
            @RequestParam("publicId")      String publicId,
            @RequestParam(value = "resourceType", defaultValue = "raw") String resourceType) {
        try {
            cloudinaryService.deleteFile(publicId, resourceType);
            return ResponseEntity.ok(Map.of("message", "File deleted from Cloudinary."));
        } catch (Exception e) {
            log.error("Delete failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    // GET /upload/test — verify Cloudinary connectivity
    @GetMapping("/test")
    public ResponseEntity<?> testConnection() {
        boolean ok = cloudinaryService.testConnection();
        if (ok) return ResponseEntity.ok(Map.of("status", "Cloudinary connected successfully."));
        return ResponseEntity.internalServerError()
                .body(Map.of("status", "Cloudinary connection failed. Check credentials."));
    }
}
