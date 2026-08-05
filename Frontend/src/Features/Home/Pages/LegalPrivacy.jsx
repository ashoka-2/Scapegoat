import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSettings } from "../../Settings/Hooks/useSettings";

const LegalPrivacy = () => {
  const { settings, loading } = useSelector((state) => state.settings);
  const { handleGetSettings } = useSettings();

  useEffect(() => {
    handleGetSettings();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto font-sans">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs font-black tracking-[0.3em] uppercase text-accent">Legal & Compliance</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">Privacy Policy</h1>
        </div>

        <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-10 md:p-12 space-y-6 font-mono text-xs sm:text-sm leading-relaxed shadow-xl">
          {loading && !settings ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-foreground/15 rounded w-3/4"></div>
              <div className="h-4 bg-foreground/15 rounded w-1/2"></div>
              <div className="h-4 bg-foreground/15 rounded w-5/6"></div>
            </div>
          ) : (
            <div
              className="text-foreground/80 whitespace-pre-wrap font-sans"
              dangerouslySetInnerHTML={{ __html: settings?.legal?.privacyPolicy || "Privacy Policy content is currently being updated." }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPrivacy;
