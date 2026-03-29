package com.legalai.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendHearingNotification(String toEmail, String clientName, String caseName,
                                         String clientPhone, String nextHearingDate, String extraMessage) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Hearing Reminder: " + caseName);
        String body = "Hearing Reminder\n" +
            "==================\n" +
            "Case   : " + caseName + "\n" +
            "Client : " + clientName + "\n" +
            "Phone  : " + clientPhone + "\n" +
            "Date   : " + nextHearingDate + "\n" +
            (extraMessage != null && !extraMessage.isBlank() ? "Note   : " + extraMessage + "\n" : "") +
            "\nPlease ensure the client is informed and present on time.\n\n" +
            "- Legal AI";
        message.setText(body);
        mailSender.send(message);
    }

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Legal AI - Password Reset OTP");
        message.setText(
            "Hello,\n\n" +
            "Your OTP for password reset is: " + otp + "\n\n" +
            "This OTP is valid for 10 minutes.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "Regards,\nLegal AI Team"
        );
        mailSender.send(message);
    }
}
