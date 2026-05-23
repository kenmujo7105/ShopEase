import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import orderApi from '../api/orderApi';

export default function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Gửi toàn bộ query params tới backend để verify
        const queryString = searchParams.toString();
        const res = await orderApi.getVNPayReturn(queryString);

        if (res.code === 1000) {
          setStatus('success');
          setOrderData(res.data);
        } else {
          setStatus('failed');
          setOrderData(res.data);
        }
      } catch {
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Đang xác thực thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="max-w-md w-full">
        {status === 'success' ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-green-100">
            {/* Success Animation */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 animate-bounce-once">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-green-400 opacity-20 animate-ping" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-500 mb-6">
              Đơn hàng của bạn đã được thanh toán qua VNPay và đang chờ xử lý.
            </p>

            {orderData?.orderId && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-400 mb-1">Mã đơn hàng</p>
                <p className="text-sm font-mono font-semibold text-gray-700 break-all">{orderData.orderId}</p>
              </div>
            )}

            <div className="space-y-3">
              <Link
                to={orderData?.orderId ? `/orders/${orderData.orderId}` : '/orders'}
                className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200"
              >
                <ShoppingBag className="w-4 h-4 inline mr-2" />
                Xem đơn hàng
              </Link>
              <Link
                to="/"
                className="block w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            {/* Failed Animation */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                <XCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-500 mb-6">
              Giao dịch không thành công hoặc đã bị hủy. Đơn hàng vẫn được lưu và bạn có thể thanh toán lại.
            </p>

            {orderData?.orderId && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-400 mb-1">Mã đơn hàng</p>
                <p className="text-sm font-mono font-semibold text-gray-700 break-all">{orderData.orderId}</p>
                {orderData?.responseCode && (
                  <p className="text-xs text-red-400 mt-1">Mã lỗi: {orderData.responseCode}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Link
                to="/orders"
                className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
              >
                <ShoppingBag className="w-4 h-4 inline mr-2" />
                Xem đơn hàng & Thanh toán lại
              </Link>
              <Link
                to="/"
                className="block w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Custom animation */}
      <style>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
