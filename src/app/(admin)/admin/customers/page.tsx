import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import CustomersTable from "@/app/(dashboard)/customers/_components/customers-table";
import CustomerFilters from "@/app/(dashboard)/customers/_components/CustomerFilters";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage() {
  return (
    <section>
      <PageTitle>Customers</PageTitle>
      <CustomerFilters />
      <CustomersTable />
    </section>
  );
}
