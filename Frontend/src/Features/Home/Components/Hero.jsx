import React, { useState } from "react";
import LeftInfo from "./LeftInfo";
import RightInfo from "./RightInfo";

const BigText = ({ text }) => {
  return (
    <span
      className="font-black text-[5.5rem] sm:text-[7rem] lg:text-[8rem] leading-[0.75] tracking-tighter uppercase text-foreground dark:text-accent drop-shadow-lg"
      style={{ fontFamily: "Impact, sans-serif" }}
    >
      {text}
    </span>
  );
};

const SmallText = ({ text }) => {
  return (
    <span className="font-serif italic text-3xl sm:text-4xl lg:text-[3rem] text-foreground mb-[0px] sm:mb-[0px] lg:mb-[-1px] drop-shadow-md lg:whitespace-nowrap z-10 relative">
      {text}
    </span>
  );
};

const HeroHeader = () => {
  return (
    <div className="w-full max-w-[1350px] flex flex justify-between items-center lg:items-end px-4 sm:px-8 z-20 relative mb-12 lg:mb-[-30px]">
      {/* Left Side: Own the EDGE */}
      <div className="flex flex-col transform lg:rotate-[-2deg] text-center lg:text-left z-20">
        <SmallText text="Own the" />
        <div className="relative lg:ml-8">
          <BigText text="EDGE" />
        </div>
      </div>

      {/* Right Side: Keep the VIBE */}
      <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-6 transform lg:rotate-[-2deg] mt-8 lg:mt-0 text-center lg:text-left z-20 xl:mr-10">
        <SmallText text="Keep the" />
        <div className="relative">
          <BigText text="VIBE" />
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="w-full pb-16 flex flex-col items-center pt-4">
      <HeroHeader />

      {/* Master Hero Container - Colored box and floating Model */}
      <div className="relative w-full max-w-[1300px] mx-auto min-h-[500px] lg:min-h-[550px] flex flex-col items-center justify-end px-2 sm:px-6 z-10 w-[98%]">
        {/* 2. Main Colored Background Block */}
        <div className="w-full h-auto lg:h-[500px] bg-surface-brand rounded-[40px] lg:rounded-[64px] relative flex flex-col lg:flex-row shadow-xl lg:shadow-2xl z-0 border border-border-theme overflow-visible lg:overflow-hidden">
          {/* Decorative Background Circle */}
          <div className="absolute left-[-10%] top-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-white/10 dark:bg-white/5 rounded-full z-0 opacity-60 blur-[30px] sm:blur-[60px]"></div>

          {/* Left Info Column */}
          <div className="w-full lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-16 pt-[70px] pb-12 lg:py-0 flex flex-col justify-center h-full">
            <LeftInfo />
          </div>

          {/* Empty Gutter for Model (Desktop) */}
          <div className="hidden lg:block lg:w-[30%] lg:h-full"></div>

          {/* Right Info Column (DESKTOP) */}
          <div className="hidden lg:flex lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-12 flex-col lg:items-end justify-center pt-8 pb-[100px] lg:py-0 h-full">
            <RightInfo />
          </div>
        </div>

        {/* Clipping Wrapper */}
        <div
          className="absolute inset-x-2 sm:inset-x-6 bottom-0 top-0 pointer-events-none z-100 lg:overflow-visible"
          style={{ clipPath: "inset(-1000px 0px -1000px -1000px)" }}
        >
          {/* 3. Responsive Model Asset */}
          <div className="absolute bottom-[52%] md:bottom-[50%] lg:bottom-[24px] left-1/2 lg:left-1/2 -translate-x-[25%] lg:-translate-x-1/2 w-[500px] sm:w-[520px] md:w-[580px] lg:w-[570px] xl:w-[580px] flex justify-center">
            {/* Desktop Asset */}
            <img
              src="/model.png"
              alt="Fashion Cutout"
              className="hidden lg:block w-full h-auto max-h-[850px] object-contain object-bottom translate-y-6"
              onError={() => setImgErr(true)}
            />
            {/* Mobile/Tablet Asset */}
            <img
              src="/model-cutout.png"
              alt="Mobile Fashion Cutout"
              className="lg:hidden block w-full h-auto max-h-[850px] object-contain object-bottom"
              onError={() => setImgErr(true)}
            />
          </div>
        </div>

        {/* 4. Right Info Column (MOBILE) */}
        <div className="lg:hidden w-full mt-6">
          <RightInfo />
        </div>
      </div>
    </div>
  );
};

export default Hero;
