import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../../Products/Components/ProductCard";
import { getAllProductsApi } from "../../Products/Services/product.api";
import { getCategoriesPageApi, getCategoryByIdApi } from "../Services/category.api";

const CATEGORY_PAGE_SIZE = 12;
const FALLBACK_IMAGE = "/hero-categories/home.png";
const categoryUrl = (category) => `/categories/${category.slug || category._id}`;

const CategoryTile = ({ category, compact = false }) => compact ? (
  <Link to={categoryUrl(category)} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border-theme/70 bg-surface p-2 transition hover:border-accent/60 sm:gap-4 sm:p-3">
    <img src={category.image || FALLBACK_IMAGE} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-[76px] sm:w-[76px]" />
    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:text-base">{category.name}</span>
    <i className="ri-arrow-right-line mr-1 shrink-0 text-foreground/40 transition group-hover:translate-x-1 group-hover:text-accent" />
  </Link>
) : (
  <Link to={categoryUrl(category)} className="group overflow-hidden rounded-3xl border border-border-theme/70 bg-surface transition hover:-translate-y-1 hover:border-accent/60">
    <div className="relative aspect-[1.45] overflow-hidden bg-surface-variant/30">
      <img src={category.image || FALLBACK_IMAGE} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
    </div>
    <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <span className="truncate text-sm font-semibold text-foreground sm:text-base">{category.name}</span>
      <i className="ri-arrow-right-line text-foreground/40 transition group-hover:translate-x-1 group-hover:text-accent" />
    </div>
  </Link>
);

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async (nextPage, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const response = await getCategoriesPageApi({ page: nextPage, limit: CATEGORY_PAGE_SIZE, roots: true });
      setCategories((current) => append ? [...current, ...(response?.data || [])] : response?.data || []);
      setHasMore(Boolean(response?.hasMore));
      setPage(nextPage);
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn’t load categories. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCategoriesPageApi({ page: 1, limit: CATEGORY_PAGE_SIZE, roots: true })
      .then((response) => {
        if (cancelled) return;
        setCategories(response?.data || []);
        setHasMore(Boolean(response?.hasMore));
        setPage(1);
      })
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "We couldn’t load categories. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-28 text-foreground sm:px-8 md:pb-16 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Find your next favorite</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Shop all categories</h1><p className="mt-2 max-w-xl text-sm text-foreground/60">Explore the collection by category, then browse its subcategories and products.</p></div>
          <span className="rounded-full bg-surface px-4 py-2 text-sm text-foreground/60">{categories.length}{hasMore ? "+" : ""} categories</span>
        </div>
        {error && <div role="alert" className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">{error} <button type="button" onClick={() => fetchPage(1, false)} className="ml-2 font-semibold underline">Retry</button></div>}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category) => <CategoryTile key={category._id} category={category} />)}
          {loading && !categories.length && Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[1.45] animate-pulse rounded-3xl bg-surface" />)}
        </div>
        {!loading && !categories.length && !error && <p className="mt-10 rounded-3xl bg-surface p-10 text-center text-foreground/60">No categories are available yet.</p>}
        {hasMore && <div className="mt-10 flex justify-center"><button type="button" disabled={loadingMore} onClick={() => fetchPage(page + 1, true)} className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-85 disabled:opacity-50">{loadingMore ? "Loading categories…" : "Load more categories"} {!loadingMore && <i className="ri-arrow-down-line" />}</button></div>}
      </div>
    </main>
  );
};

export const CategoryDetailPage = () => {
  const { categorySlug } = useParams();
  return <CategoryDetail key={categorySlug} categorySlug={categorySlug} />;
};

const CategoryDetail = ({ categorySlug }) => {
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [subPage, setSubPage] = useState(1);
  const [hasMoreSubcategories, setHasMoreSubcategories] = useState(false);
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMoreSubs, setLoadingMoreSubs] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCategoryByIdApi(categorySlug).then(async (categoryResponse) => {
      const currentCategory = categoryResponse?.data;
      const productParams = currentCategory?.parentCategory ? { subcategory: currentCategory._id } : { categories: currentCategory?.name };
      const [subResponse, productResponse] = await Promise.all([
        getCategoriesPageApi({ page: 1, limit: 8, parentCategory: currentCategory?._id }),
        getAllProductsApi({ page: 1, limit: CATEGORY_PAGE_SIZE, ...productParams }),
      ]);
      if (cancelled) return;
      setCategory(currentCategory || null);
      setSubcategories(subResponse?.data || []);
      setHasMoreSubcategories(Boolean(subResponse?.hasMore));
      setProducts(productResponse?.data || []);
      setHasMoreProducts(Boolean(productResponse?.data && productResponse.page < productResponse.pages));
    }).catch((err) => {
      if (!cancelled) setError(err?.response?.data?.message || "We couldn’t load this category. Please try again.");
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [categorySlug]);

  const loadMoreSubcategories = async () => {
    if (!category || loadingMoreSubs) return;
    setLoadingMoreSubs(true);
    try {
      const nextPage = subPage + 1;
      const response = await getCategoriesPageApi({ page: nextPage, limit: 8, parentCategory: category._id });
      setSubcategories((current) => [...current, ...(response?.data || [])]);
      setSubPage(nextPage);
      setHasMoreSubcategories(Boolean(response?.hasMore));
    } finally { setLoadingMoreSubs(false); }
  };

  const loadMoreProducts = async () => {
    if (!category || loadingMoreProducts) return;
    setLoadingMoreProducts(true);
    try {
      const nextPage = productPage + 1;
      const response = await getAllProductsApi({ page: nextPage, limit: CATEGORY_PAGE_SIZE, ...(category?.parentCategory ? { subcategory: category._id } : { categories: category.name }) });
      setProducts((current) => [...current, ...(response?.data || [])]);
      setProductPage(nextPage);
      setHasMoreProducts(Boolean(response?.data && response.page < response.pages));
    } finally { setLoadingMoreProducts(false); }
  };

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-8 md:pb-16 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <Link to="/categories" className="inline-flex items-center gap-2 text-sm font-medium text-foreground/55 hover:text-accent"><i className="ri-arrow-left-line" /> All categories</Link>
        {loading && !category ? <div className="mt-6 h-64 animate-pulse rounded-[32px] bg-surface" /> : error ? <div role="alert" className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-sm text-red-500">{error}</div> : category && <>
          <header className={`mt-5 flex items-center gap-4 rounded-[28px] border border-border-theme/70 bg-surface p-4 sm:gap-7 sm:p-6 ${category.parentCategory ? "sm:min-h-36" : "sm:min-h-52"}`}>
            <div className={`shrink-0 overflow-hidden rounded-2xl bg-background ${category.parentCategory ? "h-20 w-20 sm:h-28 sm:w-28" : "h-24 w-24 sm:h-40 sm:w-40 lg:h-48 lg:w-48"}`}>
              <img src={category.image || FALLBACK_IMAGE} alt={`${category.name} category`} onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 py-1">
              {category.parentCategory?.name && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">{category.parentCategory.name}</p>}
              <h1 className={`break-words font-bold tracking-tight text-foreground ${category.parentCategory ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl lg:text-5xl"}`}>{category.name}</h1>
              {category.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/60 sm:line-clamp-3">{category.description}</p>}
              <p className="mt-2 hidden text-sm text-foreground/50 sm:block">Browse the collection and discover more within {category.name}.</p>
            </div>
          </header>

          {subcategories.length > 0 && <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Explore further</p><h2 className="mt-1 text-xl font-bold">Shop {category.name} by type</h2></div><span className="text-sm text-foreground/50">{subcategories.length}{hasMoreSubcategories ? "+" : ""} subcategories</span></div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">{subcategories.map((subcategory) => <CategoryTile key={subcategory._id} category={subcategory} compact />)}</div>
            {hasMoreSubcategories && <div className="mt-6 flex justify-center"><button type="button" disabled={loadingMoreSubs} onClick={loadMoreSubcategories} className="h-11 rounded-full border border-border-theme px-5 text-sm font-semibold hover:border-accent hover:text-accent disabled:opacity-50">{loadingMoreSubs ? "Loading…" : "Load more subcategories"}</button></div>}
          </section>}

          <section className="mt-12">
            <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">The collection</p><h2 className="mt-1 text-xl font-bold">Products in {category.name}</h2></div>
            {products.length ? <div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <div className="rounded-3xl border border-dashed border-border-theme bg-surface/40 p-10 text-center"><i className="ri-shopping-bag-3-line text-3xl text-foreground/30" /><p className="mt-3 font-semibold">No products in this category yet</p><p className="mt-1 text-sm text-foreground/55">Check back soon for new arrivals.</p></div>}
            {hasMoreProducts && <div className="mt-8 flex justify-center"><button type="button" disabled={loadingMoreProducts} onClick={loadMoreProducts} className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-85 disabled:opacity-50">{loadingMoreProducts ? "Loading products…" : "Load more products"} {!loadingMoreProducts && <i className="ri-arrow-down-line" />}</button></div>}
          </section>
        </>}
      </div>
    </main>
  );
};
