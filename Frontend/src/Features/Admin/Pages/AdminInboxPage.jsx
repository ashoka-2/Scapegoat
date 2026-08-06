import React, { useEffect, useState } from "react";
import { useAdmin } from "../Hooks/useAdmin";
import AdminTableSkeleton from "../Components/Skeletons/AdminTableSkeleton";

const AdminInboxPage = () => {
  const {
    messages,
    messagesTotal,
    messagesPage,
    messagesPages,
    loading,
    fetchAdminMessages,
    toggleMessageRead,
    removeMessage,
  } = useAdmin();

  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAdminMessages({
      type: typeFilter,
      isRead: readFilter,
      page: 1,
    });
  }, [typeFilter, readFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            Communication Inbox
          </span>
          <h1 className="text-2xl font-black text-foreground">Customer Inquiries ({messagesTotal})</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface border border-border-theme rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Inquiries</option>
            <option value="contact">Contact Forms</option>
            <option value="newsletter">Newsletter Signups</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="bg-surface border border-border-theme rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Read Statuses</option>
            <option value="false">Unread Only</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      {/* Inbox List */}
      {loading ? (
        <AdminTableSkeleton />
      ) : (
        <div className="space-y-3">
          {messages?.length > 0 ? (
            messages.map((msg) => {
              const isExpanded = expandedId === msg._id;
              return (
                <div
                  key={msg._id}
                  className={`bg-surface border rounded-2xl p-5 transition space-y-3 shadow-sm ${
                    msg.isRead ? "border-border-theme/60 opacity-85" : "border-accent/40 bg-accent/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                          msg.type === "contact"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                        }`}
                      >
                        <i className={msg.type === "contact" ? "ri-mail-line" : "ri-newspaper-line"} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-foreground">
                            {msg.name || msg.email}
                          </h3>
                          {!msg.isRead && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-500 text-white animate-pulse">
                              UNREAD
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-foreground/40 capitalize">
                            [{msg.type}]
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60">{msg.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMessageRead(msg._id)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          msg.isRead
                            ? "bg-background text-foreground/50 border-border-theme hover:text-foreground"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                        }`}
                        title={msg.isRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        <i className={msg.isRead ? "ri-draft-line" : "ri-checkbox-circle-line"} />
                      </button>

                      <button
                        onClick={() => removeMessage(msg._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition cursor-pointer text-xs font-bold"
                        title="Delete Inquiry"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : msg._id)}
                        className="p-1.5 rounded-lg bg-background border border-border-theme text-foreground/60 hover:text-foreground transition cursor-pointer text-xs font-bold"
                      >
                        <i className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
                      </button>
                    </div>
                  </div>

                  {msg.subject && (
                    <p className="text-xs font-bold text-foreground pt-1">
                      Subject: {msg.subject}
                    </p>
                  )}

                  {isExpanded && msg.content && (
                    <div className="p-4 bg-background/60 rounded-xl border border-border-theme/40 text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap animate-in fade-in">
                      {msg.content}
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-foreground/40 text-right">
                    Received: {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-surface border border-border-theme rounded-2xl p-12 text-center text-foreground/40 italic">
              No inquiries found in inbox.
            </div>
          )}

          {/* Pagination */}
          {messagesPages > 1 && (
            <div className="p-4 bg-surface border border-border-theme rounded-2xl flex items-center justify-between text-xs">
              <span className="text-foreground/50 font-bold">
                Page {messagesPage} of {messagesPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={messagesPage <= 1}
                  onClick={() =>
                    fetchAdminMessages({
                      type: typeFilter,
                      isRead: readFilter,
                      page: messagesPage - 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={messagesPage >= messagesPages}
                  onClick={() =>
                    fetchAdminMessages({
                      type: typeFilter,
                      isRead: readFilter,
                      page: messagesPage + 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminInboxPage;
