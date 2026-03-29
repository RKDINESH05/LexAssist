package com.legalai.vault;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hearing_notes")
public class HearingNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private Long caseId;

    @Column(nullable = false)
    private String hearingDate;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public HearingNote() {}

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String u) { this.username = u; }
    public Long getCaseId() { return caseId; }
    public void setCaseId(Long c) { this.caseId = c; }
    public String getHearingDate() { return hearingDate; }
    public void setHearingDate(String d) { this.hearingDate = d; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; }
    public String getContent() { return content; }
    public void setContent(String c) { this.content = c; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
