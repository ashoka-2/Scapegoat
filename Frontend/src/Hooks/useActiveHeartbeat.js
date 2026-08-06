import { useEffect } from "react";
import { useSelector } from "react-redux";
import socket from "../utils/socket";
import { getClientDeviceInfo } from "../utils/deviceDetector";

export const useActiveHeartbeat = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user || !user._id) return;

    let heartbeatTimer = null;

    const sendHeartbeat = async () => {
      try {
        const deviceInfo = await getClientDeviceInfo();
        socket.emit("client_heartbeat", {
          userId: user._id,
          role: user.role,
          ...deviceInfo,
        });
      } catch (err) {}
    };

    // Send immediately on mount
    sendHeartbeat();

    // Send every 20 seconds
    heartbeatTimer = setInterval(sendHeartbeat, 20000);

    // Send on window focus (user switches tabs back to application)
    const handleFocus = () => sendHeartbeat();
    window.addEventListener("focus", handleFocus);

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);
};
