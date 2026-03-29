package com.legalai.vault;

import com.legalai.security.JwtUtil;
import com.legalai.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cases/{caseId}/notes")
public class HearingNoteController {

    private final HearingNoteRepository noteRepository;
    private final CaseRepository caseRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public HearingNoteController(HearingNoteRepository noteRepository,
                                  CaseRepository caseRepository,
                                  JwtUtil jwtUtil,
                                  EmailService emailService) {
        this.noteRepository = noteRepository;
        this.caseRepository = caseRepository;
        this.jwtUtil        = jwtUtil;
        this.emailService   = emailService;
    }

    private String getUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new RuntimeException("Missing token. Please log in again.");
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token))
            throw new RuntimeException("Session expired. Please log in again.");
        return jwtUtil.extractUsername(token);
    }

    // POST /cases/{caseId}/notes/test-whatsapp — send WhatsApp now for a specific note
    @PostMapping("/test-whatsapp")
    public ResponseEntity<?> testWhatsApp(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long caseId,
            @RequestBody Map<String, Long> body) {
        try {
            String username = getUsername(auth);
            Case c = caseRepository.findByIdAndUsername(caseId, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));
            if (c.getClientEmail() == null || c.getClientEmail().isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "No client email on file."));
            Long noteId = body.get("noteId");
            HearingNote note = noteRepository.findById(noteId)
                    .filter(n -> n.getCaseId().equals(caseId))
                    .orElseThrow(() -> new RuntimeException("Note not found."));
            emailService.sendHearingNotification(
                c.getClientEmail(),
                c.getClientName() != null ? c.getClientName() : "Client",
                c.getCaseName(),
                c.getClientPhone() != null ? c.getClientPhone() : "",
                note.getHearingDate(),
                note.getTitle() + "\n" + note.getContent()
            );
            return ResponseEntity.ok(Map.of("message", "Email sent to " + c.getClientEmail()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /cases/{caseId}/notes
    @GetMapping
    public ResponseEntity<?> getNotes(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long caseId) {
        try {
            String username = getUsername(auth);
            caseRepository.findByIdAndUsername(caseId, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));
            List<HearingNote> notes = noteRepository
                    .findByCaseIdAndUsernameOrderByCreatedAtDesc(caseId, username);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /cases/{caseId}/notes
    @PostMapping
    public ResponseEntity<?> addNote(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long caseId,
            @RequestBody Map<String, String> body) {
        try {
            String username = getUsername(auth);
            caseRepository.findByIdAndUsername(caseId, username)
                    .orElseThrow(() -> new RuntimeException("Case not found."));
            HearingNote note = new HearingNote();
            note.setUsername(username);
            note.setCaseId(caseId);
            note.setTitle(body.getOrDefault("title", "Hearing Note"));
            note.setHearingDate(body.getOrDefault("hearingDate", ""));
            note.setContent(body.get("content"));
            return ResponseEntity.ok(noteRepository.save(note));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /cases/{caseId}/notes/{noteId}
    @PutMapping("/{noteId}")
    public ResponseEntity<?> updateNote(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long caseId,
            @PathVariable Long noteId,
            @RequestBody Map<String, String> body) {
        try {
            String username = getUsername(auth);
            HearingNote note = noteRepository.findById(noteId)
                    .filter(n -> n.getUsername().equals(username) && n.getCaseId().equals(caseId))
                    .orElseThrow(() -> new RuntimeException("Note not found."));
            if (body.containsKey("title"))       note.setTitle(body.get("title"));
            if (body.containsKey("hearingDate")) note.setHearingDate(body.get("hearingDate"));
            if (body.containsKey("content"))     note.setContent(body.get("content"));
            return ResponseEntity.ok(noteRepository.save(note));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /cases/{caseId}/notes/{noteId}
    @DeleteMapping("/{noteId}")
    public ResponseEntity<?> deleteNote(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long caseId,
            @PathVariable Long noteId) {
        try {
            String username = getUsername(auth);
            HearingNote note = noteRepository.findById(noteId)
                    .filter(n -> n.getUsername().equals(username) && n.getCaseId().equals(caseId))
                    .orElseThrow(() -> new RuntimeException("Note not found."));
            noteRepository.delete(note);
            return ResponseEntity.ok(Map.of("message", "Note deleted."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
