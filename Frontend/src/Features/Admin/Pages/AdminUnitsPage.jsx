import React, { useEffect, useState } from "react";
import { useUnit } from "../../Units/Hooks/useUnit";
import AdminUnitsSkeleton from "../Components/Skeletons/AdminUnitsSkeleton";
import AdminSearchFilterHeader from "../Components/AdminSearchFilterHeader";

const AdminUnitsPage = () => {
  const {
    units,
    loading,
    handleFetchUnits,
    handleCreateUnit,
    handleUpdateUnit,
    handleDeleteUnit,
  } = useUnit();

  // Search & Date Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateMode, setDateMode] = useState("all");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    handleFetchUnits();
  }, [handleFetchUnits]);

  const filteredUnits = units.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const abbrMatch = u.abbreviation?.toLowerCase().includes(q);
      const descMatch = u.description?.toLowerCase().includes(q);
      if (!nameMatch && !abbrMatch && !descMatch) return false;
    }

    if (u.createdAt) {
      const uDate = new Date(u.createdAt).toISOString().split("T")[0];
      if (dateMode === "single" && singleDate) {
        if (uDate !== singleDate) return false;
      } else if (dateMode === "range") {
        if (startDate && uDate < startDate) return false;
        if (endDate && uDate > endDate) return false;
      }
    }

    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setDateMode("all");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setAbbreviation("");
    setDescription("");
    setIsActive(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingId(u._id);
    setName(u.name);
    setAbbreviation(u.abbreviation || "");
    setDescription(u.description || "");
    setIsActive(u.isActive);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Unit name is required.");
      return;
    }

    if (!abbreviation.trim()) {
      setFormError("Unit abbreviation is required.");
      return;
    }

    setSaving(true);
    let result;
    const unitData = {
      name: name.trim(),
      abbreviation: abbreviation.trim(),
      description,
      isActive,
    };

    if (editingId) {
      result = await handleUpdateUnit(editingId, unitData);
    } else {
      result = await handleCreateUnit(unitData);
    }

    setSaving(false);
    if (result?.success) {
      setIsModalOpen(false);
    } else if (result?.error) {
      setFormError(result.error);
    }
  };

  const onDeleteClick = async (id, unitName) => {
    if (!window.confirm(`Are you sure you want to delete unit "${unitName}"?`)) return;
    await handleDeleteUnit(id);
  };

  return (
    <div className="space-y-6 font-sans">
      <AdminSearchFilterHeader
        title="Units of Measurement"
        subtitle="Search units by name, abbreviation & filter by created date"
        icon="ri-ruler-line"
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
        totalCount={units.length}
        filteredCount={filteredUnits.length}
        placeholder="Search unit name, symbol..."
        extraControls={
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-add-line text-sm" /> Add Unit
          </button>
        }
      />

      {/* Units Content */}
      {loading && units.length === 0 ? (
        <AdminUnitsSkeleton />
      ) : (
        <div className="bg-surface border border-border-theme rounded-3xl p-3.5 sm:p-6 shadow-sm overflow-hidden">
          {filteredUnits.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/40 italic">
              No units match the active filter. Click "Reset" to clear filters.
            </div>
          ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-border-theme text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider">
                  <th className="pb-3 px-3 whitespace-nowrap">Unit Name</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Abbreviation</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Description</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Status</th>
                  <th className="pb-3 px-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 font-medium">
                {filteredUnits.map((u) => (
                  <tr key={u._id} className="hover:bg-background/40 transition">
                    <td className="py-3.5 px-3 font-bold text-foreground whitespace-nowrap">{u.name}</td>
                    <td className="py-3.5 px-3 font-mono text-accent font-extrabold whitespace-nowrap">{u.abbreviation}</td>
                    <td className="py-3.5 px-3 text-foreground/60 max-w-xs truncate whitespace-nowrap">
                      {u.description || "—"}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            u.isActive !== false
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {u.isActive !== false ? "Active" : "Inactive"}
                        </span>
                        {u.isLocked && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-1">
                            <i className="ri-lock-line" /> Locked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateUnit(u._id, { isLocked: !u.isLocked })}
                          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                            u.isLocked
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500 hover:text-white"
                              : "bg-surface border-border-theme text-foreground/50 hover:text-foreground"
                          }`}
                          title={u.isLocked ? "Unlock Unit" : "Lock Unit (Prevents Edit/Delete)"}
                        >
                          <i className={u.isLocked ? "ri-lock-line" : "ri-lock-unlock-line"} />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg bg-surface border border-border-theme hover:border-accent text-foreground text-xs transition cursor-pointer"
                          title="Edit Unit"
                        >
                          <i className="ri-pencil-line" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(u._id, u.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
                          title="Delete Unit"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}

      {/* Screen-Centered Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <h2 className="text-lg font-black text-foreground">
                {editingId ? "Edit Unit" : "Create New Unit"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-foreground/40 hover:text-foreground text-xl cursor-pointer"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Unit Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kilogram, Meter, Piece"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Abbreviation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. kg, m, pc"
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the measurement unit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="unitIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <label htmlFor="unitIsActive" className="text-xs text-foreground cursor-pointer">
                    Is Active
                  </label>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-background text-foreground/70 font-bold hover:bg-surface transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Unit" : "Create Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUnitsPage;
