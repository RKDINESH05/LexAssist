package com.legalai.auth;

import com.legalai.model.User;
import com.legalai.repository.UserRepository;
import com.legalai.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    private String getUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new RuntimeException("Unauthorized");
        return jwtUtil.extractUsername(authHeader.substring(7));
    }

    // GET /api/profile
    @GetMapping
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String auth) {
        try {
            String username = getUsername(auth);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found."));
            return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email",    user.getEmail(),
                "fullName", user.getFullName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/profile — update fullName and email
    @PutMapping
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            String username = getUsername(auth);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found."));

            String newEmail    = body.get("email");
            String newFullName = body.get("fullName");

            if (newEmail != null && !newEmail.equals(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail))
                    return ResponseEntity.badRequest().body(Map.of("error", "Email already in use."));
                user.setEmail(newEmail);
            }
            if (newFullName != null && !newFullName.isBlank())
                user.setFullName(newFullName);

            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/profile/password — change password
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            String username    = getUsername(auth);
            String currentPass = body.get("currentPassword");
            String newPass     = body.get("newPassword");

            if (newPass == null || newPass.length() < 6)
                return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters."));

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found."));

            if (!passwordEncoder.matches(currentPass, user.getPassword()))
                return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect."));

            user.setPassword(passwordEncoder.encode(newPass));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
