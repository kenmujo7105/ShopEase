package com.EcommerceShop.Shop.controller;

import com.EcommerceShop.Shop.dto.ApiResponseWrapper;
import com.EcommerceShop.Shop.dto.response.VNPayResponse;
import com.EcommerceShop.Shop.entity.Orders;
import com.EcommerceShop.Shop.enums.ErrorCode;
import com.EcommerceShop.Shop.enums.OrderStatus;
import com.EcommerceShop.Shop.enums.PaymentMethod;
import com.EcommerceShop.Shop.exception.AppException;
import com.EcommerceShop.Shop.repository.OrderRepository;
import com.EcommerceShop.Shop.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payment")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class PaymentController {

    VNPayService vnPayService;
    OrderRepository orderRepository;

    /**
     * Tạo URL thanh toán VNPay cho đơn hàng
     */
    @PostMapping("/vnpay/create-url")
    public ApiResponseWrapper<VNPayResponse> createVNPayUrl(
            @RequestParam String orderId,
            HttpServletRequest request) {

        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Chỉ cho phép tạo URL cho đơn hàng đang chờ thanh toán
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        // Lấy IP từ request
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }

        // Tổng tiền (làm tròn sang long VND)
        long amount = Math.round(order.getTotal());

        String paymentUrl = vnPayService.createPaymentUrl(orderId, amount, ipAddress);

        return ApiResponseWrapper.<VNPayResponse>builder()
                .data(VNPayResponse.builder().paymentUrl(paymentUrl).build())
                .build();
    }

    /**
     * VNPay Return URL — user bị redirect về đây sau khi thanh toán.
     * Verify hash và cập nhật trạng thái đơn hàng.
     */
    @GetMapping("/vnpay/return")
    public ApiResponseWrapper<?> vnpayReturn(@RequestParam Map<String, String> params) {
        boolean isValid = vnPayService.validateCallback(params);

        if (!isValid) {
            log.error("[VNPay] Invalid callback hash");
            return ApiResponseWrapper.builder()
                    .code(9999)
                    .message("Invalid signature")
                    .build();
        }

        String orderId = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");

        Orders order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.error("[VNPay] Order not found: {}", orderId);
            return ApiResponseWrapper.builder()
                    .code(9999)
                    .message("Order not found")
                    .build();
        }

        // Chỉ xử lý đơn hàng đang chờ thanh toán
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            if ("00".equals(responseCode)) {
                // Thanh toán thành công
                order.setStatus(OrderStatus.PENDING);
                order.setVnpTxnRef(params.get("vnp_TransactionNo"));
                orderRepository.save(order);
                log.info("[VNPay] ✅ Payment success for order: {}", orderId);
            } else {
                // Thanh toán thất bại — giữ PENDING_PAYMENT để user có thể retry
                log.warn("[VNPay] ❌ Payment failed for order: {}, responseCode: {}", orderId, responseCode);
            }
        }

        return ApiResponseWrapper.builder()
                .code("00".equals(responseCode) ? 1000 : 9999)
                .message("00".equals(responseCode) ? "Payment successful" : "Payment failed")
                .data(Map.of(
                        "orderId", orderId,
                        "responseCode", responseCode != null ? responseCode : "",
                        "status", order.getStatus().name()
                ))
                .build();
    }
}
