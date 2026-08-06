import React, { useEffect, useState } from "react";
import { useUnit } from "../../Units/Hooks/useUnit";
import AdminUnitsSkeleton from "../Components/Skeletons/AdminUnitsSkeleton";

const AdminUnitsPage = () => {
  const {
    units,
    loading,
    handleFetchUnits,
    handleCreateUnit,
    handleUpdateUnit,
    handleDeleteUnit,
  } = useUnit();

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
      abbreviation: abbreviation.trim().toLowerCase(),
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            Catalog Metadata
          </span>
          <h1 className="text-2xl font-black text-foreground">Units of Measurement</h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-2"
        >
          <i className="ri-add-line text-sm" /> Add New Unit
        </button>
      </div>

      {/* Units Content */}
      {loading && units.length === 0 ? (
        <AdminUnitsSkeleton />
      ) : (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 shadow-sm overflow-hidden">
          {units.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/40 italic">
              No units created yet. Click "Add New Unit" to get started.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-theme text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider">
                  <th className="pb-3 px-3">Unit Name</th>
                  <th className="pb-3 px-3">Abbreviation</th>
                  <th className="pb-3 px-3">Description</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 font-medium">
                {units.map((u) => (
                  <tr key={u._id} className="hover:bg-background/40 transition">
                    <td className="py-3.5 px-3 font-bold text-foreground">{u.name}</td>
                    <td className="py-3.5 px-3 font-mono text-accent font-extrabold">{u.abbreviation}</td>
                    <td className="py-3.5 px-3 text-foreground/60 max-w-xs truncate">
                      {u.description || "—"}
                    </td>
                    <td className="py-3.5 px-3">
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
                    <td className="py-3.5 px-3 text-right space-x-2">
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
