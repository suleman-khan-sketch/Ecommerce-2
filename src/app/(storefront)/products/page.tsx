import { Metadata } from "next";
import { Suspense } from "react";

import { createServerClient } from "@/lib/supabase/server";
import ProductCard, { Product } from "@/components/storefront/ProductCard";
import ProductFilters from "./_components/ProductFilters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our collection of premium products",
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

async function getProducts(params: {
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
}): Promise<{ products: Product[]; categories: { id: string; name: string; slug: string }[] }> {
  const supabase = createServerClient();

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("published", true)
    .order("name");

  // Build products query
  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      selling_price,
      cost_price,
      image_url,
      stock,
      category_id,
      categories (
        name,
        slug
      )
    `
    )
    .eq("published", true);

  // Filter by category
  if (params.category) {
    const category = categories?.find((c) => c.slug === params.category);
    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  // Search by name
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  // Sort
  switch (params.sort) {
    case "price-asc":
      query = query.order("selling_price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("selling_price", { ascending: false });
      break;
    case "name-asc":
      query = query.order("name", { ascending: true });
      break;
    case "name-desc":
      query = query.order("name", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { products: [], categories: categories || [] };
  }

  const mappedProducts: Product[] = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.selling_price,
    image: p.image_url,
    category: p.categories?.name || "Uncategorized",
    categorySlug: p.categories?.slug,
    inStock: p.stock > 0,
    rating: 4.5,
  }));

  return { products: mappedProducts, categories: categories || [] };
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

async function ProductsGrid({
  category,
  search,
  sort,
  page,
}: {
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
}) {
  const { products, categories } = await getProducts({
    category,
    search,
    sort,
    page,
  });

  return (
    <>
      <ProductFilters categories={categories} />

      {products.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            No products found. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="mt-1 text-lg text-muted-foreground">
              Browse our collection of premium products
            </p>
          </div>

          <Suspense fallback={<ProductsGridSkeleton />}>
            <ProductsGrid
              category={params.category}
              search={params.search}
              sort={params.sort}
              page={params.page}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
