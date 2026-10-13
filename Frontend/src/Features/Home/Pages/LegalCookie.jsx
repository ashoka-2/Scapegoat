import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSettings } from "../../Settings/Hooks/useSettings";
import { sanitizeLegalHtml } from "../../../utils/sanitizeLegalHtml";

const fallback = "ScapeGoat uses essential cookies for security, sign-in, carts, and preferences. Optional analytics and personalization cookies are enabled only when you accept them.";

const LegalCookie = () => {
  const { settings, loading } = useSelector((state) => state.settings);
  const { handleGetSettings } = useSettings();

  useEffect(() => { handleGetSettings(); }, []);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto font-sans">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs font-black tracking-[0.3em] uppercase text-accent">Your privacy choices</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">Cookie Policy</h1>
        </div>
        <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl">
          {loading && !settings ? <div className="animate-pulse h-28 rounded bg-foreground/10" /> : (
            <div className="text-foreground/80 whitespace-pre-wrap font-sans text-sm leading-7" dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(settings?.legal?.cookiePolicy || fallback) }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalCookie;
