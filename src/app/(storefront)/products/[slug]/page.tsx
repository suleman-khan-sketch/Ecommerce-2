import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AddToCartButton from "./_components/AddToCartButton";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const supabase = await createServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      description,
      selling_price,
      cost_price,
      image_url,
      stock,
      sku,
      categories (
        id,
        name,
        slug
      )
    `
    )
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description || `Buy ${product.name} at great prices`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const inStock = product.stock > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-foreground">
              Products
            </Link>
            {product.categories && (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${product.categories.slug}`}
                  className="hover:text-foreground"
                >
                  {product.categories.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {!inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Badge variant="destructive" className="px-4 py-2 text-lg">
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              {product.categories && (
                <Link
                  href={`/products?category=${product.categories.slug}`}
                  className="mb-2 text-sm text-primary hover:underline"
                >
                  {product.categories.name}
                </Link>
              )}

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  ${product.selling_price.toFixed(2)}
                </span>
                {product.cost_price > product.selling_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.cost_price.toFixed(2)}
                  </span>
                )}
              </div>

              <Separator className="my-6" />

              {product.description && (
                <div className="prose prose-sm dark:prose-invert mb-6">
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              <div className="mb-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-medium">{product.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Availability:</span>
                  {inStock ? (
                    <Badge variant="outline" className="text-green-600">
                      In Stock ({product.stock} available)
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
              </div>

              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.selling_price,
                  image: product.image_url,
                  category: product.categories?.name || "Uncategorized",
                }}
                inStock={inStock}
              />

              <Separator className="my-6" />

              {/* Additional Info */}
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Free Shipping</h3>
                  <p className="text-muted-foreground">
                    Free shipping on orders over $50
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Secure Payment</h3>
                  <p className="text-muted-foreground">
                    Your payment information is processed securely
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
