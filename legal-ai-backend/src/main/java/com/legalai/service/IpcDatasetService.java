package com.legalai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.legalai.model.IpcSection;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class IpcDatasetService {

    private static final Logger log = LoggerFactory.getLogger(IpcDatasetService.class);
    private List<IpcSection> ipcSections = new ArrayList<>();

    @PostConstruct
    public void loadDataset() {
        try {
            InputStream inputStream = new ClassPathResource("ipc_sections.json").getInputStream();
            ObjectMapper mapper = new ObjectMapper();
            ipcSections = mapper.readValue(inputStream, new TypeReference<List<IpcSection>>() {});
            log.info("Loaded {} IPC sections from dataset.", ipcSections.size());
        } catch (Exception e) {
            log.error("Failed to load IPC dataset: {}", e.getMessage());
        }
    }

    // Match user query against keywords and return structured context string
    public String findRelevantSections(String userQuery) {
        String queryLower = userQuery.toLowerCase();
        StringBuilder context = new StringBuilder();

        for (IpcSection section : ipcSections) {
            boolean matched = section.getKeywords().stream()
                    .anyMatch(keyword -> queryLower.contains(keyword.toLowerCase()));

            if (matched) {
                context.append("\n[").append(section.getSection()).append("] ")
                       .append(section.getTitle()).append("\n")
                       .append("Act: ").append(section.getAct()).append("\n")
                       .append("Description: ").append(section.getDescription()).append("\n")
                       .append("Punishment: ").append(section.getPunishment()).append("\n");
            }
        }

        return context.toString();
    }

    // Fallback: build a direct structured response without AI when Ollama is offline
    public String buildDirectResponse(String userQuery) {
        String queryLower = userQuery.toLowerCase();
        StringBuilder response = new StringBuilder();

        for (IpcSection section : ipcSections) {
            boolean matched = section.getKeywords().stream()
                    .anyMatch(keyword -> queryLower.contains(keyword.toLowerCase()));

            if (matched) {
                response.append("📌 ").append(section.getSection()).append(" — ").append(section.getTitle()).append("\n\n");
                response.append("📖 ").append(section.getDescription()).append("\n\n");
                response.append("⚖️ Punishment: ").append(section.getPunishment()).append("\n\n");
                response.append("🏛️ Act: ").append(section.getAct()).append("\n\n");
                response.append("─────────────────────\n\n");
            }
        }

        if (response.isEmpty()) {
            response.append("No specific IPC section found for your query.\n\n")
                    .append("Please try keywords like: accident, theft, murder, fraud, domestic violence, etc.\n\n");
        }

        response.append("⚠️ Disclaimer: This is not legal advice. Consult a qualified lawyer.");
        return response.toString();
    }
}
