import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, User, Settings, ShoppingBag } from "lucide-react";

import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your account and view your orders",
};

interface CustomerProfile {
  name: string;
  image_url: string | null;
  role: string;
  store_name?: string;
  address?: string;
  phone?: string;
  ein?: string;
  age_verified?: boolean;
}

async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data: profile } = await supabase.rpc("get_my_profile");
  return profile as CustomerProfile | null;
}

async function getRecentOrders() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
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
    .select("id, invoice_no, total_amount, status, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return orders || [];
}

export default async function AccountPage() {
  const profile = await getCustomerProfile();

  if (!profile) {
    redirect("/login?redirect_to=/account");
  }

  const recentOrders = await getRecentOrders();

  const accountLinks = [
    {
      title: "My Orders",
      description: "View your order history and track shipments",
      href: "/account/orders",
      icon: Package,
    },
    {
      title: "Profile Settings",
      description: "Update your personal information",
      href: "/account/profile",
      icon: User,
    },
    {
      title: "Account Settings",
      description: "Manage your account preferences",
      href: "/account/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {profile.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accountLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Orders</h2>
          <Link href="/account/orders">
            <Button variant="outline">View All Orders</Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No orders yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                You haven&apos;t placed any orders yet.
              </p>
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{order.invoice_no}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : order.status === "cancelled"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : order.status === "processing"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${order.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
