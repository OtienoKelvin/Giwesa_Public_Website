import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/domains/auth/password";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL),
});

const products = [
  {
    slug: "savings-and-loans",
    name: "Savings & micro-loans",
    eyebrow: "Save with purpose",
    tagline: "Build a habit today. Open the door to what comes next.",
    summary:
      "Flexible savings plans and savings-linked micro-loans for members working towards a personal goal, a stronger business or a more secure household.",
    overview:
      "GIWESA's savings and loan approach starts with consistency. Members build a savings record, then can discuss credit that reflects that record. Loan limits are linked to total savings, and repayment periods are matched to emergency, development and expansion needs. The key terms are published up front so you can plan before you commit.",
    whoFor:
      "Adults aged 18 and over who want a structured place to save, and members preparing to invest in a business, manage a planned expense or respond to an emergency. The savings route is designed for people who prefer to build borrowing capacity over time rather than take on credit without a savings history.",
    howItWorks: [
      "Register as a member. The registration fee is KES 550 and includes an official membership passbook.",
      "Choose a savings rhythm you can sustain. Active saving for three consecutive months is required before a loan can be considered.",
      "Talk to our team about your goal, the amount you need and how you will repay.",
      "If eligible, the loan limit is up to three times your total savings, at a 10% flat interest rate.",
      "Agree a repayment period: emergency loans run for one month, development loans for three to six months, and expansion loans for up to twelve months.",
      "Keep saving and repay on schedule as you work towards your next milestone.",
    ].join("\n"),
    benefits: [
      "A clear, savings-led route to credit",
      "A loan limit linked to your savings, up to 3× total savings",
      "A 10% flat interest rate published up front",
      "Repayment periods shaped around emergency, development or expansion needs",
      "An official membership passbook to help you keep track",
    ].join("\n"),
    notes:
      "Eligibility and current terms are confirmed with GIWESA before an application is completed. The details on this page reflect GIWESA's current published terms.",
    iconKey: "sprout",
    featured: true,
    displayOrder: 1,
    seoTitle: "Savings & micro-loans | GIWESA Solutions",
    seoDescription:
      "Savings plans and savings-linked micro-loans from GIWESA Solutions in Homa Bay, with clear published terms.",
  },
  {
    slug: "welfare-protection",
    name: "Welfare protection",
    eyebrow: "Stand together",
    tagline: "A plan for the unexpected, and practical support around it.",
    summary:
      "Monthly welfare packages that provide a defined cash benefit and practical bereavement support for members and their families.",
    overview:
      "Welfare cover is about more than a payout. GIWESA's welfare packages give members and their families a defined monthly plan, clear benefit levels and practical support around bereavement. Packages range from KES 100 to KES 1,000 per month, with benefits of KES 30,000 to KES 100,000.",
    whoFor:
      "Individuals and families who want a predictable plan in place for bereavement and related costs, and who value practical support alongside the cash benefit. The right package depends on the level of cover you want and who you are protecting.",
    howItWorks: [
      "Pay the one-time welfare registration fee of KES 200.",
      "Choose one of five monthly packages, from KES 100 to KES 1,000.",
      "Keep your monthly contributions up to date.",
      "Packages 1–4 mature after three months. Package 5 matures after three months for immediate family and five months for parents or in-laws.",
      "Access the additional support benefits, including radio announcements, live streaming and PA system support.",
      "Talk to the GIWESA team when you need help understanding your package or making a claim.",
    ].join("\n"),
    benefits: [
      "Cash benefits from KES 30,000 to KES 100,000, depending on the package",
      "Monthly packages from KES 100 to KES 1,000",
      "A one-time KES 200 welfare registration fee",
      "Free three-day death and burial announcements via Girwa Radio",
      "Live streaming during the night vigil and the burial-day sermon",
      "Complimentary public address (PA) system service",
    ].join("\n"),
    notes:
      "Package benefit amounts, maturity periods and additional support benefits are as published by GIWESA. Confirm the current terms with our team before registering.",
    iconKey: "shield",
    featured: false,
    displayOrder: 2,
    seoTitle: "Welfare protection | GIWESA Solutions",
    seoDescription:
      "GIWESA welfare packages offer cash benefits and practical bereavement support for families in Homa Bay.",
  },
  {
    slug: "community-development",
    name: "Community development",
    eyebrow: "Grow together",
    tagline: "Practical partnerships for shared progress.",
    summary:
      "Partnerships and programmes that support financial inclusion, enterprise development, education and sustainable community growth.",
    overview:
      "GIWESA works with partners and communities on financial inclusion, enterprise development, education, welfare and consultancy. Our role is to connect opportunity with access: listening to local priorities, shaping practical programmes and supporting lasting partnerships.",
    whoFor:
      "Community groups, enterprises, learning institutions and partner organisations exploring practical ways to improve financial access, enterprise development or community wellbeing.",
    howItWorks: [
      "Start with a conversation about the community, group or institution and the change you want to see.",
      "Identify where GIWESA's experience in financial inclusion, enterprise, education or welfare can add practical value.",
      "Shape a partnership or programme with clear roles, expectations and measures.",
      "Deliver together and keep the conversation open as the work develops.",
    ].join("\n"),
    benefits: [
      "A partner who starts by listening",
      "Experience across financial inclusion, enterprise development, education, welfare and consultancy",
      "A practical, partnership-led approach",
      "Clear roles and open communication",
    ].join("\n"),
    notes: "Programme availability depends on the partnership. Talk to us about your idea.",
    iconKey: "people",
    featured: false,
    displayOrder: 3,
    seoTitle: "Community development | GIWESA Solutions",
    seoDescription:
      "GIWESA partners with communities and institutions on financial inclusion, enterprise, education and welfare.",
  },
];

