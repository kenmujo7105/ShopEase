package com.EcommerceShop.Shop.service.ServiceImpl;

import com.EcommerceShop.Shop.entity.Orders;
import com.EcommerceShop.Shop.entity.Product;
import com.EcommerceShop.Shop.repository.OrderRepository;
import com.EcommerceShop.Shop.repository.ProductRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service("shopAiTools")
public class ShopAiTools {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public ShopAiTools(ProductRepository productRepository, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    public record SearchProductRequest(String keyword, int maxResults) {}
    public record CheckOrderRequest(String orderId) {}
    public record CheckInventoryRequest(Long productId) {}
    public record CheckShippingFeeRequest(String districtId, String wardCode) {}

    @Tool(description = "Tìm kiếm sản phẩm trong cơ sở dữ liệu và trả về tên, giá, link sản phẩm")
    public List<Map<String, Object>> searchProduct(SearchProductRequest request) {
        int limit = request.maxResults() > 0 ? request.maxResults() : 3;
        List<Product> products = productRepository.suggest(request.keyword(), PageRequest.of(0, limit));
        return products.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", p.getName());
            double price = 0;
            if (p.getProductDetails() != null && !p.getProductDetails().isEmpty()) {
                price = p.getProductDetails().get(0).getPrice();
            }
            map.put("price", price);
            map.put("url", "http://localhost:5173/product/" + p.getId());
            return map;
        }).collect(Collectors.toList());
    }

    @Tool(description = "Tra cứu trạng thái đơn hàng (đã giao, đang xử lý, v.v.) dựa vào mã đơn hàng")
    public String checkOrderStatus(CheckOrderRequest request) {
        Orders order = orderRepository.findById(request.orderId()).orElse(null);
        if (order == null) {
            return "Không tìm thấy đơn hàng với mã: " + request.orderId();
        }
        return "Đơn hàng " + request.orderId() + " đang ở trạng thái: " + order.getStatus() 
             + ". Tổng tiền: " + order.getTotal() + " VND.";
    }

    @Tool(description = "Kiểm tra tồn kho của một sản phẩm dành cho admin")
    public String checkInventory(CheckInventoryRequest request) {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"))) {
            return "Lỗi: Bạn không có quyền truy cập chức năng kiểm tra tồn kho. Vui lòng đăng nhập với tài khoản Admin.";
        }

        Product product = productRepository.findById(request.productId()).orElse(null);
        if (product == null) {
            return "Không tìm thấy sản phẩm với mã: " + request.productId();
        }
        int totalStock = 0;
        if (product.getProductDetails() != null) {
            totalStock = product.getProductDetails().stream().mapToInt(pd -> pd.getQuantity()).sum();
        }
        return "Sản phẩm " + product.getName() + " hiện còn " + totalStock + " sản phẩm trong kho.";
    }

    @Tool(description = "Kiểm tra phí giao hàng (shipping fee) ước tính")
    public String checkShippingFee(CheckShippingFeeRequest request) {
        return "Phí giao hàng ước tính khoảng 30.000 VNĐ. Miễn phí cho đơn từ 300.000 VNĐ.";
    }
}
