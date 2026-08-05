import axios from "../../../utils/axios";

export const createOrderApi = (data) => axios.post("/api/orders", data).then((r) => r.data);
export const fetchMyOrdersApi = () => axios.get("/api/orders/my-orders").then((r) => r.data);
export const fetchSellerOrdersApi = () => axios.get("/api/orders/seller-orders").then((r) => r.data);
export const fetchOrderByIdApi = (id) => axios.get(`/api/orders/${id}`).then((r) => r.data);
export const updateOrderStatusApi = (id, status) => axios.put(`/api/orders/${id}/status`, { status }).then((r) => r.data);
export const cancelMyOrderApi = (id) => axios.put(`/api/orders/${id}/cancel`).then((r) => r.data);
