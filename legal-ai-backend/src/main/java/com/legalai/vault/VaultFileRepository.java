package com.legalai.vault;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaultFileRepository extends JpaRepository<VaultFile, Long> {
    List<VaultFile> findByUsernameOrderByUploadedAtDesc(String username);
    List<VaultFile> findByUsernameAndCategoryOrderByUploadedAtDesc(String username, String category);
    Optional<VaultFile> findByIdAndUsername(Long id, String username);
    List<VaultFile> findByUsernameAndCaseIdOrderByUploadedAtDesc(String username, Long caseId);
    List<VaultFile> findByUsernameAndCaseIdAndCategoryOrderByUploadedAtDesc(String username, Long caseId, String category);
}
