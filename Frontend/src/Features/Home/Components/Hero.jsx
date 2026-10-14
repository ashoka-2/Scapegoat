import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCategory } from "../../Categories/Hooks/useCategory";
import LeftInfo from "./LeftInfo";
import RightInfo from "./RightInfo";

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

const HERO_BACKGROUNDS = ["#633c4a", "#365573", "#4c5644", "#6a4938", "#454b70", "#5c5140", "#365653"];
const EMPTY_PRODUCTS = [];

const categoryArtwork = (name = "") => {
  const value = name.toLowerCase();
  if (/shoe|footwear|sneaker|sandal/.test(value)) return "/hero-categories/footwear.png";
  if (/computer|electronic|laptop|mobile|phone|camera|gadget/.test(value)) return "/hero-categories/electronics.png";
  if (/furnit|chair|table|sofa|desk/.test(value)) return "/hero-categories/furniture.png";
  if (/massage|massager|wellness/.test(value)) return "/hero-categories/massagers.png";
  if (/tool|hardware|torch|lighter|spare|mixi/.test(value)) return "/hero-categories/tools.png";
  if (/school|kid|toy|backpack|bag/.test(value)) return "/hero-categories/school.png";
  if (/station|book|notebook|paper|pen|pencil/.test(value)) return "/hero-categories/stationery.png";
  if (/bottle|home|kitchen|household|decor/.test(value)) return "/hero-categories/home.png";
  if (/women|girl/.test(value)) return "/model.png";
  if (/\bmen\b|men's|mens|boy/.test(value)) return "/hero-categories/menswear.png";
  if (/cloth|cotton|linen|hoodie|shirt|pant|sweater|fashion|polo/.test(value)) return "/model.png";
  return null;
};

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

  useEffect(() => {
    if (!categories?.length) handleFetchCategories();
  }, [categories?.length, handleFetchCategories]);

  const slides = useMemo(() => {
    const activeCategories = (categories || []).filter((category) => category?.isActive !== false && category?.name);
    const source = activeCategories.length ? activeCategories : FALLBACK_CATEGORIES;
    return source.map((category, index) => {
      const categoryProducts = products.filter((product) => productMatchesCategory(product, category));
      const hash = [...String(category._id || category.name)].reduce((value, char) => value + char.charCodeAt(0), 0);
      return {
        ...category,
        key: String(category._id || category.slug || category.name),
        artwork: categoryArtwork(category.name) || category.image || "/hero-categories/home.png",
        background: HERO_BACKGROUNDS[hash % HERO_BACKGROUNDS.length],
        featured: (categoryProducts.length ? categoryProducts : products).slice(0, 5),
        index,
      };
    });
  }, [categories, products]);

  const activeIndex = slides.length ? currentIndex % slides.length : 0;
  const activeSlide = slides[activeIndex];

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

      <div className="relative w-[98%] max-w-[1300px] mx-auto min-h-[500px] lg:min-h-[550px] flex flex-col items-center justify-end px-2 sm:px-6 z-10">
        <div className="w-full h-auto lg:h-[500px] rounded-[40px] lg:rounded-[64px] relative flex flex-col lg:flex-row shadow-xl lg:shadow-2xl z-0 border border-border-theme overflow-visible lg:overflow-hidden transition-colors duration-700" style={{ backgroundColor: activeSlide?.background || "#633c4a" }}>
          <div className="absolute left-[-10%] top-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-white/10 rounded-full z-0 opacity-60 blur-[30px] sm:blur-[60px] transition-colors duration-700" />

          <div className="w-full lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-16 pt-[70px] pb-12 lg:py-0 flex flex-col justify-center h-full">
            <motion.div key={`copy-${activeSlide?.key}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
              <LeftInfo
                badgeText={`SCAPEGOAT / ${categoryName}`}
                title={`${categoryName.length > 14 ? "Shop" : "Discover"}\n${categoryName}`}
                subtitle={categorySubtitle}
                buttonText={`Shop ${categoryName}`}
                ratingText={`Curated picks across\n${categoryName}.`}
                onExplore={() => navigate(`/shop?categories=${encodeURIComponent(categoryName)}`)}
              />
            </motion.div>
          </div>

          <div className="hidden lg:block lg:w-[30%] lg:h-full" />

          <div className="hidden lg:flex lg:w-[35%] relative z-10 px-6 sm:px-12 lg:px-12 flex-col lg:items-end justify-center pt-8 pb-[100px] lg:py-0 h-full">
            <RightInfo products={activeSlide?.featured} slideKey={activeSlide?.key} />
          </div>
        </div>

        <div className="absolute inset-x-2 sm:inset-x-6 bottom-0 top-0 pointer-events-none z-10 lg:overflow-visible" style={{ clipPath: "inset(-1000px 0px -1000px -1000px)" }}>
          <div className="absolute bottom-[52%] md:bottom-[50%] lg:bottom-[24px] left-1/2 -translate-x-[25%] lg:-translate-x-1/2 w-[500px] sm:w-[520px] md:w-[580px] lg:w-[570px] xl:w-[580px] flex justify-center">
            <motion.img
              key={`art-${activeSlide?.key}`}
              src={activeSlide?.artwork}
              alt={`${categoryName} collection`}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="w-full h-auto max-h-[850px] object-contain object-bottom translate-y-6"
            />
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
