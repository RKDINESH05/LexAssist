package com.legalai.auth;

import com.legalai.dto.ApiResponse;
import com.legalai.dto.AuthResponse;
import com.legalai.dto.ForgotPasswordRequest;
import com.legalai.dto.LoginRequest;
import com.legalai.dto.RegisterRequest;
import com.legalai.dto.ResetPasswordRequest;
import com.legalai.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest request) {
        try {
            ApiResponse response = authService.register(request);
            return response.isSuccess()
                    ? ResponseEntity.ok(response)
                    : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse(false, "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            ApiResponse response = authService.sendOtp(request);
            return response.isSuccess()
                    ? ResponseEntity.ok(response)
                    : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse(false, "Failed to send OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            ApiResponse response = authService.resetPassword(request);
            return response.isSuccess()
                    ? ResponseEntity.ok(response)
                    : ResponseEntity.badRequest().body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
