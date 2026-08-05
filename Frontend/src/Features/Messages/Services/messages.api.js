import axios from "../../../utils/axios";

export const submitMessage = (data) => axios.post("/api/messages", data).then((r) => r.data);
export const fetchMessages = () => axios.get("/api/messages").then((r) => r.data);
export const readMessage = (id) => axios.put(`/api/messages/${id}/read`).then((r) => r.data);
export const removeMessage = (id) => axios.delete(`/api/messages/${id}`).then((r) => r.data);
