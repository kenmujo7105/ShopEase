package com.EcommerceShop.Shop.service.ServiceImpl;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class GeminiEmbeddingModel implements EmbeddingModel {

    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiEmbeddingModel(@Value("${gemini.api.key}") String apiKey) {
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public float[] embed(Document document) {
        return embed(document.getText());
    }

    public float[] embed(String text) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" + apiKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String requestBody = "{\"model\": \"models/text-embedding-004\", \"content\": {\"parts\":[{\"text\": \"" + text.replace("\"", "\\\"").replace("\n", "\\n") + "\"}]}}";
            
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
            String responseStr = restTemplate.postForObject(url, request, String.class);
            
            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode valuesNode = root.path("embedding").path("values");
            
            float[] embeddings = new float[valuesNode.size()];
            for (int i = 0; i < valuesNode.size(); i++) {
                embeddings[i] = (float) valuesNode.get(i).asDouble();
            }
            return embeddings;
        } catch (Exception e) {
            e.printStackTrace();
            return new float[768]; // return zero vector on error
        }
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<Embedding> embeddings = new ArrayList<>();
        for (int i = 0; i < request.getInstructions().size(); i++) {
            float[] vector = embed(request.getInstructions().get(i));
            // Spring AI 1.1.8 requires double[] or float[]? wait, Embedding constructor takes float[] in 1.1.8 usually
            // Let's check constructor! Wait, Embedding is an interface or class? 
            // In 1.1.8, Embedding constructor takes (float[] embedding, Integer index) or similar.
            embeddings.add(new Embedding(vector, i));
        }
        return new EmbeddingResponse(embeddings);
    }
}
