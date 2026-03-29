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
import java.util.Map;

@Service
public class OllamaService {

    private static final Logger log = LoggerFactory.getLogger(OllamaService.class);

    @Value("${ollama.api.url}")
    private String ollamaUrl;

    @Value("${ollama.model}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 120 second timeout — llama3 can be slow on first response
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final String SYSTEM_PROMPT =
        "You are an Indian legal assistant. Provide accurate legal information based on Indian laws " +
        "such as IPC (Indian Penal Code), Motor Vehicles Act, and IT Act. " +
        "Explain in simple, clear terms. Always include relevant section numbers and punishment details. " +
        "Do not provide illegal advice. Be concise and structured. " +
        "End every response with: 'Disclaimer: This is not legal advice. Consult a qualified lawyer.'";

    public String getChatResponse(String userMessage, String legalContext) throws Exception {
        // Build full prompt: system role + matched IPC context + user question
        StringBuilder fullPrompt = new StringBuilder(SYSTEM_PROMPT).append("\n\n");

        if (legalContext != null && !legalContext.isBlank()) {
            fullPrompt.append("Relevant Legal Sections Found:\n").append(legalContext).append("\n\n");
        }

        fullPrompt.append("User Question: ").append(userMessage);

        String requestJson = objectMapper.writeValueAsString(
            Map.of(
                "model",  model,
                "prompt", fullPrompt.toString(),
                "stream", false
            )
        );

        log.info("Sending request to Ollama model: {}", model);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ollamaUrl))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Ollama returned status {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Ollama error: HTTP " + response.statusCode());
        }

        JsonNode json = objectMapper.readTree(response.body());
        String reply = json.path("response").asText();
        log.info("Ollama response received ({} chars)", reply.length());
        return reply;
    }
}
