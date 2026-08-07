import React from "react";

/**
 * Reusable Admin Search & Date Filter Header Toolbar
 * Fully responsive toolbar supporting text search, Single Date & Date Range filtering across Admin pages.
 */
const AdminSearchFilterHeader = ({
  searchQuery = "",
  onSearchChange = () => {},
  dateMode = "all", // "all" | "single" | "range"
  onDateModeChange = () => {},
  singleDate = "",
  onSingleDateChange = () => {},
  startDate = "",
  onStartDateChange = () => {},
  endDate = "",
  onEndDateChange = () => {},
  onClearFilters = () => {},
  totalCount = 0,
  filteredCount = 0,
  placeholder = "Search items by keyword...",
  title = "Management Console",
  subtitle = "Filter and manage records in real-time",
  icon = "ri-search-line",
  extraControls = null,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    dateMode !== "all" ||
    singleDate !== "" ||
    startDate !== "" ||
    endDate !== "";

  return (
    <div className="bg-surface border border-border-theme rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm mb-6 animate-in fade-in duration-300">
      {/* ── Top Header Row: Title, Subtitle, Counter & Extra Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border-theme/40 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
            <i className={`${icon} text-xl`} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              {title}
            </h2>
            <p className="text-[11px] text-foreground/50">{subtitle}</p>
          </div>
        </div>

        {/* Counter Badge, Extra Dropdowns & Reset Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-background border border-border-theme text-[11px] font-mono font-bold text-foreground">
            Total: <strong className="text-accent">{filteredCount}</strong> / {totalCount}
          </span>
          {extraControls}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-extrabold hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Reset all filters"
            >
              <i className="ri-refresh-line text-sm" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Toolbar Controls Row ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2.5 bg-background border border-border-theme rounded-2xl text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition cursor-pointer"
              title="Clear search"
            >
              <i className="ri-close-circle-fill text-sm" />
            </button>
          )}
        </div>

        {/* 2. Date Mode Selector Dropdown */}
        <div className="relative min-w-[170px] shrink-0">
          <i className="ri-calendar-event-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm pointer-events-none" />
          <select
            value={dateMode}
            onChange={(e) => {
              const mode = e.target.value;
              onDateModeChange(mode);
              if (mode === "all") {
                onSingleDateChange("");
                onStartDateChange("");
                onEndDateChange("");
              }
            }}
            className="w-full pl-10 pr-8 py-2.5 bg-background border border-border-theme rounded-2xl text-xs font-semibold text-foreground focus:outline-none focus:border-accent transition appearance-none cursor-pointer"
          >
            <option value="all">📅 Filter: All Dates</option>
            <option value="single">📌 Filter: Single Date</option>
            <option value="range">📆 Filter: Date Range</option>
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 text-sm pointer-events-none" />
        </div>

        {/* 3. Dynamic Date Picker Controls */}
        {dateMode === "single" && (
          <div className="min-w-[150px] shrink-0">
            <input
              type="date"
              value={singleDate}
              onChange={(e) => onSingleDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border-theme rounded-2xl text-xs text-foreground focus:outline-none focus:border-accent font-mono transition"
              title="Select exact date"
            />
          </div>
        )}

        {dateMode === "range" && (
          <div className="flex items-center gap-1.5 min-w-[260px] shrink-0">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              placeholder="From"
              className="w-1/2 px-2.5 py-2 bg-background border border-border-theme rounded-2xl text-[11px] text-foreground focus:outline-none focus:border-accent font-mono transition"
              title="Start Date"
            />
            <span className="text-foreground/40 text-xs font-bold shrink-0">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              placeholder="To"
              className="w-1/2 px-2.5 py-2 bg-background border border-border-theme rounded-2xl text-[11px] text-foreground focus:outline-none focus:border-accent font-mono transition"
              title="End Date"
            />
          </div>
        )}
      </div>

      {/* ── Active Filter Tags Row ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-theme/30 text-[10px]">
          <span className="text-foreground/50 font-bold uppercase tracking-wider">
            Active Filters:
          </span>
          {searchQuery && (
            <span className="px-2.5 py-0.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-semibold flex items-center gap-1">
              Search: "{searchQuery}"
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="hover:text-rose-500 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}

          {dateMode === "single" && singleDate && (
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold flex items-center gap-1">
              Date: {singleDate}
              <button
                type="button"
                onClick={() => onSingleDateChange("")}
                className="hover:text-rose-500 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}

          {dateMode === "range" && (startDate || endDate) && (
            <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 font-semibold flex items-center gap-1">
              Range: {startDate || "Beginning"} to {endDate || "Today"}
              <button
                type="button"
                onClick={() => {
                  onStartDateChange("");
                  onEndDateChange("");
                }}
                className="hover:text-rose-500 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSearchFilterHeader;
