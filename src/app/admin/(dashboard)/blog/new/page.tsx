import type { Metadata } from "next";

import { requireAdminPage } from "@/domains/auth/current";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { BlogPostForm } from "@/components/admin/blog-form";

export const metadata: Metadata = { title: "New article" };

export default async function NewBlogPostPage() {
  const admin = await requireAdminPage();

  return (
    <>
      <AdminPageHeader
        title="New article"
        description="Write a draft, preview it, then publish when it is ready."
        backHref="/admin/blog"
      />
      <BlogPostForm adminName={admin.name} />
    </>
  );
}
