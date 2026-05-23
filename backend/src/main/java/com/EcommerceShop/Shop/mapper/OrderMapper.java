package com.EcommerceShop.Shop.mapper;

import com.EcommerceShop.Shop.entity.OrderItem;
import com.EcommerceShop.Shop.enums.OrderItemStatus;
import com.EcommerceShop.Shop.entity.Orders;
import com.EcommerceShop.Shop.dto.response.OrderItemResponse;
import com.EcommerceShop.Shop.dto.response.OrderResponse;
import org.mapstruct.Mapper;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class OrderMapper {
    @Autowired
    ProductMapper productMapper ;


    public OrderResponse toOrderResponse(Orders orders, OrderItemStatus status){
        return OrderResponse.builder()
                .total(orders.getTotal())
                .createdAt(orders.getCreatedAt())
                .id(orders.getId())
                .userId(orders.getUser().getId())
                .status(orders.getStatus())
                .paymentMethod(orders.getPaymentMethod())
                .orderItems(orders.getItemByStatus(status != null ? status : OrderItemStatus.ACTIVE).stream().map(
                        this::toOrderItemResponse
                ).toList()).build() ;
    }

    public OrderItemResponse toOrderItemResponse(OrderItem orderItem){
        return OrderItemResponse.builder()
                .item(productMapper.toProductDetailResponse(orderItem.getItem()))
                .id(orderItem.getId())
                .num(orderItem.getNum())
                .build();
    }
}
