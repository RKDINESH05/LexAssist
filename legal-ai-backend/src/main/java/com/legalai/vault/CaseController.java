package com.legalai.vault;

import com.legalai.security.JwtUtil;
import com.legalai.service.EmailService;
import com.legalai.service.OllamaService;
import com.legalai.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cases")
public class CaseController {

    private static final Logger log = LoggerFactory.getLogger(CaseController.class);

    private final CaseRepository caseRepository;
    private final VaultService vaultService;
    private final JwtUtil jwtUtil;
    private final OllamaService ollamaService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public CaseController(CaseRepository caseRepository, VaultService vaultService,
                          JwtUtil jwtUtil, OllamaService ollamaService,
                          EmailService emailService,
                          UserRepository userRepository) {
        this.caseRepository = caseRepository;
        this.vaultService   = vaultService;
        this.jwtUtil        = jwtUtil;
        this.ollamaService  = ollamaService;
        this.emailService   = emailService;
        this.userRepository = userRepository;
    }

    private String getUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new RuntimeException("Missing token. Please log in again.");
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token))
            throw new RuntimeException("Session expired. Please log in again.");
        return jwtUtil.extractUsername(token);
    }

    // POST /cases — create a new case folder
    @PostMapping
    public ResponseEntity<?> createCase(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            String username = getUsername(auth);
            String caseName = body.get("caseName");
            if (caseName == null || caseName.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Case name is required."));
            Case c = new Case();
            c.setUsername(username);
            c.setCaseName(caseName.trim());
            c.setCaseType(body.getOrDefault("caseType", "General"));
            c.setDescription(body.getOrDefault("description", ""));
            c.setClientName(body.getOrDefault("clientName", ""));
            c.setClientPhone(body.getOrDefault("clientPhone", ""));
            c.setClientEmail(body.getOrDefault("clientEmail", ""));
            caseRepository.save(c);
            log.info("Case created: {} for user {}", caseName, username);
            return ResponseEntity.ok(c);
        } catch (Exception e) {
            log.error("Create case error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /cases — list all cases for user
    @GetMapping
    public ResponseEntity<?> listCases(@RequestHeader("Authorization") String auth) {
        try {
            String username = getUsername(auth);
            List<Case> cases = caseRepository.findByUsernameOrderByCreatedAtDesc(username);
            return ResponseEntity.ok(cases);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /cases/{id} — update editable fields (clientPhone, clientName, etc.)
    @PatchMapping("/{id}")
    public ResponseEntity<?> patchCase(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String username = getUsername(auth);
            Case c = caseRepository.findByIdAndUsername(id, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));
            if (body.containsKey("clientPhone")) c.setClientPhone(body.get("clientPhone"));
            if (body.containsKey("clientName"))  c.setClientName(body.get("clientName"));
            if (body.containsKey("clientEmail")) c.setClientEmail(body.get("clientEmail"));
            if (body.containsKey("description")) c.setDescription(body.get("description"));
            if (body.containsKey("caseName"))    c.setCaseName(body.get("caseName"));
            if (body.containsKey("caseType"))    c.setCaseType(body.get("caseType"));
            caseRepository.save(c);
            return ResponseEntity.ok(c);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /cases/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCase(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id) {
        try {
            String username = getUsername(auth);
            Case c = caseRepository.findByIdAndUsername(id, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));
            caseRepository.delete(c);
            return ResponseEntity.ok(Map.of("message", "Case deleted."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /cases/{id}/files
    @GetMapping("/{id}/files")
    public ResponseEntity<?> listFiles(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id) {
        try {
            String username = getUsername(auth);
            return ResponseEntity.ok(vaultService.listFilesByCase(username, id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /cases/{id}/files/category?category=FIR
    @GetMapping("/{id}/files/category")
    public ResponseEntity<?> listFilesByCategory(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id,
            @RequestParam String category) {
        try {
            String username = getUsername(auth);
            return ResponseEntity.ok(vaultService.listFilesByCaseAndCategory(username, id, category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /cases/{id}/upload?category=FIR
    @PostMapping("/{id}/upload")
    public ResponseEntity<?> uploadFile(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id,
            @RequestParam String category,
            @RequestParam MultipartFile file) {
        try {
            String username = getUsername(auth);
            caseRepository.findByIdAndUsername(id, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));
            VaultFileDTO dto = vaultService.uploadFile(username, category, id, file);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /cases/{id}/notify
    @PostMapping("/{id}/notify")
    public ResponseEntity<?> notifyClient(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String username = getUsername(auth);
            Case c = caseRepository.findByIdAndUsername(id, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));
            String clientEmail = c.getClientEmail();
            if (clientEmail == null || clientEmail.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "No client email on file."));
            String nextHearingDate = body.getOrDefault("nextHearingDate", "");
            if (nextHearingDate.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Next hearing date is required."));
            // Save hearing date to case
            c.setNextHearingDate(LocalDate.parse(nextHearingDate));
            caseRepository.save(c);
            // Send immediate email confirmation
            emailService.sendHearingNotification(
                clientEmail,
                c.getClientName() != null ? c.getClientName() : "Client",
                c.getCaseName(),
                c.getClientPhone() != null ? c.getClientPhone() : "",
                nextHearingDate,
                body.getOrDefault("message", "")
            );
            log.info("Hearing notification email sent for case {} to {}", c.getCaseName(), clientEmail);
            return ResponseEntity.ok(Map.of("message", "Notification email sent to " + clientEmail));
        } catch (Exception e) {
            log.error("Notify error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /cases/{id}/predict — AI win prediction based on all case data
    @PostMapping("/{id}/predict")
    public ResponseEntity<?> predictCase(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long id) {
        try {
            String username = getUsername(auth);

            Case legalCase = caseRepository.findByIdAndUsername(id, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));

            List<VaultFileDTO> allFiles = vaultService.listFilesByCase(username, id);

            long firCount      = allFiles.stream().filter(f -> "FIR".equals(f.getCategory())).count();
            long videoCount    = allFiles.stream().filter(f -> "VIDEO".equals(f.getCategory())).count();
            long caseFileCount = allFiles.stream().filter(f -> "CASE_FILE".equals(f.getCategory())).count();
            long aadhaarCount  = allFiles.stream().filter(f -> "AADHAAR".equals(f.getCategory())).count();
            long personalCount = allFiles.stream().filter(f -> "PERSONAL".equals(f.getCategory())).count();

            StringBuilder summaries = new StringBuilder();
            allFiles.stream()
                    .filter(f -> "CASE_FILE".equals(f.getCategory()) && f.getSummary() != null)
                    .forEach(f -> summaries.append("\n[Summary of ").append(f.getFileName()).append("]:\n")
                            .append(f.getSummary()).append("\n"));

            String prompt = "You are an experienced Indian legal analyst. Analyse the following case and provide:\n" +
                "1. Win Probability (give a clear percentage like 65%)\n" +
                "2. Key Strengths of the case\n" +
                "3. Key Weaknesses or risks\n" +
                "4. Relevant IPC sections that apply\n" +
                "5. Evidence Assessment\n" +
                "6. Recommended next steps\n\n" +
                "=== CASE DETAILS ===\n" +
                "Case Name: " + legalCase.getCaseName() + "\n" +
                "Case Type: " + legalCase.getCaseType() + "\n" +
                "Description: " + (legalCase.getDescription() != null && !legalCase.getDescription().isBlank()
                        ? legalCase.getDescription() : "Not provided") + "\n\n" +
                "=== EVIDENCE AVAILABLE ===\n" +
                "FIR Copies: " + firCount + "\n" +
                "Video Evidence: " + videoCount + "\n" +
                "Case Documents: " + caseFileCount + "\n" +
                "Aadhaar/ID Proof: " + aadhaarCount + "\n" +
                "Personal Documents: " + personalCount + "\n" +
                "Total Evidence Files: " + allFiles.size() + "\n\n" +
                (summaries.length() > 0 ? "=== CASE DOCUMENT SUMMARIES ===\n" + summaries + "\n" : "") +
                "Based on the above, give a realistic win probability. " +
                "More evidence = stronger case. FIR and case documents are critical.\n" +
                "End with: 'Disclaimer: This is not legal advice. Consult a qualified lawyer.'";

            log.info("Predicting case '{}' for user '{}'", legalCase.getCaseName(), username);
            String prediction = ollamaService.getChatResponse(prompt, "");

            // Use HashMap to avoid Map.of() Long serialization issues
            Map<String, Object> response = new HashMap<>();
            response.put("prediction", prediction);
            response.put("caseId",     id.toString());
            response.put("caseName",   legalCase.getCaseName());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Case prediction error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