const posts = [
  {
    slug: "five-saving-habits-that-make-a-difference",
    title: "Five small saving habits that can make a real difference",
    excerpt:
      "Saving rarely depends on one big decision. These five habits make it easier to keep going, even when money is tight.",
    category: "FINANCIAL_WELLBEING" as const,
    coverImage: "/insights/cover-savings.png",
    coverAlt:
      "Illustration of growing savings with green, amber and cream columns on a navy background.",
    authorName: "GIWESA Editorial",
    publishedAt: new Date("2026-10-06T09:00:00+03:00"),
    seoTitle: "Five small saving habits that can make a difference | GIWESA",
    seoDescription:
      "Practical saving habits for everyday life, from naming your goal to building a small buffer. Read more from GIWESA Solutions.",
    content: `Saving is often described as a decision. In practice, it is a set of small habits that you repeat until they become part of how you manage money.

You do not need a large income before you start. You need a reason, a rhythm you can sustain, and a way to check your progress without judging yourself too harshly.

## 1. Name the reason

A goal such as "save more" is difficult to measure. "Save for my daughter's school equipment by December" gives you something concrete to work towards.

Write the goal down. Decide what it will cost. Then choose the amount you can set aside regularly, even if it is small.

## 2. Move savings out of everyday reach

Money that stays in the same place as your daily spending is easy to spend. A separate savings account, a wallet with a different purpose, or a deliberate transfer on the same day each week creates a useful boundary.

The point is not to make your money hard to access. It is to make saving a decision you make once, rather than a decision you have to win every day.

## 3. Save at the start, not only at the end

Many people save whatever is left after spending. Often there is nothing left. Try treating savings like a small bill that is due to your future self.

If your income is irregular, choose a percentage rather than a fixed amount. On a good week, that percentage may be more. On a difficult week, it may be less. Consistency matters more than the size of any one transfer.

## 4. Review recurring costs

Small, regular costs add up quietly. Look through your regular payments once a quarter and ask whether each one is still useful.

You are not trying to remove everything enjoyable from your life. You are looking for costs that no longer match what you value.

## 5. Build a small buffer

A buffer is money set aside for the unexpected: a transport repair, a medical cost, a short gap in income. It does not need to cover every possible event. Even a small buffer can reduce the need to borrow when something goes wrong.

Keep the buffer separate from long-term savings where you can. When you use it, rebuild it gradually.

## Progress is not always a straight line

There will be weeks when saving is not possible. That is not a reason to abandon the habit. Start again with the next transfer.

If you would like to build a savings habit with a clear structure, GIWESA's savings and micro-loan team can explain the membership process and current terms.

*This article is general educational information, not personal financial advice. GIWESA's current savings and loan terms are available from our team.*`,
  },
  {
    slug: "saving-and-borrowing-what-is-the-difference",
    title: "Saving and borrowing: what is the difference, and when does each help?",
    excerpt:
      "Savings and credit do different jobs. Understanding the difference can make both decisions clearer.",
    category: "FINANCIAL_WELLBEING" as const,
    coverImage: "/insights/cover-borrowing.png",
    coverAlt: "Illustration of a green arc, cream circle and amber sun on a deep navy background.",
    authorName: "GIWESA Editorial",
    publishedAt: new Date("2026-09-18T09:00:00+03:00"),
    seoTitle: "Saving and borrowing: what is the difference? | GIWESA",
    seoDescription:
      "A plain-language look at saving versus borrowing, the questions to ask before taking credit, and how savings-linked loans work.",
    content: `Saving and borrowing are both tools for managing money, but they do different jobs.

Saving means setting money aside over time. Borrowing means receiving money now and repaying it later, usually with a cost attached. One builds a cushion. The other brings a future obligation into the present.

## Saving creates room to choose

A savings balance can give you options. It can cover a planned expense, reduce the amount you need to borrow, or give you time to make a decision when something unexpected happens.

Savings also creates a record. In a savings-linked lending model, that record can show consistency and help a lender understand how you manage commitments.

## Borrowing can bring a larger goal forward

Credit can be useful when the timing matters: replacing equipment before a busy season, covering a school fee deadline, or taking an opportunity that will not wait.

It can also create difficulty when the repayment is not planned for. Before borrowing, it helps to know:

- The total amount you will repay, not only the monthly amount.
- How long the repayment period lasts.
- What happens if your income is late or lower than expected.
- Whether the loan is linked to savings or another requirement.
- What fees apply, and when.

## A savings-first approach

GIWESA's published lending approach is savings-led. Members save actively for three consecutive months before a loan can be considered. The loan limit is up to three times total savings, at a 10% flat interest rate. Repayment periods are one month for emergency loans, three to six months for development loans, and up to twelve months for expansion loans.

Those terms may not suit every situation. The important step is to compare the repayment with your actual cash flow, not only with the amount you hope to receive.

## Questions to ask before you decide

1. Is this expense planned, or is it an emergency?
2. Could I save for it over a realistic period?
3. If I borrow, what is the full repayment cost?
4. What will I do if my income falls during the repayment period?
5. Have I read the current terms and asked about anything unclear?

Saving and borrowing are not opposites. A healthy financial plan usually includes both: savings for resilience and credit used deliberately for a clear purpose.

*This article is general educational information, not personal financial advice. Confirm current GIWESA terms with our team before applying.*`,
  },
  {
    slug: "questions-before-choosing-welfare-cover",
    title: "Planning for family protection: questions to ask before choosing welfare cover",
    excerpt:
      "A welfare plan should be understood before it is needed. These questions help you compare the options in front of you.",
    category: "FINANCIAL_WELLBEING" as const,
    coverImage: "/insights/cover-welfare.png",
    coverAlt:
      "Illustration of a protected family circle and a cream card on a deep green background.",
    authorName: "GIWESA Editorial",
    publishedAt: new Date("2026-08-29T09:00:00+03:00"),
    seoTitle: "Questions to ask before choosing welfare cover | GIWESA",
    seoDescription:
      "What to consider when planning bereavement protection for your family, including benefit levels, maturity periods and practical support.",
    content: `Bereavement can bring emotional strain and unexpected costs at the same time. A welfare plan cannot remove that difficulty, but it can make the financial side more predictable.

Before choosing a plan, slow down and ask what it actually provides.

## What would the benefit cover?

Start with the costs you want the plan to help with: funeral arrangements, transport, food, or a period away from work. The benefit amount should make sense for the people you are protecting.

GIWESA's welfare packages currently provide cash benefits from KES 30,000 to KES 100,000, depending on the monthly package chosen.

## What is the monthly commitment?

A plan only works if the contribution is sustainable. Compare the monthly amount with your regular income and other commitments.

The GIWESA packages range from KES 100 to KES 1,000 per month, plus a one-time registration fee of KES 200. The lower-cost packages provide a lower cash benefit.

## How long before the plan matures?

Ask when the cover becomes available. GIWESA publishes these maturity periods:

- Packages 1–4 mature after three months.
- Package 5 matures after three months for immediate family and five months for parents or in-laws.

## Who is being protected?

Think about the family members you want the plan to cover and whether the package matches their needs. If your circumstances change, ask how the plan can be reviewed.

## What support comes alongside the cash?

Practical support can matter as much as the payment. GIWESA's welfare benefits include free three-day death and burial announcements via Girwa Radio, live streaming during the night vigil, a complimentary PA system service, and live streaming of the burial-day sermon on Girwa Radio 99.5 FM.

## What happens when you need to claim?

Ask who to contact, what information will be needed, and how the process works. Understand this before a difficult moment arrives, and keep the contact details somewhere your family can find them.

## A plan built on clear information

The right welfare plan is the one you understand and can maintain. Ask for the current terms in writing, check the maturity and benefit details, and speak to the GIWESA team if anything is unclear.

*This article is general educational information, not personal financial advice. Welfare terms and benefit levels are confirmed by GIWESA before registration.*`,
  },
];

