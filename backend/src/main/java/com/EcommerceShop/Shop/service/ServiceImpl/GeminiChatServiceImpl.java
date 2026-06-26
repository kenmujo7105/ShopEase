package com.EcommerceShop.Shop.service.ServiceImpl;

import com.EcommerceShop.Shop.service.AiChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

/**
 * GeminiChatServiceImpl – Integration with Google Gemini API using Spring AI.
 * Hỗ trợ RAG (Retrieval-Augmented Generation) và Tool Calling.
 */
@Slf4j
@Service
public class GeminiChatServiceImpl implements AiChatService {

    private static final String SYSTEM_INSTRUCTION = "Bạn là trợ lý AI chuyên nghiệp của cửa hàng công nghệ ShopEase. "
            + "Bạn trả lời bằng tiếng Việt thân thiện. "
            + "Để trả lời câu hỏi về chính sách cửa hàng (giao hàng, đổi trả, v.v.), hãy dùng Context được cung cấp. "
            + "Khi người dùng muốn tìm sản phẩm, tra cứu đơn hàng, phí ship hoặc tồn kho, BẠN PHẢI GỌI TOOL TƯƠNG ỨNG. "
            + "Hiển thị link sản phẩm dưới dạng Markdown (ví dụ: [Tên Sản Phẩm](http://localhost:5173/product/1)).";

    private static final String FALLBACK_MESSAGE = "⚠️ Hệ thống AI đang bận hoặc có lỗi, vui lòng thử lại sau ít phút!";

    private final ChatClient chatClient;
    private final String apiKey;

    public GeminiChatServiceImpl(ChatClient.Builder chatClientBuilder, VectorStore vectorStore, @Value("${gemini.api.key}") String apiKey, ShopAiTools shopAiTools) {
        this.apiKey = apiKey;
        if (apiKey != null && !apiKey.isBlank()) {
            this.chatClient = chatClientBuilder
                    .defaultSystem(SYSTEM_INSTRUCTION)
                    .defaultAdvisors(QuestionAnswerAdvisor.builder(vectorStore).build())
                    .defaultTools(shopAiTools)
                    .build();
            log.info("[GeminiChat] Spring AI ChatClient initialized successfully with RAG and Tools.");
        } else {
            this.chatClient = null;
            log.warn("[GeminiChat] API Key is missing. ChatClient not initialized.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String processMessage(String userMessage) {
        log.info("[GeminiChat] >>> Nhận tin nhắn: {}", userMessage);

        if (apiKey == null || apiKey.isBlank() || chatClient == null) {
            return FALLBACK_MESSAGE;
        }

        try {
            return chatClient.prompt()
                    .user(userMessage)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("[GeminiChat] ❌ Lỗi Spring AI ChatClient: [{}] {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return FALLBACK_MESSAGE;
        }
    }
}
