export function formatCurrency(amount) {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusBadgeClass(status) {
  const map = {
    PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    SHIPPED: 'badge-shipped',
    DELIVERED: 'badge-delivered',
    CANCELLED: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
}

export function getStatusLabel(status) {
  const map = {
    PENDING_PAYMENT: '⏳ Chờ thanh toán',
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
  };
  return map[status] || status;
}

export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
