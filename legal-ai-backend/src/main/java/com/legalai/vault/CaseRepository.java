package com.legalai.vault;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {
    List<Case> findByUsernameOrderByCreatedAtDesc(String username);
    Optional<Case> findByIdAndUsername(Long id, String username);
    List<Case> findByNextHearingDate(LocalDate date);
}
