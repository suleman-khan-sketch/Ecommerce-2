import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import Categories from "@/app/(dashboard)/categories/_components";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  return (
    <section>
      <PageTitle>Categories</PageTitle>
      <Categories />
    </section>
  );
}
