package com.legalai.service;

import com.legalai.vault.Case;
import com.legalai.vault.CaseRepository;
import com.legalai.vault.HearingNote;
import com.legalai.vault.HearingNoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class HearingNoteScheduler {

    private static final Logger log = LoggerFactory.getLogger(HearingNoteScheduler.class);

    private final HearingNoteRepository hearingNoteRepository;
    private final CaseRepository caseRepository;
    private final EmailService emailService;

    public HearingNoteScheduler(HearingNoteRepository hearingNoteRepository,
                                CaseRepository caseRepository,
                                EmailService emailService) {
        this.hearingNoteRepository = hearingNoteRepository;
        this.caseRepository        = caseRepository;
        this.emailService          = emailService;
    }

    // Runs every day at 1:00 PM
    @Scheduled(cron = "0 0 13 * * *")
    public void sendHearingDayNotifications() {
        String today = LocalDate.now().toString();
        List<HearingNote> notes = hearingNoteRepository.findByHearingDate(today);

        for (HearingNote note : notes) {
            Optional<Case> caseOpt = caseRepository.findByIdAndUsername(note.getCaseId(), note.getUsername());
            if (caseOpt.isEmpty()) continue;

            Case c = caseOpt.get();
            String email = c.getClientEmail();
            if (email == null || email.isBlank()) {
                log.warn("No email for case {} — skipping", c.getCaseName());
                continue;
            }

            try {
                emailService.sendHearingNotification(
                    email,
                    c.getClientName() != null ? c.getClientName() : "Client",
                    c.getCaseName(),
                    c.getClientPhone() != null ? c.getClientPhone() : "",
                    note.getHearingDate(),
                    note.getTitle() + "\n" + note.getContent()
                );
                log.info("Hearing email sent for case '{}' to {}", c.getCaseName(), email);
            } catch (Exception e) {
                log.error("Email failed for case {}: {}", c.getId(), e.getMessage());
            }
        }
    }
}
