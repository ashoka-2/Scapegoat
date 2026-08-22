import React from "react";
import { motion } from "framer-motion";

const AIChatSidebar = ({
  sessions = [],
  activeSessionId,
  loading,
  quota,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onCloseMobile,
}) => {
  return (
    <aside className="w-full md:w-72 bg-surface/95 backdrop-blur-xl border-r border-border-theme flex flex-col justify-between h-full p-4 select-none shrink-0">
      {/* Top Header & New Chat Action */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-accent text-accent-content flex items-center justify-center font-black text-xs shadow-md shadow-accent/25">
              AI
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
              Fashion Threads
            </h2>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden w-7 h-7 rounded-full bg-background border border-border-theme flex items-center justify-center text-foreground hover:bg-surface"
            >
              <i className="ri-close-line text-sm" />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile?.();
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-accent text-accent-content text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
        >
          <i className="ri-add-line text-sm" />
          <span>New AI Conversation</span>
        </button>

        {/* ── Daily Quota Pill ── */}
        {quota && (
          <div className="p-3 rounded-2xl bg-background/70 border border-border-theme/60 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-accent">
                <i className="ri-flashlight-fill" />
                <span>Daily Quota</span>
              </span>
              <span className="font-mono text-foreground font-black">
                {quota.isAdmin ? "Unlimited" : `${quota.chatRemaining}/${quota.chatLimit}`}
              </span>
            </div>
            <div className="w-full h-1 bg-border-theme/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{
                  width: quota.isAdmin
                    ? "100%"
                    : `${Math.min(100, (quota.chatRemaining / (quota.chatLimit || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[9px] text-foreground/40 font-mono">
              Resets midnight UTC
            </p>
          </div>
        )}
      </div>

      {/* ── Thread History List ── */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1.5 scrollbar-none my-2">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 block px-2 mb-1">
          Recent Styling Sessions
        </span>

        {loading ? (
          <div className="space-y-2 px-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-background/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-foreground/40 space-y-1">
            <i className="ri-chat-smile-2-line text-2xl text-foreground/20 block" />
            <span>No saved threads yet.</span>
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = activeSessionId === sess._id;
            return (
              <motion.div
                key={sess._id}
                whileHover={{ x: 2 }}
                onClick={() => {
                  onSelectSession(sess._id);
                  onCloseMobile?.();
                }}
                className={`group relative flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition ${
                  isActive
                    ? "bg-accent/15 text-accent border border-accent/30 font-bold"
                    : "text-foreground/70 hover:bg-background/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <i className={isActive ? "ri-chat-4-fill text-accent" : "ri-chat-3-line text-foreground/40"} />
                  <span className="truncate">{sess.title || "Fashion Conversation"}</span>
                </div>

                {/* Delete Thread Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(sess._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-foreground/40 flex items-center justify-center text-xs transition cursor-pointer"
                  title="Delete chat thread"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-border-theme/40 text-[10px] text-foreground/40 font-mono text-center">
        ScapeGoat AI • Powered by Multimodal LLMs
      </div>
    </aside>
  );
};

export default AIChatSidebar;
