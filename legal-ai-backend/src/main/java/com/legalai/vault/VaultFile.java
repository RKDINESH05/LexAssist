package com.legalai.vault;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vault_files")
public class VaultFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String category;       // FIR, VIDEO, CASE_FILE, AADHAAR, PERSONAL

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;       // MIME type

    // S3 key — set when file is stored in AWS S3
    @Column
    private String s3Key;

    @Column(length = 1000)
    private String cloudinaryUrl;

    // File bytes — used as fallback when S3 is not configured
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @Column(columnDefinition = "LONGTEXT")
    private String summary;        // AI-generated summary

    @Column
    private Long caseId;

    @Column(nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public VaultFile() {}

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String u) { this.username = u; }
    public String getCategory() { return category; }
    public void setCategory(String c) { this.category = c; }
    public String getFileName() { return fileName; }
    public void setFileName(String f) { this.fileName = f; }
    public String getFileType() { return fileType; }
    public void setFileType(String t) { this.fileType = t; }
    public String getS3Key() { return s3Key; }
    public void setS3Key(String k) { this.s3Key = k; }
    public String getCloudinaryUrl() { return cloudinaryUrl; }
    public void setCloudinaryUrl(String u) { this.cloudinaryUrl = u; }
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] d) { this.fileData = d; }
    public String getSummary() { return summary; }
    public void setSummary(String s) { this.summary = s; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long c) { this.caseId = c; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }

    // Returns true if file is stored in S3
    public boolean isInS3() { return s3Key != null && !s3Key.isBlank(); }
}
