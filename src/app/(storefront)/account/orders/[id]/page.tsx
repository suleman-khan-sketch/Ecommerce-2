import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOrder(orderId: string) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { order: null, authorized: false };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    return { order: null, authorized: false };
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      id,
      invoice_no,
      order_time,
      total_amount,
      shipping_cost,
      payment_method,
      status,
      customer_id,
      customers (name, email, phone, address),
      order_items (
        id,
        quantity,
        unit_price,
        products (name, image_url)
      ),
      coupons (discount_type, discount_value)
    `
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return { order: null, authorized: true };
  }

  // Check if order belongs to this customer
  if (order.customer_id !== customer.id) {
    return { order: null, authorized: false };
  }

  return { order, authorized: true };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { order } = await getOrder(id);

  if (!order) {
    return { title: "Order Not Found" };
  }

  return { title: `Order #${order.invoice_no}` };
}

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { order, authorized } = await getOrder(id);

  if (!authorized) {
    redirect("/login?redirect_to=/account/orders");
  }

  if (!order) {
    notFound();
  }

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:px-6">
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.invoice_no}</h1>
          <p className="mt-1 text-muted-foreground">
            Placed on {format(new Date(order.order_time), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <Badge
          className={`w-fit capitalize ${statusColors[order.status] || ""}`}
          variant="secondary"
        >
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.customers?.name}</p>
              {order.customers?.address && (
                <p className="text-muted-foreground whitespace-pre-line">
                  {order.customers.address}
                </p>
              )}
              {order.customers?.phone && (
                <p className="text-muted-foreground">{order.customers.phone}</p>
              )}
              {order.customers?.email && (
                <p className="text-muted-foreground">{order.customers.email}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">
                  {order.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{order.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.products?.name || "Unknown Product"}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>${order.shipping_cost.toFixed(2)}</span>
            </div>
            {order.coupons && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>
                  -
                  {order.coupons.discount_type === "percentage"
                    ? `${order.coupons.discount_value}%`
                    : `$${order.coupons.discount_value.toFixed(2)}`}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
