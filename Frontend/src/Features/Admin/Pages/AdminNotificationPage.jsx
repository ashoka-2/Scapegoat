import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import customAxios from "../../../utils/axios";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import { usePushNotification } from "../../../Hooks/usePushNotification";

const PRESET_TEMPLATES = [
  {
    name: "🔥 Mega Flash Sale",
    title: "🔥 Mega Flash Sale Live!",
    body: "Get flat 40% OFF on all catalog products. Offer valid for the next 2 hours only!",
    url: "/shop",
  },
  {
    name: "🚚 Free Shipping Offer",
    title: "🚚 Free Shipping on All Orders!",
    body: "Zero delivery charges on every purchase today. Shop your wishlist now.",
    url: "/shop",
  },
  {
    name: "✨ New Trending Arrivals",
    title: "✨ Fresh Drops Just Arrived!",
    body: "Explore the latest curated fashion & essentials in our new collection.",
    url: "/categories",
  },
  {
    name: "🛍️ Cart Recovery Alert",
    title: "🛍️ You Left Items in Your Bag!",
    body: "Complete your order before your favorite items go out of stock.",
    url: "/cart",
  },
];

const AdminNotificationPage = () => {
  const dispatch = useDispatch();
  const { isSubscribed, enableNotifications } = usePushNotification();

  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/shop");
  const [image, setImage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [targetUserId, setTargetUserId] = useState("");

  // Preview Mode: 'mobile' | 'desktop'
  const [previewMode, setPreviewMode] = useState("mobile");

  // History and Stats State
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    buyerSubscribers: 0,
    sellerSubscribers: 0,
  });

  const fetchHistoryAndStats = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await customAxios.get("/api/notifications/admin/history");
      if (data?.success) {
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load notification history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndStats();
  }, []);

  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setUrl(tpl.url);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      dispatch(addToast({ message: "Please fill out both title and body.", type: "error" }));
      return;
    }

    setLoading(true);
    try {
      const { data } = await customAxios.post("/api/notifications/admin/broadcast", {
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || "/",
        image: image.trim() || null,
        targetAudience,
        targetUserId: targetAudience === "single_user" ? targetUserId.trim() : null,
      });

      if (data?.success) {
        dispatch(
          addToast({
            message: `🚀 Broadcast Sent! Delivered to ${data.successCount} of ${data.sentCount} devices.`,
            type: "success",
          })
        );
        setTitle("");
        setBody("");
        setImage("");
        fetchHistoryAndStats();
      }
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || err.message || "Failed to send notification broadcast.",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestToSelf = async () => {
    if (!isSubscribed) {
      const allowed = await enableNotifications();
      if (!allowed) return;
    }

    setTestLoading(true);
    try {
      const { data } = await customAxios.post("/api/notifications/admin/test");
      if (data?.success) {
        dispatch(addToast({ message: "🔔 Test notification sent to your browser!", type: "success" }));
      }
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || err.message || "Failed to send test push.",
          type: "error",
        })
      );
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-accent/10 text-accent text-xl flex items-center justify-center">
              <i className="ri-notification-3-line" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Push Notification Broadcast Center
            </h1>
          </div>
          <p className="text-xs md:text-sm text-foreground/60 mt-1">
            Send real-time instant web push alerts to customers and sellers across mobile & desktop.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSendTestToSelf}
            disabled={testLoading}
            className="px-4 py-2 rounded-2xl bg-surface border border-border-theme text-foreground text-xs font-bold hover:bg-surface/80 active:scale-95 transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <i className={`ri-smartphone-line text-accent ${testLoading ? "animate-pulse" : ""}`} />
            <span>{testLoading ? "Sending Test..." : "Send Test to My Browser"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Total Subscribed Devices</p>
          <p className="text-2xl font-mono font-black text-foreground">{stats.totalSubscribers}</p>
        </div>
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Buyer Devices</p>
          <p className="text-2xl font-mono font-black text-blue-500">{stats.buyerSubscribers}</p>
        </div>
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Seller Devices</p>
          <p className="text-2xl font-mono font-black text-amber-500">{stats.sellerSubscribers}</p>
        </div>
        <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-1 shadow-sm">
          <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Campaigns Sent</p>
          <p className="text-2xl font-mono font-black text-emerald-500">{logs.length}</p>
        </div>
      </div>

      {/* Main Grid: Broadcast Form & Live Mockup Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Templates Bar */}
          <div className="p-5 rounded-3xl bg-surface border border-border-theme space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground/60 flex items-center gap-2">
              <i className="ri-magic-line text-accent" /> One-Click Quick Templates
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-3 py-1.5 rounded-xl bg-background border border-border-theme/70 text-xs font-bold text-foreground/80 hover:text-accent hover:border-accent/40 transition cursor-pointer"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Broadcast Composer Form */}
          <form onSubmit={handleSendBroadcast} className="p-6 rounded-3xl bg-surface border border-border-theme space-y-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground border-b border-border-theme pb-3 flex items-center gap-2">
              <i className="ri-send-plane-fill text-accent" /> Compose Notification
            </h2>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Target Audience</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "all", label: "All Users" },
                  { id: "buyer", label: "Buyers Only" },
                  { id: "seller", label: "Sellers Only" },
                  { id: "single_user", label: "Specific User" },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id)}
                    className={`py-2 px-3 rounded-2xl text-xs font-extrabold border transition cursor-pointer ${
                      targetAudience === aud.id
                        ? "bg-accent text-accent-content border-accent shadow-sm"
                        : "bg-background border-border-theme text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            {/* If Single User Selected: User ID input */}
            {targetAudience === "single_user" && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-xs font-bold text-foreground">User MongoDB ID</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. 66a1b2c3d4e5f67890123456"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-background border border-border-theme text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Notification Title *</label>
                <span className="text-[10px] text-foreground/40 font-mono">{title.length}/65</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🔥 Weekend Sale is Live! Flat 40% Off"
                maxLength={65}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-background border border-border-theme text-xs font-semibold text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Message Body Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Message Body *</label>
                <span className="text-[10px] text-foreground/40 font-mono">{body.length}/180</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Use code SCAPE40 at checkout. Grab your favorite sneakers and hoodies before stock runs out!"
                maxLength={180}
                rows={3}
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-background border border-border-theme text-xs font-medium text-foreground focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Destination URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">On-Click Destination URL</label>
              <div className="flex gap-2 flex-wrap">
                {["/shop", "/categories", "/cart"].map((quickUrl) => (
                  <button
                    key={quickUrl}
                    type="button"
                    onClick={() => setUrl(quickUrl)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                      url === quickUrl
                        ? "bg-accent/10 text-accent border-accent/40 font-black"
                        : "bg-background border-border-theme text-foreground/60"
                    }`}
                  >
                    {quickUrl}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. /shop?category=sneakers"
                className="w-full px-4 py-2.5 rounded-2xl bg-background border border-border-theme text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Optional Banner Image URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Banner / Media Image URL (Optional)</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://ik.imagekit.io/.../banner.jpg"
                className="w-full px-4 py-2.5 rounded-2xl bg-background border border-border-theme text-xs text-foreground focus:outline-none focus:border-accent font-mono"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || !title.trim() || !body.trim()}
              className="w-full py-3.5 rounded-2xl bg-accent text-accent-content font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin text-base" />
              ) : (
                <i className="ri-send-plane-2-fill text-base" />
              )}
              <span>{loading ? "Broadcasting to Devices..." : `Broadcast to ${targetAudience.toUpperCase()}`}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-surface border border-border-theme space-y-4 shadow-sm sticky top-6">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <i className="ri-eye-line text-accent" /> Live Device Preview
              </h3>
              <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border-theme">
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    previewMode === "mobile" ? "bg-accent text-accent-content" : "text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <i className="ri-smartphone-line" /> Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    previewMode === "desktop" ? "bg-accent text-accent-content" : "text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <i className="ri-macbook-line" /> Desktop
                </button>
              </div>
            </div>

            {/* Mobile Lockscreen / Tray Mockup */}
            {previewMode === "mobile" && (
              <div className="w-full mx-auto max-w-[320px] rounded-[38px] p-3.5 bg-neutral-900 border-[6px] border-neutral-800 shadow-2xl text-white space-y-4">
                {/* Mobile Notch & Clock */}
                <div className="flex justify-between items-center px-4 pt-1 text-[10px] text-neutral-400 font-mono">
                  <span>9:41 AM</span>
                  <div className="w-16 h-3 bg-black rounded-full" />
                  <div className="flex items-center gap-1">
                    <i className="ri-wifi-line" />
                    <i className="ri-battery-fill" />
                  </div>
                </div>

                {/* Lockscreen Notification Card */}
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2 shadow-lg animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-accent text-accent-content flex items-center justify-center text-[9px] font-black">
                        S
                      </div>
                      <span className="font-bold tracking-tight text-white uppercase text-[10px]">Scapegoat</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">now</span>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-white line-clamp-1">
                      {title || "🔥 Notification Title Goes Here"}
                    </p>
                    <p className="text-[11px] text-neutral-300 leading-snug line-clamp-3">
                      {body || "This is how your live notification message body will appear on mobile phones."}
                    </p>
                  </div>

                  {image && (
                    <div className="rounded-xl overflow-hidden mt-2 h-28 w-full bg-neutral-800">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 border-t border-white/10">
                    <span>Tap to open: {url || "/"}</span>
                    <i className="ri-arrow-right-s-line" />
                  </div>
                </div>

                <div className="h-4" />
              </div>
            )}

            {/* Desktop OS Toast Mockup */}
            {previewMode === "desktop" && (
              <div className="w-full rounded-2xl p-4 bg-neutral-900 border border-neutral-700 shadow-2xl text-white space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-accent text-accent-content flex items-center justify-center text-xs font-black">
                      S
                    </div>
                    <span className="font-bold text-white text-xs">Google Chrome • Scapegoat</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Just now</span>
                </div>

                <div className="space-y-1 pt-1">
                  <p className="text-xs font-black text-white">{title || "Notification Title Preview"}</p>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    {body || "This is how the desktop Windows & macOS notification toast banner will look to users."}
                  </p>
                </div>

                {image && (
                  <div className="rounded-xl overflow-hidden mt-2 h-24 w-full bg-neutral-800">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 text-xs">
                  <span className="px-2.5 py-1 rounded bg-neutral-800 text-[10px] font-bold text-neutral-300">
                    Target: {url || "/"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="p-6 rounded-3xl bg-surface border border-border-theme space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-theme pb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              Sent Campaigns History ({logs.length})
            </h2>
            <p className="text-xs text-foreground/50">Log of all manual & broadcast push notifications sent from this panel.</p>
          </div>
          <button
            onClick={fetchHistoryAndStats}
            className="px-3 py-1.5 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground/70 hover:text-foreground cursor-pointer transition flex items-center gap-1.5"
          >
            <i className={`ri-refresh-line ${historyLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {historyLoading ? (
          <div className="py-12 flex items-center justify-center text-foreground/50 text-xs">
            <i className="ri-loader-4-line animate-spin text-lg mr-2" /> Loading broadcast logs...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-theme/60 text-foreground/50 uppercase text-[10px] font-black">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Title & Message</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Target URL</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-background/40 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-foreground/60 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs space-y-0.5">
                      <p className="font-extrabold text-foreground">{log.title}</p>
                      <p className="text-[11px] text-foreground/60 line-clamp-1">{log.body}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-background border border-border-theme text-foreground/70">
                        {log.targetAudience}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-accent">
                      {log.url}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {log.successCount} / {log.sentCount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          log.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : log.status === "partial"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-foreground/40 text-xs italic">
            No broadcast notifications sent yet. Use the composer above to launch your first push alert!
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationPage;
