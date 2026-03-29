package com.legalai.vault;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "legal_cases")
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String caseName;

    @Column(nullable = false)
    private String caseType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String clientName;

    @Column
    private String clientPhone;

    @Column
    private String clientEmail;

    @Column
    private LocalDate nextHearingDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Case() {}

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String u) { this.username = u; }
    public String getCaseName() { return caseName; }
    public void setCaseName(String n) { this.caseName = n; }
    public String getCaseType() { return caseType; }
    public void setCaseType(String t) { this.caseType = t; }
    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; }
    public String getClientName() { return clientName; }
    public void setClientName(String n) { this.clientName = n; }
    public String getClientPhone() { return clientPhone; }
    public void setClientPhone(String p) { this.clientPhone = p; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String e) { this.clientEmail = e; }
    public LocalDate getNextHearingDate() { return nextHearingDate; }
    public void setNextHearingDate(LocalDate d) { this.nextHearingDate = d; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
