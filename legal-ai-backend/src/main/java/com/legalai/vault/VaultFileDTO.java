package com.legalai.vault;

import java.time.LocalDateTime;

public class VaultFileDTO {
    private Long id;
    private String category;
    private String fileName;
    private String fileType;
    private String summary;
    private Long caseId;
    private String storageType;   // "S3" or "LOCAL"
    private String s3Url;         // direct S3 URL if stored in cloud
    private LocalDateTime uploadedAt;

    public VaultFileDTO(VaultFile f) {
        this.id          = f.getId();
        this.category    = f.getCategory();
        this.fileName    = f.getFileName();
        this.fileType    = f.getFileType();
        this.summary     = f.getSummary();
        this.caseId      = f.getCaseId();
        this.storageType = f.isInS3() ? "S3" : "LOCAL";
        this.uploadedAt  = f.getUploadedAt();
    }

    public Long getId() { return id; }
    public String getCategory() { return category; }
    public String getFileName() { return fileName; }
    public String getFileType() { return fileType; }
    public String getSummary() { return summary; }
    public Long getCaseId() { return caseId; }
    public String getStorageType() { return storageType; }
    public String getS3Url() { return s3Url; }
    public void setS3Url(String url) { this.s3Url = url; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
}
