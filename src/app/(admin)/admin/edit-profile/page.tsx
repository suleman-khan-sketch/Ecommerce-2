import { Metadata } from "next";
import { redirect } from "next/navigation";

import PageTitle from "@/components/shared/PageTitle";
import EditProfileForm from "@/app/(dashboard)/edit-profile/_components/EditProfileForm";
import { fetchStaffDetails } from "@/services/staff";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit Profile",
};

// Force dynamic rendering to ensure cookies() works properly
export const dynamic = 'force-dynamic';

export default async function AdminEditProfilePage() {
  const profile = await fetchStaffDetails(await createServerClient());

  if (!profile) {
    redirect("/login");
  }

  return (
    <section>
      <PageTitle>Edit Profile</PageTitle>
      <EditProfileForm profile={profile} />
    </section>
  );
}
