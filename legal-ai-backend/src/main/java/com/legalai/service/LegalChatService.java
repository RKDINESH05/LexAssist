package com.legalai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LegalChatService {

    private static final Logger log = LoggerFactory.getLogger(LegalChatService.class);

    private final IpcDatasetService ipcDatasetService;
    private final OllamaService ollamaService;

    public LegalChatService(IpcDatasetService ipcDatasetService, OllamaService ollamaService) {
        this.ipcDatasetService = ipcDatasetService;
        this.ollamaService = ollamaService;
    }

    public String processQuery(String userMessage) {
        log.info("Processing legal query: {}", userMessage);

        // Step 1: Match IPC sections from dataset
        String legalContext = ipcDatasetService.findRelevantSections(userMessage);

        if (!legalContext.isBlank()) {
            log.info("Matched IPC context found, sending to Ollama.");
        } else {
            log.info("No IPC keyword match found, sending raw query to Ollama.");
        }

        // Step 2: Try Ollama — fall back to direct dataset response if Ollama is offline
        try {
            return ollamaService.getChatResponse(userMessage, legalContext);
        } catch (Exception e) {
            log.warn("Ollama unavailable ({}). Using direct IPC dataset response.", e.getMessage());
            return ipcDatasetService.buildDirectResponse(userMessage);
        }
    }
}
