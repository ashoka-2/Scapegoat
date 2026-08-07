import React from "react";
import { getShapeFillCSS, getImageFilterStyle } from "./canvasHelpers";

const CanvasElement = ({
  el,
  selectedId,
  editingTextId,
  setSelectedId,
  setEditingTextId,
  handleElementMouseDown,
  handleResizeStart,
  handleRotateStart,
  handleCanvasContextMenu,
  updateSelectedElement,
  countdownText = "01h 30m 00s",
}) => {
  const isSelected = el.id === selectedId;
  const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  const handleClasses = {
    nw: "-top-1.5 -left-1.5 cursor-nwse-resize",
    n: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
    ne: "-top-1.5 -right-1.5 cursor-nesw-resize",
    e: "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize",
    se: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
    s: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
    sw: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
    w: "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize",
  };

  const handleTextDoubleClick = (e) => {
    e.stopPropagation();
    if (el.isLocked) return;
    if (setEditingTextId) setEditingTextId(el.id);
    setSelectedId(el.id);
  };

  return (
    <div
      id={`element-frame-${el.id}`}
      onPointerDown={(e) => handleElementMouseDown(e, el)}
      onContextMenu={(e) => handleCanvasContextMenu && handleCanvasContextMenu(e, el.id)}
      style={{
        position: "absolute",
        left: `${el.x}px`,
        top: `${el.y}px`,
        width: `${el.width}px`,
        height: `${el.height}px`,
        zIndex: el.zIndex || 1,
        transform: `rotate(${el.rotate || 0}deg)`,
        opacity: (el.opacity ?? 100) / 100,
        filter: el.shadowBlur > 0
          ? `drop-shadow(${el.shadowX || 0}px ${el.shadowY || 0}px ${el.shadowBlur || 0}px ${el.shadowColor || "rgba(0,0,0,0.5)"})`
          : "none",
        cursor: el.isLocked ? "not-allowed" : "move",
      }}
      className={`${isSelected ? "z-[1000]" : ""}`}
    >
      {/* Selection Border & Controls */}
      {isSelected && !el.isLocked && (
        <>
          <div className="absolute inset-0 border-[1.5px] border-accent pointer-events-none z-50 rounded-sm" />
          <div className="absolute -top-5 left-0 bg-accent text-accent-content text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow select-none pointer-events-none z-50 flex items-center gap-1">
            <span>{el.name || el.type}</span>
            {el.link && <span className="font-mono text-[7px] bg-black/30 px-1 rounded">({el.link})</span>}
          </div>

          {/* Rotation Handle */}
          {handleRotateStart && (
            <div
              onPointerDown={(e) => handleRotateStart(e, el)}
              className="absolute -top-7 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent border-2 border-white rounded-full cursor-grab z-50 shadow-md flex items-center justify-center"
              title="Drag to rotate"
            />
          )}

          {/* 8 Resize Pins */}
          {resizeHandles.map((handle) => (
            <div
              key={handle}
              onPointerDown={(e) => handleResizeStart(e, handle, el)}
              className={`absolute w-2.5 h-2.5 bg-white border border-accent rounded-xs z-50 shadow-sm ${handleClasses[handle]}`}
            />
          ))}
        </>
      )}

      {/* Locked Element Overlay */}
      {isSelected && el.isLocked && (
        <>
          <div className="absolute inset-0 border-[1.5px] border-amber-400/60 pointer-events-none z-50 rounded-sm" />
          <div className="absolute -top-5 left-0 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow select-none pointer-events-none z-50 flex items-center gap-1">
            <i className="ri-lock-fill" /> {el.name || el.type} (Locked)
          </div>
        </>
      )}

      {/* Render Text Element */}
      {el.type === "text" && (
        editingTextId === el.id ? (
          <textarea
            value={el.content}
            autoFocus
            onChange={(e) => updateSelectedElement("content", e.target.value)}
            onBlur={() => setEditingTextId(null)}
            className="w-full h-full bg-transparent resize-none outline-none border-none p-0 m-0 overflow-hidden text-foreground font-bold"
            style={{
              fontFamily: el.fontFamily || "Inter",
              fontSize: `${el.fontSize || 22}px`,
              fontWeight: el.fontWeight || "bold",
              textAlign: el.textAlign || "center",
              lineHeight: "1.25",
              color: el.color || "#ffffff",
            }}
          />
        ) : (
          <p
            onDoubleClick={handleTextDoubleClick}
            className="w-full h-full flex items-center justify-center font-bold whitespace-nowrap p-1 select-none"
            style={{
              fontFamily: el.fontFamily || "Inter",
              fontSize: `${el.fontSize || 22}px`,
              fontWeight: el.fontWeight || "bold",
              textAlign: el.textAlign || "center",
              color: el.isGradientText ? "transparent" : el.color || "#ffffff",
              background: el.isGradientText
                ? `linear-gradient(${el.textGradient?.dir === "to-b" ? "180deg" : "90deg"}, ${el.textGradient?.start || "#ff007f"}, ${el.textGradient?.end || "#7f00ff"})`
                : "none",
              WebkitBackgroundClip: el.isGradientText ? "text" : "unset",
              backgroundClip: el.isGradientText ? "text" : "unset",
            }}
          >
            {el.content}
          </p>
        )
      )}

      {/* Render CTA Button with Target Redirect Link */}
      {el.type === "button" && (
        <a
          href={el.link || "#"}
          onClick={(e) => {
            if (isSelected || editingTextId) e.preventDefault();
          }}
          title={el.link ? `Redirects to: ${el.link}` : "CTA Button"}
          className="w-full h-full flex items-center justify-center font-bold whitespace-nowrap transition cursor-move no-underline"
          style={{
            backgroundColor: el.bgColor || "#ffffff",
            color: el.textColor || "#000000",
            borderColor: el.borderColor || "#ffffff",
            borderWidth: `${el.borderWidth || 0}px`,
            borderRadius: `${el.borderRadius || 12}px`,
            fontSize: `${el.fontSize || 14}px`,
            padding: `${el.paddingY || 12}px ${el.paddingX || 24}px`,
            boxShadow: el.shadow ? "0 10px 25px -5px rgba(0,0,0,0.3)" : "none",
          }}
        >
          {el.content || "Shop Now"}
        </a>
      )}

      {/* Render Countdown Sale Timer */}
      {el.type === "timer" && (
        <div
          className="w-full h-full flex items-center justify-center gap-2 font-bold whitespace-nowrap border border-amber-400/50"
          style={{
            backgroundColor: el.bgColor || "rgba(15,23,42,0.85)",
            color: el.textColor || "#ffffff",
            borderRadius: `${el.borderRadius || 12}px`,
            fontSize: `${el.fontSize || 14}px`,
            padding: `${el.paddingY || 10}px ${el.paddingX || 18}px`,
          }}
        >
          <i className="ri-time-line text-amber-400" />
          <span>{el.label || "Offer ends in:"}</span>
          <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
            {countdownText}
          </span>
        </div>
      )}

      {/* Render Image Element */}
      {el.type === "image" && (
        <img
          src={el.url}
          alt={el.name || "Banner Graphic"}
          className="w-full h-full object-cover select-none pointer-events-none rounded-xl"
          style={{
            borderRadius: `${el.borderRadius || 0}px`,
            filter: getImageFilterStyle(el),
          }}
        />
      )}
    </div>
  );
};

export default CanvasElement;
