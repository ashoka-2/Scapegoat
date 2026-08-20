import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotification } from "../Hooks/usePushNotification.js";

const NotificationBanner = () => {
    const { supported, permission, isSubscribed, loading, enableNotifications } = usePushNotification();
    const [dismissed, setDismissed] = useState(() => {
        return localStorage.getItem("scapegoat_push_prompt_dismissed") === "true";
    });

    // Only show if supported, not yet subscribed, and permission is default (not denied)
    const shouldShow = supported && !isSubscribed && permission === "default" && !dismissed;

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem("scapegoat_push_prompt_dismissed", "true");
    };

    const handleAllow = async () => {
        const ok = await enableNotifications();
        if (ok) {
            setDismissed(true);
        }
    };

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed bottom-5 right-5 z-50 max-w-sm w-full p-4 rounded-3xl bg-surface/90 backdrop-blur-xl border border-border-theme shadow-2xl space-y-3"
                >
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center text-xl shrink-0">
                            <i className="ri-notification-3-line animate-bounce" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <h4 className="font-extrabold text-sm text-foreground">
                                Enable Order & Deal Alerts
                            </h4>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Get instant mobile notifications when your order is shipped, out for delivery, or when flash discounts drop!
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-foreground/40 hover:text-foreground p-1 transition cursor-pointer"
                            title="Dismiss"
                        >
                            <i className="ri-close-line text-lg" />
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-theme/40">
                        <button
                            onClick={handleDismiss}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-foreground/60 hover:text-foreground transition cursor-pointer"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleAllow}
                            disabled={loading}
                            className="px-4 py-1.5 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {loading ? (
                                <i className="ri-loader-4-line animate-spin" />
                            ) : (
                                <i className="ri-check-line" />
                            )}
                            <span>{loading ? "Enabling..." : "Allow Notifications"}</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationBanner;
