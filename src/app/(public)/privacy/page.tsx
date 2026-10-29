import type { Metadata } from "next";

import { getSiteSettings } from "@/domains/site-settings/service";
import { PageHeader } from "@/components/public/page-header";
import { LegalDraftNotice } from "@/components/public/legal-draft-notice";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How GIWESA Solutions handles information submitted through this public website.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="How we handle your information."
        description="This notice explains what this public website collects, why it is collected and how to contact GIWESA about it."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
      />

      <section className="bg-canvas">
        <div className="container-page py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <LegalDraftNotice />

            <div className="prose-giwesa mt-10">
              <p>
                This notice covers the public GIWESA Solutions website. It does not cover the
                separate internal financial management system or the records of an existing member,
                which are governed by separate arrangements.
              </p>

              <h2>Information we collect</h2>
              <p>When you submit the inquiry or consultation-request form, we collect:</p>
              <ul>
                <li>your name, phone number and email address;</li>
                <li>the area or subject you selected;</li>
                <li>the message you choose to send;</li>
                <li>for a consultation request, your preferred date and time period; and</li>
                <li>the time you accepted the privacy notice.</li>
              </ul>
              <p>
                Our hosting and security infrastructure may also process standard technical
                information needed to serve the website and protect it from abuse. The public
                inquiry and booking forms do not require an account.
              </p>

              <h2>How we use it</h2>
              <ul>
                <li>to respond to your inquiry or consultation request;</li>
                <li>to follow up on the conversation you started;</li>
                <li>to keep an internal record of correspondence;</li>
                <li>to operate, secure and improve the website; and</li>
                <li>to meet applicable legal or accounting obligations.</li>
              </ul>

              <h2>Cookies</h2>
              <p>
                The public website does not use analytics, advertising or marketing cookies. The
                only cookie set by this application is an HttpOnly session cookie used by authorised
                staff to sign in to the admin area. It is not used to track visitors.
              </p>

              <h2>Sharing</h2>
              <p>
                We do not sell personal information. Where a service provider helps us operate the
                website or deliver email notifications, it may process the minimum information
                needed for that service. We may also disclose information where the law requires it.
              </p>

              <h2>Retention</h2>
              <p>
                Inquiry and booking records are kept only for as long as needed to handle the
                request, maintain a record of correspondence and meet applicable obligations. We
                then delete or anonymise them in line with our internal retention practice.
              </p>

              <h2>Security</h2>
              <p>
                Access to submitted leads is restricted to authorised staff. Administrative
                passwords are stored as Argon2id hashes, admin sessions use HttpOnly cookies, and
                session tokens are stored only as hashes. No system is completely secure, but we
                take reasonable steps to protect the information we hold.
              </p>

              <h2>Your choices and rights</h2>
              <p>
                You can ask us for a copy of the information you submitted, ask us to correct it, or
                ask us to delete it where we do not need to keep it. Contact{" "}
                <a href={`mailto:${settings.email}`}>{settings.email}</a> or call{" "}
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a>. We
                may need to verify your identity before acting on a request.
              </p>

              <h2>Children</h2>
              <p>
                GIWESA&apos;s financial products are intended for adults. This website is not
                directed at children, and we ask that visitors do not submit personal information on
                behalf of a child.
              </p>

              <h2>Changes to this notice</h2>
              <p>
                We may update this notice as the website or our practices change. The current
                version will always be published on this page.
              </p>

              <h2>Contact</h2>
              <address className="not-italic">
                <strong>GIWESA Solutions</strong>
                <br />
                {settings.address}
                <br />
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
                <br />
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a>
              </address>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
