import customAxios from "../../../utils/axios";

export const submitMessage = (data) => customAxios.post("/api/messages", data).then((r) => r.data);
export const fetchMessages = () => customAxios.get("/api/messages").then((r) => r.data);
export const readMessage = (id) => customAxios.put(`/api/messages/${id}/read`).then((r) => r.data);
export const removeMessage = (id) => customAxios.delete(`/api/messages/${id}`).then((r) => r.data);
