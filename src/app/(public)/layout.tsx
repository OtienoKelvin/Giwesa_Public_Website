import { getSiteSettings } from "@/domains/site-settings/service";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd()]} />
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
