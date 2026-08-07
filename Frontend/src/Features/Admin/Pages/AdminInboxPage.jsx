import React, { useEffect, useState } from "react";
import { useAdmin } from "../Hooks/useAdmin";
import AdminInboxSkeleton from "../Components/Skeletons/AdminInboxSkeleton";
import AdminSearchFilterHeader from "../Components/AdminSearchFilterHeader";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [dateMode, setDateMode] = useState("all"); // "all" | "single" | "range"
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAdminMessages({
      type: typeFilter,
      isRead: readFilter,
      page: 1,
    });
  }, [typeFilter, readFilter]);

  const filteredMessages = messages.filter((msg) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = msg.name?.toLowerCase().includes(q);
      const emailMatch = msg.email?.toLowerCase().includes(q);
      const subjectMatch = msg.subject?.toLowerCase().includes(q);
      const bodyMatch = msg.message?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !subjectMatch && !bodyMatch) return false;
    }

    if (msg.createdAt) {
      const mDate = new Date(msg.createdAt).toISOString().split("T")[0];
      if (dateMode === "single" && singleDate) {
        if (mDate !== singleDate) return false;
      } else if (dateMode === "range") {
        if (startDate && mDate < startDate) return false;
        if (endDate && mDate > endDate) return false;
      }
    }

    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setReadFilter("all");
    setDateMode("all");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search and Date Filter Header */}
      <AdminSearchFilterHeader
        title="Communication Inbox"
        subtitle="Search customer inquiries by sender, email, subject & filter by received date"
        icon="ri-mail-line"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateMode={dateMode}
        onDateModeChange={setDateMode}
        singleDate={singleDate}
        onSingleDateChange={setSingleDate}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
        totalCount={messagesTotal || messages.length}
        filteredCount={filteredMessages.length}
        placeholder="Search sender, email, subject, text..."
        extraControls={
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">All Inquiries</option>
              <option value="contact">Contact Forms</option>
              <option value="newsletter">Newsletter Signups</option>
            </select>

            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="all">All Read Statuses</option>
              <option value="false">Unread Only</option>
              <option value="true">Read</option>
            </select>
          </div>
        }
      />

      {/* Inbox List */}
      {loading ? (
        <AdminInboxSkeleton />
      ) : (
        <div className="space-y-3">
          {filteredMessages?.length > 0 ? (
            filteredMessages.map((msg) => {
              const isExpanded = expandedId === msg._id;
              return (
                <div
                  key={msg._id}
                  className={`bg-surface border rounded-2xl p-3.5 sm:p-5 transition space-y-3 shadow-sm ${
                    msg.isRead ? "border-border-theme/60 opacity-85" : "border-accent/40 bg-accent/5"
                  }`}
                >
                  {/* Top Bar: Sender Info & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                          msg.type === "contact"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                        }`}
                      >
                        <i className={msg.type === "contact" ? "ri-mail-line" : "ri-newspaper-line"} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                          <h3 className="font-extrabold text-xs sm:text-sm text-foreground truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                            {msg.name || msg.email}
                          </h3>
                          {!msg.isRead && (
                            <span className="text-[8px] xs:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse shrink-0">
                              UNREAD
                            </span>
                          )}
                          <span className="text-[9px] xs:text-[10px] font-mono text-foreground/40 capitalize shrink-0">
                            [{msg.type}]
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground/60 truncate max-w-[200px] xs:max-w-[280px] sm:max-w-none">
                          {msg.email}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => toggleMessageRead(msg._id)}
                        className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          msg.isRead
                            ? "bg-background text-foreground/50 border-border-theme hover:text-foreground"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                        }`}
                        title={msg.isRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        <i className={msg.isRead ? "ri-draft-line" : "ri-checkbox-circle-line"} />
                        <span className="hidden md:inline text-[11px]">
                          {msg.isRead ? "Unread" : "Read"}
                        </span>
                      </button>

                      <button
                        onClick={() => removeMessage(msg._id)}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition cursor-pointer text-xs font-bold flex items-center gap-1"
                        title="Delete Inquiry"
                      >
                        <i className="ri-delete-bin-line" />
                        <span className="hidden md:inline text-[11px]">Delete</span>
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : msg._id)}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-background border border-border-theme text-foreground/60 hover:text-foreground transition cursor-pointer text-xs font-bold flex items-center gap-1"
                      >
                        <i className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
                        <span className="hidden md:inline text-[11px]">
                          {isExpanded ? "Hide" : "View"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {msg.subject && (
                    <p className="text-xs font-bold text-foreground pt-1 break-words">
                      Subject: {msg.subject}
                    </p>
                  )}

                  {isExpanded && msg.content && (
                    <div className="p-3 sm:p-4 bg-background/60 rounded-xl border border-border-theme/40 text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap animate-in fade-in break-words">
                      {msg.content}
                    </div>
                  )}

                  <div className="text-[9px] xs:text-[10px] font-mono text-foreground/40 text-right">
                    Received: {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-surface border border-border-theme rounded-2xl p-8 sm:p-12 text-center text-foreground/40 italic text-xs sm:text-sm">
              No inquiries found in inbox.
            </div>
          )}

          {/* Responsive Pagination */}
          {messagesPages > 1 && (
            <div className="p-4 bg-surface border border-border-theme rounded-2xl flex flex-col xs:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-foreground/50 font-bold">
                Page {messagesPage} of {messagesPages}
              </span>
              <div className="flex gap-2 w-full xs:w-auto justify-end">
                <button
                  disabled={messagesPage <= 1}
                  onClick={() =>
                    fetchAdminMessages({
                      type: typeFilter,
                      isRead: readFilter,
                      page: messagesPage - 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer flex-1 xs:flex-none text-center"
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
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer flex-1 xs:flex-none text-center"
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
