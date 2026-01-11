import { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerClient } from "@/lib/supabase/server";
import { fetchCustomerOrders } from "@/services/customers";
import PageTitle from "@/components/shared/PageTitle";
import CustomerOrdersTable from "@/app/(dashboard)/customer-orders/[id]/_components/Table";

interface PageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", id)
    .single();

  if (!customer) {
    return { title: "Customer Not Found" };
  }

  return { title: `${customer.name}'s Orders` };
}

export default async function AdminCustomerOrdersPage({ params }: PageParams) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", id)
    .single();

  if (!customer) {
    notFound();
  }

  // Fetch customer orders
  const { customerOrders } = await fetchCustomerOrders(supabase, { id });

  return (
    <section>
      <PageTitle>{`${customer.name}'s Orders`}</PageTitle>
      <CustomerOrdersTable data={customerOrders} />
    </section>
  );
}
