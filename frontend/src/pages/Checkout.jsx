import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Banknote, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import orderApi from '../api/orderApi';
import userApi from '../api/userApi';
import { formatCurrency } from '../utils/helpers';

export default function Checkout() {
  const { items, totalPrice, fetchCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      userApi.getAddresses(user.id).then(res => {
        const addrs = res.data || [];
        setAddresses(addrs);
        const defaultAddr = addrs.find(a => a.isDefault || a.isIsDefault) || addrs[0];
        if (defaultAddr) setSelectedAddress(defaultAddr);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (selectedAddress && items.length > 0) {
      const orderItems = items.map(i => ({
        detailId: i.detail?.id,
        num: i.num,
        imageUrl: i.item?.imageUrl,
        name: i.item?.name,
      }));
      const shippingAddress = {
        province: selectedAddress.province,
        provinceId: selectedAddress.provinceId,
        district: selectedAddress.district,
        districtId: selectedAddress.districtId,
        ward: selectedAddress.ward,
        wardId: selectedAddress.wardId,
        info: selectedAddress.info,
        phone: selectedAddress.phone,
        receiverName: selectedAddress.receiverName,
      };
      orderApi.preview({ items: orderItems, shippingAddress, paymentMethod, note })
        .then(res => setPreview(res.data))
        .catch(() => {});
    }
  }, [selectedAddress, items, paymentMethod, note]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    setIsSubmitting(true);
    try {
      const orderItems = items.map(i => ({
        detailId: i.detail?.id,
        num: i.num,
        imageUrl: i.item?.imageUrl,
        name: i.item?.name,
      }));
      const shippingAddress = {
        province: selectedAddress.province,
        provinceId: selectedAddress.provinceId,
        district: selectedAddress.district,
        districtId: selectedAddress.districtId,
        ward: selectedAddress.ward,
        wardId: selectedAddress.wardId,
        info: selectedAddress.info,
        phone: selectedAddress.phone,
        receiverName: selectedAddress.receiverName,
      };
      const res = await orderApi.create({ items: orderItems, shippingAddress, paymentMethod, note });
      const order = res.data;

      // Nếu VNPay → tạo payment URL và redirect
      if (paymentMethod === 'VNPAY' && order?.id) {
        toast.loading('Đang chuyển đến cổng thanh toán VNPay...', { duration: 3000 });
        try {
          const vnpayRes = await orderApi.createVNPayUrl(order.id);
          const paymentUrl = vnpayRes.data?.paymentUrl;
          if (paymentUrl) {
            await fetchCart();
            window.location.href = paymentUrl;
            return;
          } else {
            toast.error('Không thể tạo link thanh toán VNPay');
          }
        } catch {
          toast.error('Lỗi kết nối VNPay. Đơn hàng đã tạo, bạn có thể thanh toán lại sau.');
          navigate('/orders');
          return;
        }
      }

      // Flow thường (CASH, BANK)
      toast.success('Đặt hàng thành công!');
      await fetchCart();
      navigate('/orders');
    } catch {
      toast.error('Lỗi khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary-500" /> Địa chỉ giao hàng
            </h2>
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có địa chỉ. Vui lòng thêm địa chỉ trong phần <a href="/profile" className="text-primary-500 underline">tài khoản</a>.</p>
            ) : (
              <div className="space-y-2">
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedAddress?.id === addr.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{addr.receiverName}</span>
                      <span className="text-gray-400 text-sm">{addr.phone}</span>
                      {(addr.isDefault || addr.isIsDefault) && (
                        <span className="badge badge-delivered text-[10px]">Mặc định</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {addr.info}, {addr.ward}, {addr.district}, {addr.province}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary-500" /> Phương thức thanh toán
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'CASH', label: 'Tiền mặt', icon: Banknote, desc: 'Thanh toán khi nhận hàng' },
                { value: 'BANK', label: 'Chuyển khoản', icon: CreditCard, desc: 'Chuyển khoản ngân hàng' },
                { value: 'VNPAY', label: 'VNPay', icon: Wallet, desc: 'Thanh toán qua VNPay', highlight: true },
              ].map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`relative flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    paymentMethod === pm.value
                      ? pm.value === 'VNPAY'
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                        : 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {pm.highlight && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                      Online
                    </span>
                  )}
                  <pm.icon className={`w-5 h-5 ${
                    paymentMethod === pm.value
                      ? pm.value === 'VNPAY' ? 'text-blue-500' : 'text-primary-500'
                      : 'text-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{pm.label}</p>
                    <p className="text-xs text-gray-400">{pm.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* VNPay Info Banner */}
            {paymentMethod === 'VNPAY' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💳 Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất. Hỗ trợ thẻ ATM/Internet Banking, Visa/Mastercard, QR Code.
                </p>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3">Ghi chú</h2>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú cho đơn hàng (tùy chọn)..."
              className="input-field h-24 resize-none"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm h-fit sticky top-20">
          <h3 className="font-bold text-gray-800 mb-4">Đơn hàng ({items.length} sản phẩm)</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <img src={item.item?.imageUrl || 'https://via.placeholder.com/48'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 line-clamp-1">{item.item?.name}</p>
                  <p className="text-xs text-gray-400">{item.detail?.info} x{item.num}</p>
                </div>
                <span className="text-sm font-medium text-primary-500 whitespace-nowrap">{formatCurrency(item.detail?.price * item.num)}</span>
              </div>
            ))}
          </div>
          <hr className="mb-3" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Tạm tính</span>
              <span>{formatCurrency(preview?.subTotal || totalPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Phí vận chuyển</span>
              <span>{preview?.shippingFee ? formatCurrency(preview.shippingFee) : '—'}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-primary-500">{formatCurrency(preview?.total || totalPrice)}</span>
            </div>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || !selectedAddress}
            className={`w-full mt-6 font-semibold py-3 rounded-xl transition-all disabled:opacity-50 ${
              paymentMethod === 'VNPAY'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-200'
                : 'btn-primary'
            }`}
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : paymentMethod === 'VNPAY'
                ? '💳 Thanh toán qua VNPay'
                : 'Đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
