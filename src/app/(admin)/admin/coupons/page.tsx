import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import Coupons from "@/app/(dashboard)/coupons/_components";

export const metadata: Metadata = {
  title: "Coupons",
};

export default async function AdminCouponsPage() {
  return (
    <section>
      <PageTitle>Coupons</PageTitle>
      <Coupons />
    </section>
  );
}
