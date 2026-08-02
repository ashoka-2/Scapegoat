import React from "react";

const LeftInfo = ({
  badgeText = "New Drop",
  title = "Meets \n your \n Style",
  subtitle = "Step into the future of urban streetwear today.",
  buttonText = "Explore Collection",
  ratingText = "Rated 5 Stars by\nThe ScapeGoat Community",
  avatars = [
    "https://i.pravatar.cc/100?img=12",
    "https://i.pravatar.cc/100?img=33",
    "https://i.pravatar.cc/100?img=47",
    "https://i.pravatar.cc/100?img=68",
  ],
}) => {
  return (
    <div className="w-full flex flex-col justify-center text-white z-10 relative h-auto">
      <p className="uppercase tracking-widest text-[10px] sm:text-xs font-bold mt-4 text-white/70 dark:text-accent opacity-80 transition-colors">
        {badgeText}
      </p>
      <h3 className="text-5xl md:text-6xl font-black mb-4 leading-[0.95] tracking-tighter transition-colors whitespace-pre-line">
        {title}
      </h3>
      <p className="text-white/80 dark:text-gray-400 mb-5 max-w-[220px] text-sm md:text-base font-medium transition-colors">
        {subtitle}
      </p>

      <button className="bg-white dark:bg-accent text-[#131313] dark:text-accent-content rounded-full px-8 py-4 w-fit font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-xl group text-sm md:text-base border border-transparent hover:border-white cursor-pointer">
        {buttonText}
        <span className="bg-accent dark:bg-background text-accent-content dark:text-accent rounded-full p-1 group-hover:translate-x-1 transition-transform flex items-center justify-center w-8 h-8">
          <i className="ri-arrow-right-line text-sm md:text-base"></i>
        </span>
      </button>

      <div className="mt-10 lg:mt-4 bg-white/10 dark:bg-surface/60 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 border border-white/10 dark:border-border-theme w-fit shadow-xl transition-colors">
        <div className="flex -space-x-3">
          {avatars.map((avatar, idx) => (
            <img
              key={idx}
              className="w-10 h-10 rounded-xl border-2 border-accent object-cover bg-background transition-colors"
              src={avatar}
              alt="Avatar"
            />
          ))}
        </div>
        <div>
          <div className="flex gap-1 text-accent mb-0.5 mt-1 transition-colors">
            {[...Array(5)].map((_, i) => (
              <i key={i} className="ri-star-fill text-sm"></i>
            ))}
          </div>
          <p className="text-[10px] text-white/80 dark:text-gray-400 font-bold tracking-tight whitespace-pre-line transition-colors">
            {ratingText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeftInfo;
