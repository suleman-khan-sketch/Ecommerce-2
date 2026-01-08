import { Fragment } from "react";
import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import SalesOverview from "@/app/(dashboard)/_components/SalesOverview";
import StatusOverview from "@/app/(dashboard)/_components/StatusOverview";
import DashboardCharts from "@/app/(dashboard)/_components/dashboard-charts";
import RecentOrders from "@/app/(dashboard)/orders/_components/orders-table";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  return (
    <Fragment>
      <section>
        <PageTitle>Dashboard Overview</PageTitle>

        <div className="space-y-8 mb-8">
          <SalesOverview />
          <StatusOverview />
          <DashboardCharts />
        </div>
      </section>

      <section>
        <PageTitle component="h2">Recent Orders</PageTitle>

        <RecentOrders />
      </section>
    </Fragment>
  );
}
