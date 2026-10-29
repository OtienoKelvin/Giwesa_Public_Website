import type { Metadata } from "next";

import { getSiteSettings } from "@/domains/site-settings/service";
import { PageHeader } from "@/components/public/page-header";
import { LegalDraftNotice } from "@/components/public/legal-draft-notice";

export const metadata: Metadata = {
  title: "Website terms",
  description:
    "Terms for using the GIWESA Solutions public website and the information published on it.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true },
};

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        eyebrow="Website terms"
        title="Terms for using this website."
        description="These terms explain the status of the information on this public website and the rules that apply when you use it."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Website terms" }]}
      />

      <section className="bg-canvas">
        <div className="container-page py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <LegalDraftNotice />

            <div className="prose-giwesa mt-10">
              <p>
                This website is operated by GIWESA Solutions. By using it, you agree to these
                website terms. If you do not agree, please do not use the site.
              </p>

              <h2>Information, not an offer</h2>
              <p>
                The content on this website is general information about GIWESA and its solutions.
                It is not a loan offer, an offer of membership, an insurance contract, or a
                guarantee of eligibility.
              </p>
              <p>
                Product summaries, rates, limits and package levels are published in good faith but
                may change. The terms that apply to you are those confirmed by GIWESA through its
                formal process before you commit.
              </p>

              <h2>No automatic agreement</h2>
              <p>
                Sending an inquiry or consultation request does not create a membership, loan,
                welfare cover, partnership or confirmed appointment. A consultation request is a
                request for the team to contact you, not a booking confirmation.
              </p>

              <h2>Not financial advice</h2>
              <p>
                Articles and other educational content on this site are general information, not
                personal financial, legal, tax or investment advice. Please speak with a qualified
                professional about your own circumstances where appropriate.
              </p>

              <h2>Acceptable use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>use the website for unlawful or fraudulent purposes;</li>
                <li>attempt to access the admin area or any non-public part of the system;</li>
                <li>interfere with the website&apos;s security or availability; or</li>
                <li>
                  submit information that is false, abusive or belongs to another person without
                  permission.
                </li>
              </ul>

              <h2>Intellectual property</h2>
              <p>
                The GIWESA name, logo and website content are protected by applicable intellectual
                property rules. You may read and share links to the content, but you may not
                reproduce it for commercial use without written permission.
              </p>

              <h2>External links</h2>
              <p>
                This website may link to third-party sites. GIWESA does not control those sites and
                is not responsible for their content or privacy practices.
              </p>

              <h2>Privacy</h2>
              <p>
                Our <a href="/privacy">privacy notice</a> explains how information submitted through
                this website is handled.
              </p>

              <h2>Availability and liability</h2>
              <p>
                We aim to keep the website accurate and available, but we do not guarantee
                uninterrupted access or that every page will always be current. To the extent
                permitted by law, GIWESA is not liable for loss arising solely from reliance on
                general website content. This does not limit any rights that cannot lawfully be
                excluded.
              </p>

              <h2>Governing law</h2>
              <p>
                These website terms are intended to be governed by the laws of Kenya. Any dispute
                relating to the website is subject to the jurisdiction of the Kenyan courts.
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
