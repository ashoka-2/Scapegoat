import React, { useRef, useState, useLayoutEffect } from "react";

const ContextMenu = ({
  x,
  y,
  targetId,
  elements,
  moveZIndex,
  updateSelectedElement,
  handleDuplicateElement,
  handleDeleteElementById,
  handleAddText,
  handleAddButton,
  handleAddTimer,
  handleAlign,
}) => {
  const targetEl = elements.find((item) => item.id === targetId);
  const menuRef = useRef(null);
  const [adjustedPos, setAdjustedPos] = useState({ top: y, left: x });

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (x + rect.width > screenWidth) left = screenWidth - rect.width - 12;
    if (left < 12) left = 12;

    if (y + rect.height > screenHeight) top = screenHeight - rect.height - 12;
    if (top < 12) top = 12;

    setAdjustedPos({ top, left });
  }, [x, y, targetId]);

  const MenuBtn = ({ onClick, icon, label, shortcut, danger }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors text-xs ${
        danger
          ? "hover:bg-red-500/15 text-red-400 hover:text-red-300"
          : "hover:bg-surface-variant/30 text-foreground/80 hover:text-foreground"
      }`}
    >
      <i className={`${icon} text-sm w-4 flex-shrink-0 ${danger ? "" : "text-foreground/45"}`} />
      <span className="flex-1 font-bold">{label}</span>
      {shortcut && <span className="text-[9px] text-foreground/30 font-mono">{shortcut}</span>}
    </button>
  );

  const Divider = () => <div className="h-[1px] bg-border-theme/20 my-1 mx-1" />;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedPos.top}px`, left: `${adjustedPos.left}px` }}
      className="fixed bg-surface/95 border border-border-theme/40 rounded-2xl shadow-2xl p-1.5 z-[99999] min-w-[180px] backdrop-blur-xl text-xs space-y-0.5 text-foreground"
    >
      {targetId ? (
        <>
          {/* Layer Ordering */}
          <div className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-foreground/40">Layer Order</div>
          <MenuBtn onClick={() => moveZIndex("front")} icon="ri-bring-to-front" label="Bring to Front" shortcut="Ctrl+Shift+]" />
          <MenuBtn onClick={() => moveZIndex("forward")} icon="ri-bring-forward" label="Move Forward" shortcut="Ctrl+]" />
          <MenuBtn onClick={() => moveZIndex("backward")} icon="ri-send-backward" label="Move Backward" shortcut="Ctrl+[" />
          <MenuBtn onClick={() => moveZIndex("back")} icon="ri-send-to-back" label="Send to Back" shortcut="Ctrl+Shift+[" />

          <Divider />

          {/* Alignment */}
          <div className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-foreground/40">Align Canvas</div>
          <div className="grid grid-cols-3 gap-1 px-1 py-1">
            <button onClick={() => handleAlign("left")} className="p-1 rounded hover:bg-surface-variant/30 text-center" title="Align Left"><i className="ri-align-left" /></button>
            <button onClick={() => handleAlign("h_center")} className="p-1 rounded hover:bg-surface-variant/30 text-center" title="Align Center"><i className="ri-align-center" /></button>
            <button onClick={() => handleAlign("right")} className="p-1 rounded hover:bg-surface-variant/30 text-center" title="Align Right"><i className="ri-align-right" /></button>
          </div>

          <Divider />

          {/* Element Controls */}
          <div className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-foreground/40">Element Actions</div>
          <MenuBtn
            onClick={() => updateSelectedElement("isLocked", !targetEl?.isLocked)}
            icon={targetEl?.isLocked ? "ri-lock-unlock-line" : "ri-lock-line"}
            label={targetEl?.isLocked ? "Unlock Element" : "Lock Element"}
          />
          <MenuBtn onClick={() => handleDuplicateElement(targetId)} icon="ri-file-copy-line" label="Duplicate" shortcut="Ctrl+D" />
          <MenuBtn onClick={() => handleDeleteElementById(targetId)} icon="ri-delete-bin-line" label="Delete" shortcut="Delete" danger />
        </>
      ) : (
        <>
          <div className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-foreground/40">Add Canvas Element</div>
          <MenuBtn onClick={() => handleAddText()} icon="ri-text" label="Add Text Frame" />
          <MenuBtn onClick={() => handleAddButton()} icon="ri-cursor-fill" label="Add CTA Button" />
          <MenuBtn onClick={() => handleAddTimer()} icon="ri-time-line" label="Add Sale Timer" />
        </>
      )}
    </div>
  );
};

export default ContextMenu;
