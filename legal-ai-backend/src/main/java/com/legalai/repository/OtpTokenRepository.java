package com.legalai.repository;

import com.legalai.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    // Get the latest unused OTP for an email
    Optional<OtpToken> findTopByEmailOrderByIdDesc(String email);

    // Delete all OTPs for an email (cleanup after use)
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpToken o WHERE o.email = :email")
    void deleteAllByEmail(String email);
}
