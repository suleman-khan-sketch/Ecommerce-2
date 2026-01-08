import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import StaffTable from "@/app/(dashboard)/staff/_components/staff-table";
import StaffFilters from "@/app/(dashboard)/staff/_components/StaffFilters";

export const metadata: Metadata = {
  title: "Staff",
};

export default async function AdminStaffPage() {
  return (
    <section>
      <PageTitle>Staff</PageTitle>
      <StaffFilters />
      <StaffTable />
    </section>
  );
}
