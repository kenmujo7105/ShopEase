package com.EcommerceShop.Shop.config;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.util.List;

@Configuration
public class RagConfig {

    @Value("classpath:shop_policies.txt")
    private Resource shopPoliciesResource;

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        return SimpleVectorStore.builder(embeddingModel).build();
    }

    @Bean
    public ApplicationRunner loadVectorStore(VectorStore vectorStore) {
        return args -> {
            new Thread(() -> {
                try {
                    TextReader textReader = new TextReader(shopPoliciesResource);
                    textReader.getCustomMetadata().put("filename", "shop_policies.txt");
                    List<Document> documents = textReader.get();

                    TokenTextSplitter textSplitter = new TokenTextSplitter();
                    List<Document> splitDocuments = textSplitter.apply(documents);

                    vectorStore.add(splitDocuments);
                    System.out.println("Loaded " + splitDocuments.size() + " documents into VectorStore for RAG.");
                } catch (Exception e) {
                    System.err.println("Failed to load documents into VectorStore: " + e.getMessage());
                    e.printStackTrace();
                }
            }).start();
        };
    }
}
