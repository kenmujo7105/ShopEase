package com.EcommerceShop.Shop.enums;

public enum OrderStatus {
    PENDING_PAYMENT, // Đơn hàng chờ thanh toán online (VNPay)
    PENDING,          // Đơn hàng vừa được tạo, đang chờ xác nhận
    CONFIRMED,       // Đơn hàng đã được xác nhận (bởi hệ thống hoặc admin)
    SHIPPED,         // Đã giao cho đơn vị vận chuyển
    DELIVERED,       // Đã giao hàng thành công
    CANCELLED      // Đơn hàng bị hủy (bởi khách hàng hoặc hệ thống)


    ;
    public OrderStatus nextStatus() {
        OrderStatus[] values = OrderStatus.values();
        int currentIndex = this.ordinal();
        if (currentIndex < values.length - 1) {
            return values[currentIndex + 1];
        } else {
            return this; // hoặc throw nếu không còn bước tiếp theo
        }
    }

}
