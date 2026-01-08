import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import OrdersTable from "@/app/(dashboard)/orders/_components/orders-table";
import OrderFilters from "@/app/(dashboard)/orders/_components/OrderFilters";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage() {
  return (
    <section>
      <PageTitle>Orders</PageTitle>
      <OrderFilters />
      <OrdersTable />
    </section>
  );
}
