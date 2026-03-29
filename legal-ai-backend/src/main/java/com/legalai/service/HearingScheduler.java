package com.legalai.service;

import com.legalai.vault.Case;
import com.legalai.vault.CaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class HearingScheduler {

    private static final Logger log = LoggerFactory.getLogger(HearingScheduler.class);

    private final CaseRepository caseRepository;
    private final EmailService emailService;

    public HearingScheduler(CaseRepository caseRepository, EmailService emailService) {
        this.caseRepository = caseRepository;
        this.emailService   = emailService;
    }

    // Runs every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void sendHearingReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Case> cases = caseRepository.findByNextHearingDate(tomorrow);
        for (Case c : cases) {
            if (c.getClientEmail() == null || c.getClientEmail().isBlank()) continue;
            try {
                emailService.sendHearingNotification(
                    c.getClientEmail(),
                    c.getClientName() != null ? c.getClientName() : "Client",
                    c.getCaseName(),
                    c.getClientPhone() != null ? c.getClientPhone() : "",
                    tomorrow.toString(),
                    "This is an automated reminder for your hearing tomorrow."
                );
                log.info("Reminder sent for case '{}' to {}", c.getCaseName(), c.getClientEmail());
            } catch (Exception e) {
                log.error("Failed to send reminder for case {}: {}", c.getId(), e.getMessage());
            }
        }
    }
}
