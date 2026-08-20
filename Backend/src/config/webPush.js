import webpush from "web-push";
import { config } from "./config.js";

if (config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        config.VAPID_SUBJECT,
        config.VAPID_PUBLIC_KEY,
        config.VAPID_PRIVATE_KEY
    );
    console.log("🔔 [Web Push] VAPID details configured successfully");
} else {
    console.warn("⚠️ [Web Push] VAPID keys missing in configuration.");
}

export default webpush;
