import { useDispatch } from "react-redux";
import { setMessages, prependMessage, markRead, removeMessage, setLoading } from "../State/messages.slice";
import * as api from "../Services/messages.api";
import { addToast } from "../../../utils/toast.slice";

export const useMessages = () => {
  const dispatch = useDispatch();

  const handleFetchMessages = async () => {
    dispatch(setLoading(true));
    try {
      const data = await api.fetchMessages();
      dispatch(setMessages({ messages: data.messages, unreadCount: data.unreadCount }));
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmitMessage = async (formData) => {
    try {
      await api.submitMessage(formData);
      dispatch(addToast({ message: "Message sent successfully! We'll be in touch.", type: "success" }));
    } catch (e) {
      dispatch(addToast({ message: "Failed to send message. Please try again.", type: "error" }));
      throw e;
    }
  };

  const handleMarkRead = async (id) => {
    try {
      dispatch(markRead(id));
      await api.readMessage(id);
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      dispatch(removeMessage(id));
      await api.removeMessage(id);
    } catch (e) {
      dispatch(addToast({ message: "Failed to delete message.", type: "error" }));
    }
  };

  const handleRealtimeMessage = (msg) => {
    dispatch(prependMessage(msg));
  };

  return {
    handleFetchMessages,
    handleSubmitMessage,
    handleMarkRead,
    handleDeleteMessage,
    handleRealtimeMessage,
  };
};
