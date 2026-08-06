import { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "../utils/socket";
import { getClientDeviceInfo } from "../utils/deviceDetector";

export const useActiveHeartbeat = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    let heartbeatTimer = null;

    const sendHeartbeat = async () => {
      try {
        const deviceInfo = await getClientDeviceInfo();
        const payload = user?._id
          ? {
              userId: user._id,
              fullname: user.fullname || user.username || "Registered User",
              role: user.role || "buyer",
              email: user.email || null,
              profilePic: user.profilePic || null,
              isGuest: false,
              ...deviceInfo,
            }
          : {
              userId: null,
              fullname: "Guest Visitor",
              role: "guest",
              isGuest: true,
              ...deviceInfo,
            };

        socket.emit("client_heartbeat", payload);
      } catch (err) {}
    };

    // Send immediately on mount
    sendHeartbeat();

    // Send every 15 seconds
    heartbeatTimer = setInterval(sendHeartbeat, 15000);

    // Send on window focus or touch
    const handleFocus = () => sendHeartbeat();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("touchstart", handleFocus, { passive: true });

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("touchstart", handleFocus);
    };
  }, [user]);
};
