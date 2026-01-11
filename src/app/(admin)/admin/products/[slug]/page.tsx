import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { FaEdit } from "react-icons/fa";

import { createServerClient } from "@/lib/supabase/server";
import { fetchProductDetails } from "@/services/products";
import PageTitle from "@/components/shared/PageTitle";
import Typography from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditProductSheet } from "@/app/(dashboard)/products/[slug]/_components/EditProductSheet";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();

  try {
    const { product } = await fetchProductDetails(supabase, { slug });
    return {
      title: product.name,
    };
  } catch {
    return {
      title: "Product Not Found",
    };
  }
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  try {
    const { product } = await fetchProductDetails(supabase, { slug });

    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <PageTitle>{product.name}</PageTitle>
          <EditProductSheet product={product}>
            <Button>
              <FaEdit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </EditProductSheet>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Product Image */}
          <Card className="p-4">
            <div className="aspect-square relative overflow-hidden rounded-lg">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </Card>

          {/* Product Details */}
          <Card className="p-6 space-y-4">
            <div>
              <Typography className="text-sm text-muted-foreground">
                Category
              </Typography>
              <Typography className="font-medium">
                {product.categories?.name || "Uncategorized"}
              </Typography>
            </div>

            <div>
              <Typography className="text-sm text-muted-foreground">
                SKU
              </Typography>
              <Typography className="font-medium">{product.sku}</Typography>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography className="text-sm text-muted-foreground">
                  Cost Price
                </Typography>
                <Typography className="font-medium">
                  ${product.cost_price.toFixed(2)}
                </Typography>
              </div>
              <div>
                <Typography className="text-sm text-muted-foreground">
                  Selling Price
                </Typography>
                <Typography className="font-medium text-primary">
                  ${product.selling_price.toFixed(2)}
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography className="text-sm text-muted-foreground">
                  Stock
                </Typography>
                <Typography className="font-medium">{product.stock}</Typography>
              </div>
              <div>
                <Typography className="text-sm text-muted-foreground">
                  Min Stock Threshold
                </Typography>
                <Typography className="font-medium">
                  {product.min_stock_threshold}
                </Typography>
              </div>
            </div>

            {product.description && (
              <div>
                <Typography className="text-sm text-muted-foreground">
                  Description
                </Typography>
                <Typography className="text-sm mt-1">
                  {product.description}
                </Typography>
              </div>
            )}
          </Card>
        </div>
      </section>
    );
  } catch {
    notFound();
  }
}
