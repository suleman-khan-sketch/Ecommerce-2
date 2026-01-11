import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";

import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View your order history",
};

async function getOrders() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    return [];
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id,
      invoice_no,
      total_amount,
      status,
      payment_method,
      created_at,
      order_items (
        quantity,
        unit_price,
        products (name)
      )
    `
    )
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return orders || [];
}

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default async function OrdersPage() {
  const orders = await getOrders();

  if (orders === null) {
    redirect("/login?redirect_to=/account/orders");
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Account
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="mt-1 text-muted-foreground">
          View and track your order history
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No orders yet</h2>
            <p className="mb-6 text-center text-muted-foreground">
              You haven&apos;t placed any orders yet. Start shopping to see your
              orders here.
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-lg font-semibold hover:text-primary"
                      >
                        Order #{order.invoice_no}
                      </Link>
                      <Badge
                        className={`capitalize ${statusColors[order.status] || ""}`}
                        variant="secondary"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <Link href={`/account/orders/${order.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {order.order_items.length} item
                    {order.order_items.length !== 1 ? "s" : ""}:{" "}
                    {order.order_items
                      .slice(0, 3)
                      .map((item) => item.products?.name)
                      .join(", ")}
                    {order.order_items.length > 3 &&
                      ` and ${order.order_items.length - 3} more`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
