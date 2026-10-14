import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoriesPageApi } from "../Features/Categories/Services/category.api";

const FALLBACK_CATEGORY_IMAGE = "/hero-categories/home.png";
const PAGE_SIZE = 8;
const categoryUrl = (category) => `/categories/${category.slug || category._id}`;

const CategoryMenu = ({ active }) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [hasMoreSubcategories, setHasMoreSubcategories] = useState(false);
  const [subcategoryPage, setSubcategoryPage] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(false);
  const [error, setError] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open || categories.length) return;
    let cancelled = false;
    getCategoriesPageApi({ page: 1, limit: PAGE_SIZE, roots: true })
      .then((response) => {
        if (cancelled) return;
        const items = response?.data || [];
        setCategories(items);
        setHasMoreCategories(Boolean(response?.hasMore));
        if (items[0]) setSubcategoriesLoading(true);
        setSelected(items[0] || null);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [open, categories.length]);

  useEffect(() => {
    if (!open || !selected?._id) return;
    let cancelled = false;
    getCategoriesPageApi({ page: 1, limit: 8, parentCategory: selected._id })
      .then((response) => {
        if (cancelled) return;
        setSubcategories(response?.data || []);
        setSubcategoryPage(response?.page || 1);
        setHasMoreSubcategories(Boolean(response?.hasMore));
      })
      .catch(() => !cancelled && setSubcategories([]))
      .finally(() => !cancelled && setSubcategoriesLoading(false));
    return () => { cancelled = true; };
  }, [open, selected?._id]);

  useEffect(() => {
    if (!open || !lockedOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
        setLockedOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open, lockedOpen]);

  const openMenu = () => {
    if (!categories.length) {
      setLoading(true);
      setError(false);
    }
    setOpen(true);
  };

  const selectCategory = (category) => {
    if (String(selected?._id) === String(category._id)) return;
    setSelected(category);
    setSubcategories([]);
    setSubcategoryPage(1);
    setSubcategoriesLoading(true);
  };

  const loadMoreSubcategories = async () => {
    if (!selected?._id || subcategoriesLoading) return;
    setSubcategoriesLoading(true);
    try {
      const page = subcategoryPage + 1;
      const response = await getCategoriesPageApi({ page, limit: 8, parentCategory: selected._id });
      setSubcategories((current) => [...current, ...(response?.data || [])]);
      setSubcategoryPage(page);
      setHasMoreSubcategories(Boolean(response?.hasMore));
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const closeMenu = () => {
    setOpen(false);
    setLockedOpen(false);
  };

  const togglePinnedMenu = () => {
    if (lockedOpen) closeMenu();
    else {
      openMenu();
      setLockedOpen(true);
    }
  };

  const handlePointerEnter = () => {
    if (!lockedOpen) openMenu();
  };

  const handlePointerLeave = () => {
    if (!lockedOpen) setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative" onMouseEnter={handlePointerEnter} onMouseLeave={handlePointerLeave}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={togglePinnedMenu} onFocus={handlePointerEnter} className={`relative flex items-center gap-1 font-black tracking-[0.2em] uppercase text-[10px] transition hover:text-accent ${active ? "text-accent" : "text-foreground"}`}>
        Categories <i className={`ri-arrow-down-s-line text-sm transition-transform ${open ? "rotate-180" : ""}`} />
        {active && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
      </button>

      {open && <div className="fixed left-0 right-0 top-[64px] z-[1100] px-3 sm:px-6" onKeyDown={(event) => event.key === "Escape" && closeMenu()}>
        <div className="mx-auto h-[min(510px,72vh)] max-w-[1440px] overflow-hidden rounded-b-[28px] border border-border-theme/70 bg-background/95 shadow-2xl backdrop-blur-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border-theme/70 px-5 py-4 sm:px-8">
              <div><p className="text-xs font-semibold text-foreground/50">Explore the collection</p><h2 className="mt-1 text-lg font-bold text-foreground">Shop by category</h2></div>
              <Link to="/categories" onClick={closeMenu} className="inline-flex h-10 items-center gap-2 rounded-full border border-border-theme px-4 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                View all categories <i className="ri-arrow-right-line" />
              </Link>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
              <section className="min-h-0 overflow-y-auto p-4 sm:p-6" aria-label="Main categories">
                {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface" />)}</div> : error ? <p className="p-4 text-sm text-foreground/60">Categories couldn’t load. Please try again.</p> : categories.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {categories.map((category) => <Link key={category._id} to={categoryUrl(category)} onMouseEnter={() => selectCategory(category)} onFocus={() => selectCategory(category)} onClick={closeMenu} className={`group relative h-28 overflow-hidden rounded-2xl border transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:h-32 ${String(selected?._id) === String(category._id) ? "border-accent" : "border-border-theme/60 hover:border-accent/70"}`}>
                    <img src={category.image || FALLBACK_CATEGORY_IMAGE} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_CATEGORY_IMAGE; }} className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <span className="absolute inset-x-3 bottom-3 truncate text-left text-sm font-semibold text-white">{category.name}</span>
                  </Link>)}
                  {hasMoreCategories && <Link to="/categories" onClick={closeMenu} className="flex h-28 items-center justify-center gap-2 rounded-2xl border border-dashed border-border-theme bg-surface/50 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent sm:h-32">View all categories <i className="ri-arrow-right-line" /></Link>}
                </div> : <p className="p-4 text-sm text-foreground/60">No categories are available yet.</p>}
              </section>

              <aside className="hidden min-h-0 border-l border-border-theme/70 bg-surface/35 p-5 lg:flex lg:flex-col" aria-label="Subcategories">
                {selected ? <>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="text-xs text-foreground/50">Browse in</p><Link to={categoryUrl(selected)} onClick={closeMenu} className="block truncate text-base font-bold text-foreground hover:text-accent">{selected.name}</Link></div>
                    <Link to={categoryUrl(selected)} onClick={closeMenu} aria-label={`View all ${selected.name}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground hover:text-accent"><i className="ri-arrow-right-line" /></Link>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {subcategoriesLoading && !subcategories.length ? <p className="py-4 text-sm text-foreground/50">Loading subcategories…</p> : subcategories.length ? <div className="space-y-1">
                      {subcategories.map((subcategory) => <Link key={subcategory._id} to={categoryUrl(subcategory)} onClick={closeMenu} className="group flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 text-sm font-medium text-foreground transition hover:bg-background hover:text-accent">
                        <img src={subcategory.image || FALLBACK_CATEGORY_IMAGE} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_CATEGORY_IMAGE; }} className="h-9 w-9 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate">{subcategory.name}</span><i className="ri-arrow-right-s-line text-foreground/30 group-hover:text-accent" />
                      </Link>)}
                      {hasMoreSubcategories && <button type="button" onClick={loadMoreSubcategories} className="mt-2 w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-accent hover:bg-background">{subcategoriesLoading ? "Loading…" : "Load more subcategories"}</button>}
                    </div> : <p className="py-4 text-sm text-foreground/50">No subcategories yet. View all products in {selected.name}.</p>}
                  </div>
                </> : <p className="text-sm text-foreground/50">Choose a category to see its subcategories.</p>}
              </aside>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default CategoryMenu;
