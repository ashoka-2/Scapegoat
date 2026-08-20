import customAxios from "../../../utils/axios";

export const createOrderApi = (data) => customAxios.post("/api/orders", data).then((r) => r.data);
export const createRazorpayOrderApi = (data) => customAxios.post("/api/orders/razorpay/create-order", data).then((r) => r.data);
export const verifyRazorpayPaymentApi = (data) => customAxios.post("/api/orders/razorpay/verify", data).then((r) => r.data);
export const fetchMyOrdersApi = () => customAxios.get("/api/orders/my-orders").then((r) => r.data);
export const fetchSellerOrdersApi = () => customAxios.get("/api/orders/seller-orders").then((r) => r.data);
export const fetchOrderByIdApi = (id) => customAxios.get(`/api/orders/${id}`).then((r) => r.data);
export const updateOrderStatusApi = (id, status) => customAxios.put(`/api/orders/${id}/status`, { status }).then((r) => r.data);
export const cancelMyOrderApi = (id) => customAxios.put(`/api/orders/${id}/cancel`).then((r) => r.data);
