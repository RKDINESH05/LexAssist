package com.legalai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class OllamaService {

    private static final Logger log = LoggerFactory.getLogger(OllamaService.class);

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private static final String SYSTEM_PROMPT =
        "You are an Indian legal assistant. Provide accurate legal information based on Indian laws " +
        "such as IPC (Indian Penal Code), Motor Vehicles Act, and IT Act. " +
        "Explain in simple, clear terms. Always include relevant section numbers and punishment details. " +
        "Do not provide illegal advice. Be concise and structured. " +
        "End every response with: 'Disclaimer: This is not legal advice. Consult a qualified lawyer.'";

    public String getChatResponse(String userMessage, String legalContext) throws Exception {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return "AI service is not configured. Please set the GEMINI_API_KEY environment variable.";
        }

        StringBuilder fullPrompt = new StringBuilder(SYSTEM_PROMPT).append("\n\n");
        if (legalContext != null && !legalContext.isBlank()) {
            fullPrompt.append("Relevant Legal Sections Found:\n").append(legalContext).append("\n\n");
        }
        fullPrompt.append("User Question: ").append(userMessage);

        String requestJson = objectMapper.writeValueAsString(Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", fullPrompt.toString()))
            ))
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + geminiApiKey))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Gemini returned status {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API error: HTTP " + response.statusCode());
        }

        JsonNode json = objectMapper.readTree(response.body());
        String reply = json.path("candidates").get(0)
                           .path("content").path("parts").get(0)
                           .path("text").asText();
        log.info("Gemini response received ({} chars)", reply.length());
        return reply;
    }
}
