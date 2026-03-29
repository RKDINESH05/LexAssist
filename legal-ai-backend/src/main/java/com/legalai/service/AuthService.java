package com.legalai.service;

import com.legalai.dto.ApiResponse;
import com.legalai.dto.AuthResponse;
import com.legalai.dto.ForgotPasswordRequest;
import com.legalai.dto.LoginRequest;
import com.legalai.dto.RegisterRequest;
import com.legalai.dto.ResetPasswordRequest;
import com.legalai.model.OtpToken;
import com.legalai.model.User;
import com.legalai.repository.OtpTokenRepository;
import com.legalai.repository.UserRepository;
import com.legalai.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${otp.expiry.minutes}")
    private int otpExpiryMinutes;

    public AuthService(UserRepository userRepository,
                       OtpTokenRepository otpTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    public ApiResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            return new ApiResponse(false, "Username already taken.");
        if (userRepository.existsByEmail(req.getEmail()))
            return new ApiResponse(false, "Email already registered.");

        User user = new User(
            req.getUsername(),
            req.getEmail(),
            req.getFullName(),
            passwordEncoder.encode(req.getPassword())
        );
        userRepository.save(user);
        return new ApiResponse(true, "Account created successfully!");
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password."));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword()))
            throw new RuntimeException("Invalid username or password.");
        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), "Login successful!");
    }

    public ApiResponse sendOtp(ForgotPasswordRequest req) {
        if (!userRepository.existsByEmail(req.getEmail()))
            return new ApiResponse(false, "No account found with this email.");

        otpTokenRepository.deleteAllByEmail(req.getEmail());

        String otp = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(otpExpiryMinutes);
        otpTokenRepository.save(new OtpToken(req.getEmail(), otp, expiry));
        emailService.sendOtpEmail(req.getEmail(), otp);
        return new ApiResponse(true, "OTP sent to your email.");
    }

    public ApiResponse resetPassword(ResetPasswordRequest req) {
        OtpToken otpToken = otpTokenRepository
                .findTopByEmailOrderByIdDesc(req.getEmail())
                .orElseThrow(() -> new RuntimeException("OTP not found. Please request a new one."));

        if (otpToken.isUsed())
            return new ApiResponse(false, "OTP already used. Please request a new one.");
        if (LocalDateTime.now().isAfter(otpToken.getExpiresAt()))
            return new ApiResponse(false, "OTP has expired. Please request a new one.");
        if (!otpToken.getOtp().equals(req.getOtp()))
            return new ApiResponse(false, "Invalid OTP.");

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found."));
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return new ApiResponse(true, "Password reset successfully!");
    }
}
