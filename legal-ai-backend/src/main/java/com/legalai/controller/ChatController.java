package com.legalai.controller;

import com.legalai.model.ChatRequest;
import com.legalai.model.ChatResponse;
import com.legalai.service.LegalChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final LegalChatService legalChatService;

    public ChatController(LegalChatService legalChatService) {
        this.legalChatService = legalChatService;
    }

    // POST /chat
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        String userMessage = request.getMessage();
        log.info("POST /chat received: {}", userMessage);

        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ChatResponse("Please enter a valid legal question."));
        }

        try {
            String reply = legalChatService.processQuery(userMessage);
            return ResponseEntity.ok(new ChatResponse(reply));
        } catch (Exception e) {
            log.error("Unexpected error in /chat: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(new ChatResponse(
                        "An unexpected error occurred. Please try again.\n\n" +
                        "⚠️ Disclaimer: This is not legal advice. Consult a qualified lawyer."
                    ));
        }
    }

    // GET /chat/health — quick health check endpoint
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Legal AI Backend is running.");
    }
}
