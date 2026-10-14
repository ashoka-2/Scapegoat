import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCategory } from "../../Categories/Hooks/useCategory";
import LeftInfo from "./LeftInfo";
import RightInfo from "./RightInfo";
import { DEFAULT_HERO_PRESET, getHeroPreset } from "../Config/heroSlides.config";

gsap.registerPlugin(useGSAP);

const FALLBACK_CATEGORIES = [
  { _id: "clothing", name: "Clothing" },
  { _id: "stationery", name: "Stationery" },
  { _id: "electronics", name: "Electronics" },
  { _id: "furniture", name: "Furniture" },
  { _id: "footwear", name: "Footwear" },
  { _id: "school", name: "School Essentials" },
  { _id: "massagers", name: "Massagers" },
  { _id: "tools", name: "Tools" },
];

const EMPTY_PRODUCTS = [];

const productMatchesCategory = (product, category) => {
  const categoryId = String(category?._id || "");
  const categoryName = String(category?.name || "").trim().toLowerCase();
  const productCategory = product?.category;
  const productCategoryId = String(productCategory?._id || productCategory || "");
  const productCategoryName = String(productCategory?.name || "").trim().toLowerCase();
  if (categoryId && productCategoryId === categoryId) return true;
  if (categoryName && productCategoryName === categoryName) return true;

  return (Array.isArray(product?.subcategories) ? product.subcategories : []).some((subcategory) =>
    String(subcategory?._id || subcategory || "") === categoryId ||
    String(subcategory?.name || "").trim().toLowerCase() === categoryName
  );
};

const BigText = ({ text }) => (
  <span className="font-black text-[4rem] sm:text-[7rem] lg:text-[8rem] leading-[0.75] tracking-tighter uppercase text-foreground dark:text-accent drop-shadow-lg" style={{ fontFamily: "Impact, sans-serif" }}>
    {text}
  </span>
);

const SmallText = ({ text }) => (
  <span className="font-serif italic text-xl sm:text-4xl lg:text-[3rem] text-foreground mb-2 sm:mb-0 lg:mb-[-1px] drop-shadow-md lg:whitespace-nowrap z-10 relative">
    {text}
  </span>
);

const HeroHeader = () => (
  <div className="w-full max-w-[1350px] flex justify-between items-center lg:items-end px-4 sm:px-8 z-20 relative mb-12 lg:mb-[-30px]">
    <div className="flex flex-col transform lg:rotate-[-2deg] text-center lg:text-left z-20">
      <SmallText text="Own the" />
      <div className="relative lg:ml-8"><BigText text="EDGE" /></div>
    </div>
    <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-6 transform lg:rotate-[-2deg] mt-8 lg:mt-0 text-center lg:text-left z-20 xl:mr-10">
      <SmallText text="Keep the" />
      <div className="relative"><BigText text="VIBE" /></div>
    </div>
  </div>
);

