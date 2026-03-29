package com.legalai.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    // Upload any file (PDF, video, image) to Cloudinary
    public Map<String, String> uploadFile(MultipartFile file, String folder) throws Exception {
        log.info("Uploading file: {} | size: {} bytes | type: {}",
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        // resource_type=auto handles PDFs, videos, images automatically
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "auto",
                        "folder",        "legalai/" + folder,
                        "use_filename",  true,
                        "unique_filename", true
                )
        );

        String secureUrl  = (String) result.get("secure_url");
        String publicId   = (String) result.get("public_id");
        String resourceType = (String) result.get("resource_type");

        log.info("Cloudinary upload success — public_id: {} | url: {}", publicId, secureUrl);

        return Map.of(
                "secure_url",    secureUrl,
                "public_id",     publicId,
                "resource_type", resourceType,
                "original_name", file.getOriginalFilename()
        );
    }

    // Delete a file from Cloudinary by public_id
    public void deleteFile(String publicId, String resourceType) throws Exception {
        log.info("Deleting from Cloudinary: {}", publicId);
        cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("resource_type", resourceType));
        log.info("Deleted from Cloudinary: {}", publicId);
    }

    // Test connectivity to Cloudinary API
    public boolean testConnection() {
        try {
            cloudinary.api().ping(ObjectUtils.emptyMap());
            log.info("Cloudinary connection test: SUCCESS");
            return true;
        } catch (Exception e) {
            log.error("Cloudinary connection test FAILED: {}", e.getMessage());
            return false;
        }
    }
}