async function seedAdmin() {
  const isProduction = process.env.NODE_ENV === "production";
  const email = isProduction
    ? process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase()
    : process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || "admin@giwesa.local";
  const password = isProduction
    ? process.env.BOOTSTRAP_ADMIN_PASSWORD
    : process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const name = isProduction
    ? process.env.BOOTSTRAP_ADMIN_NAME || "GIWESA Administrator"
    : process.env.SEED_ADMIN_NAME || "GIWESA Administrator";

  if (isProduction && (!email || !password)) {
    console.log(
      "No production admin created. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD for a deliberate one-off bootstrap.",
    );
    return;
  }
  if (!email || !password) {
    throw new Error("Admin seed configuration is incomplete.");
  }
  if (isProduction && password.length < 12) {
    throw new Error("The bootstrap admin password must be at least 12 characters.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin account already exists; leaving it unchanged.");
    return;
  }

  await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });
  console.log(
    isProduction
      ? "Bootstrap admin created. Sign in immediately and replace the bootstrap password."
      : "Development admin created.",
  );
}

async function seedSettings() {
  const existing = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (existing) return;
  await prisma.siteSetting.create({
    data: {
      id: 1,
      phone: "+254 117 598094",
      email: "info@giwesasolutions.co.ke",
      address:
        "Homa Bay Town, Off Posta Road, Salama Area (Behind Vilacom Cyber), Homa Bay County, Kenya",
      heroEyebrow: "Savings · Micro-loans · Welfare",
      heroTitle: "Savings, loans and welfare protection, made for everyday life.",
      heroDescription:
        "GIWESA Solutions is a Kenyan microfinance organisation helping individuals, families and small businesses plan, save, borrow and protect what matters — with practical guidance at every step.",
    },
  });
}

async function seedProducts() {
  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) continue;
    await prisma.product.create({ data: product });
  }
}

async function seedPosts() {
  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) continue;
    await prisma.blogPost.create({
      data: { ...post, status: "PUBLISHED" },
    });
  }
}

async function main() {
  await seedAdmin();
  await seedSettings();
  await seedProducts();
  await seedPosts();
  console.log("Seed complete: settings, products and initial insights are available.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
