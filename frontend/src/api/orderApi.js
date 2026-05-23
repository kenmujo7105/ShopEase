import axiosClient from './axiosClient';

const orderApi = {
  create: (data) => axiosClient.post('/order', data),
  preview: (data) => axiosClient.post('/order/preview', data),
  getById: (id) => axiosClient.get(`/order/${id}`),
  getAll: () => axiosClient.get('/order/all'),
  getStatusList: () => axiosClient.get('/order/status'),
  updateStatus: (orderId, data) => axiosClient.patch(`/order/${orderId}/update-status`, data),
  delete: (orderId) => axiosClient.delete(`/order/${orderId}`),

  // VNPay Payment
  createVNPayUrl: (orderId) => axiosClient.post(`/payment/vnpay/create-url?orderId=${orderId}`),
  getVNPayReturn: (queryString) => axiosClient.get(`/payment/vnpay/return?${queryString}`),
};

export default orderApi;
