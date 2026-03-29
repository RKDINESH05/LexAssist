package com.legalai.vault;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HearingNoteRepository extends JpaRepository<HearingNote, Long> {
    List<HearingNote> findByCaseIdAndUsernameOrderByCreatedAtDesc(Long caseId, String username);
    List<HearingNote> findByHearingDate(String hearingDate);
}
