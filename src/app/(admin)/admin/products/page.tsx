import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import Products from "@/app/(dashboard)/products/_components";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminProductsPage() {
  return (
    <section>
      <PageTitle>Products</PageTitle>
      <Products />
    </section>
  );
}
