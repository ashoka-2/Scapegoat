import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "scapegoat_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => setVisible(!localStorage.getItem(STORAGE_KEY)), []);
  const choose = (choice) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, updatedAt: new Date().toISOString() }));
    setVisible(false);
  };
  if (!visible) return null;

  return (
    <aside role="dialog" aria-label="Cookie preferences" className="fixed z-[120] bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[440px] bg-surface/95 backdrop-blur-xl border border-border-theme shadow-2xl rounded-3xl p-5 sm:p-6">
      <div className="flex gap-3">
        <i className="ri-shield-check-line text-2xl text-accent" aria-hidden="true" />
        <div className="space-y-3">
          <h2 className="font-black text-sm uppercase tracking-wide">Your cookie choices</h2>
          <p className="text-xs leading-relaxed text-foreground/70">Essential cookies keep sign-in, carts, and security working. Optional cookies help us improve ScapeGoat.</p>
          <Link to="/cookie-policy" className="text-xs font-bold text-accent underline underline-offset-4">Read the cookie policy</Link>
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => choose("essential")} className="px-4 py-2 rounded-full border border-border-theme text-xs font-black uppercase tracking-wide hover:bg-background cursor-pointer">Essential only</button>
            <button onClick={() => choose("all")} className="px-4 py-2 rounded-full bg-accent text-accent-content text-xs font-black uppercase tracking-wide hover:opacity-90 cursor-pointer">Accept all</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