const Hero = () => {
  const navigate = useNavigate();
  const { categories, handleFetchCategories } = useCategory();
  const products = useSelector((state) => state.product.products) || EMPTY_PRODUCTS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const heroRef = useRef(null);
  const previousSlideRef = useRef(null);

  useEffect(() => {
    if (!categories?.length) handleFetchCategories();
  }, [categories?.length, handleFetchCategories]);

  const slides = useMemo(() => {
    const activeCategories = (categories || []).filter((category) => category?.isActive !== false && category?.name);
    const source = activeCategories.length ? activeCategories : FALLBACK_CATEGORIES;
    return source.map((category, index) => {
      const categoryProducts = products.filter((product) => productMatchesCategory(product, category));
      const preset = getHeroPreset(category.name);
      return {
        ...category,
        key: String(category._id || category.slug || category.name),
        artwork: preset?.artwork || category.image || DEFAULT_HERO_PRESET.artwork,
        gradient: preset?.gradient || DEFAULT_HERO_PRESET.gradient,
        heroTitle: preset?.title,
        eyebrow: preset?.eyebrow,
        featured: (categoryProducts.length ? categoryProducts : products).slice(0, 5),
        index,
      };
    });
  }, [categories, products]);

  const activeIndex = slides.length ? currentIndex % slides.length : 0;
  const activeSlide = slides[activeIndex];

  useGSAP(() => {
    const root = heroRef.current;
    if (!root || !activeSlide) return;
    const background = root.querySelector("[data-hero-background]");
    const art = root.querySelector("[data-hero-art]");
    const copy = root.querySelector("[data-hero-copy]");
    const info = root.querySelector("[data-hero-info]");
    const previous = previousSlideRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !previous) {
      background.style.backgroundImage = activeSlide.gradient;
      gsap.set([art, copy, info], { autoAlpha: 1, clearProps: "transform" });
      previousSlideRef.current = activeSlide.key;
      return;
    }
    const timeline = gsap.timeline({
      onComplete: () => { previousSlideRef.current = activeSlide.key; },
    });
    timeline
      .to(background, { opacity: 0.25, duration: 0.25, ease: "power1.out" }, 0)
      .add(() => { background.style.backgroundImage = activeSlide.gradient; })
      .to(background, { opacity: 1, duration: 0.65, ease: "power2.inOut" })
      .fromTo(art, { autoAlpha: 0, x: 24, y: 12, scale: 0.97 }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.75, ease: "power3.out" }, 0.05)
      .fromTo(copy, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }, 0.12)
      .fromTo(info, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }, 0.18);
    return () => timeline.kill();
  }, { scope: heroRef, dependencies: [activeSlide?.key], revertOnUpdate: true });

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const interval = window.setInterval(() => setCurrentIndex((index) => (index + 1) % slides.length), 6500);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => setCurrentIndex((index + slides.length) % slides.length);
  const categoryName = activeSlide?.name || "ScapeGoat";
  const categorySubtitle = activeSlide?.description || `Explore standout ${categoryName.toLowerCase()} picked for your next everyday favorite.`;

  return (
    <div className="w-full pb-10 sm:pb-16 flex flex-col items-center pt-4">
      <HeroHeader />

      <div ref={heroRef} className="relative w-[98%] max-w-[1300px] mx-auto min-h-[500px] lg:min-h-[550px] flex flex-col items-center justify-end px-2 sm:px-6 z-10">
        <div className="w-full min-h-[590px] lg:min-h-0 lg:h-[500px] rounded-[40px] lg:rounded-[64px] relative flex flex-col lg:flex-row shadow-xl lg:shadow-2xl z-0 border border-border-theme overflow-visible isolate">
          <div data-hero-background className="absolute inset-0 z-0 rounded-[40px] lg:rounded-[64px] transition-none" style={{ backgroundImage: activeSlide?.gradient }} />
          <div className="absolute inset-0 z-[1] rounded-[40px] lg:rounded-[64px] bg-black/10 pointer-events-none" />
          <div className="absolute left-[-10%] top-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-white/10 rounded-full z-[1] opacity-60 blur-[30px] sm:blur-[60px] pointer-events-none" />

          <div className="absolute inset-x-0 top-[-145px] bottom-0 z-[2] overflow-hidden pointer-events-none rounded-t-[40px] lg:rounded-t-[64px]" aria-hidden="true">
            <img data-hero-art src={activeSlide?.artwork} alt="" className="absolute right-[-18%] bottom-[-2%] w-[88%] h-[calc(100%+145px)] object-contain object-bottom sm:right-[-10%] sm:bottom-[-4%] sm:w-[74%] sm:h-[calc(100%+145px)] lg:right-auto lg:left-[28%] lg:bottom-[-15%] lg:w-[48%] lg:h-[calc(100%+145px)] drop-shadow-[0_24px_32px_rgba(0,0,0,0.2)]" />
          </div>
          <div className="pointer-events-none absolute inset-0 z-[3] rounded-[40px] lg:rounded-[64px] opacity-20 mix-blend-soft-light" style={{ backgroundImage: "url('/hero-noise.svg')", backgroundSize: "180px 180px" }} aria-hidden="true" />

          <div data-hero-copy className="w-full lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-16 pt-8 sm:pt-10 lg:pt-0 pb-5 sm:pb-8 lg:pb-0 flex flex-col justify-start lg:justify-center min-h-[255px] lg:min-h-0 lg:h-full">
              <LeftInfo
                badgeText={`${activeSlide?.eyebrow || "SCAPEGOAT"} / ${categoryName}`}
                title={activeSlide?.heroTitle || `${categoryName.length > 14 ? "Shop" : "Discover"}\n${categoryName}`}
                subtitle={categorySubtitle}
                buttonText={`Shop ${categoryName}`}
                ratingText={`Curated picks across\n${categoryName}.`}
                onExplore={() => navigate(`/shop?categories=${encodeURIComponent(categoryName)}`)}
              />
          </div>

          <div className="hidden lg:block lg:w-[30%] lg:h-full" />

          <div data-hero-info className="hidden lg:flex lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-12 flex-col lg:items-end justify-center pt-8 pb-[100px] lg:py-0 h-full">
            <RightInfo products={activeSlide?.featured} slideKey={activeSlide?.key} />
          </div>
        </div>

        <div className="lg:hidden w-full mt-6">
          <RightInfo products={activeSlide?.featured} slideKey={activeSlide?.key} />
        </div>

        {slides.length > 1 && (
          <div className="relative z-20 mt-4 flex max-w-full items-center justify-center gap-2 overflow-x-auto px-3 py-2 scrollbar-hide" aria-label="Hero categories">
            {slides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Show ${slide.name} category`}
                aria-current={activeIndex === index ? "true" : undefined}
                className="group flex h-10 w-7 shrink-0 items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-full"
              >
                <span className={`h-2 rounded-full transition-all duration-300 ${activeIndex === index ? "w-6 bg-accent" : "w-2 bg-foreground/25 group-hover:bg-foreground/50"}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
