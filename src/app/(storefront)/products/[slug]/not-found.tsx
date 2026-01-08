import Link from "next/link";
import { PackageX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <PackageX className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Product Not Found</h1>
      <p className="mb-6 text-center text-muted-foreground max-w-md">
        The product you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link href="/products">
        <Button>Browse Products</Button>
      </Link>
    </div>
  );
}
