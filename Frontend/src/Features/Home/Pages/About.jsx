import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useSettings } from "../../Settings/Hooks/useSettings";

const About = () => {
  const { handleGetSettings } = useSettings();
  const { settings, loading } = useSelector((state) => state.settings);

  useEffect(() => {
    handleGetSettings();
  }, []);

  const aboutData = settings?.about || {
    title: "Our Vision",
    content: "ScapeGoat is a brand dedicated to redefining modern fashion with premium quality and innovative design.",
    missionStatement: "To deliver high-quality, sustainable fashion to everyone worldwide.",
  };

  if (loading && !settings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase text-foreground/50">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-12 text-center max-w-5xl mx-auto font-sans">
      <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-6 text-foreground">
        {aboutData.title}
      </h1>
      <div className="w-20 h-1 bg-accent mb-10 rounded-full"></div>

      <p className="text-lg sm:text-2xl md:text-3xl font-bold tracking-wide uppercase text-foreground/70 mb-10 max-w-4xl leading-relaxed">
        "{aboutData.missionStatement}"
      </p>

      <div className="w-full text-xs sm:text-sm md:text-base font-medium tracking-wide leading-loose text-foreground/80 whitespace-pre-wrap text-left bg-surface p-6 sm:p-10 md:p-12 rounded-3xl border border-border-theme shadow-xl">
        {aboutData.content}
      </div>
    </div>
  );
};

export default About;
