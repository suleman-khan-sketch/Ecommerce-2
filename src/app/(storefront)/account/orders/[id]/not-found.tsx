import Link from "next/link";
import { PackageX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <PackageX className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Order Not Found</h1>
      <p className="mb-6 text-center text-muted-foreground max-w-md">
        The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have
        permission to view it.
      </p>
      <Link href="/account/orders">
        <Button>View My Orders</Button>
      </Link>
    </div>
  );
}
