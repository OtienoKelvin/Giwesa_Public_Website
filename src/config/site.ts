export const SITE = {
  name: "GIWESA Solutions",
  legalName: "GIWESA Solutions & Welfare",
  tagline: "Empowering Communities. Building Prosperity.",
  description:
    "GIWESA Solutions is a Kenyan microfinance organisation offering savings, micro-loans, welfare protection and community development support.",
  website: "https://www.giwesa.co.ke",
  defaultPhone: "+254 117 598094",
  defaultEmail: "info@giwesasolutions.co.ke",
  defaultAddress:
    "Homa Bay Town, Off Posta Road, Salama Area (Behind Vilacom Cyber), Homa Bay County, Kenya",
  logo: "/giwesa-logo.jpg",
} as const;

export const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Solutions", href: "/solutions" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_SOLUTIONS = [
  { label: "Savings & micro-loans", href: "/solutions/savings-and-loans" },
  { label: "Welfare protection", href: "/solutions/welfare-protection" },
  { label: "Community development", href: "/solutions/community-development" },
] as const;

export const FOOTER_COMPANY = [
  { label: "About GIWESA", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
  { label: "Book a consultation", href: "/book" },
] as const;

export const INTEREST_OPTIONS = [
  { value: "savings-and-loans", label: "Savings and micro-loans" },
  { value: "welfare-protection", label: "Welfare protection" },
  { value: "community-development", label: "Community development" },
  { value: "partnership", label: "Partnerships and institutions" },
  { value: "general", label: "General question" },
] as const;

export type InterestValue = (typeof INTEREST_OPTIONS)[number]["value"];

export const INQUIRY_SUBJECTS = [
  ...INTEREST_OPTIONS,
  { value: "careers", label: "Careers" },
  { value: "media", label: "Media and press" },
] as const;

export const PREFERRED_TIMES = [
  { value: "MORNING", label: "Morning (9am–12pm)" },
  { value: "AFTERNOON", label: "Afternoon (12pm–4pm)" },
  { value: "EVENING", label: "Evening (4pm–6pm)" },
] as const;

export const BLOG_CATEGORIES = [
  { value: "FINANCIAL_WELLBEING", label: "Financial wellbeing" },
  { value: "COMMUNITY", label: "Community" },
  { value: "GIWESA_NEWS", label: "GIWESA news" },
] as const;

export const BLOG_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BLOG_CATEGORIES.map((category) => [category.value, category.label]),
);

export type ProductTerm = {
  title: string;
  description?: string;
  rows?: Array<{ label: string; value: string }>;
  packages?: Array<{ name: string; monthly: string; benefit: string }>;
  support?: string[];
};

export const PRODUCT_TERMS: Record<string, ProductTerm[]> = {
  "savings-and-loans": [
    {
      title: "Published membership and loan terms",
      description:
        "These are the terms GIWESA publishes today. Our team will walk you through what applies to your situation before you commit.",
      rows: [
        { label: "Registration fee", value: "KES 550, including an official membership passbook" },
        {
          label: "Eligibility",
          value: "Adults aged 18+ with a valid ID or passport and a passport photo",
        },
        { label: "Loan qualification", value: "Three consecutive months of active savings" },
        { label: "Loan limit", value: "Up to 3× total savings" },
        { label: "Interest rate", value: "10% flat rate" },
        {
          label: "Repayment periods",
          value: "Emergency: 1 month · Development: 3–6 months · Expansion: up to 12 months",
        },
      ],
    },
  ],
  "welfare-protection": [
    {
      title: "Welfare packages",
      description:
        "A one-time registration fee of KES 200 applies. Packages 1–4 mature after three months. Package 5 matures after three months for immediate family and five months for parents or in-laws.",
      packages: [
        { name: "Package 1", monthly: "KES 100", benefit: "KES 30,000" },
        { name: "Package 2", monthly: "KES 200", benefit: "KES 45,000" },
        { name: "Package 3", monthly: "KES 300", benefit: "KES 60,000" },
        { name: "Package 4", monthly: "KES 500", benefit: "KES 75,000" },
        { name: "Package 5", monthly: "KES 1,000", benefit: "KES 100,000" },
      ],
      support: [
        "Free three-day death and burial announcements via Girwa Radio.",
        "Live streaming coverage during the night vigil.",
        "Complimentary public address (PA) system service.",
        "Live streaming of the burial-day sermon on Girwa Radio 99.5 FM.",
      ],
    },
  ],
  "community-development": [
    {
      title: "Our focus areas",
      rows: [
        {
          label: "Financial inclusion",
          value: "Practical access to financial services and know-how",
        },
        {
          label: "Enterprise development",
          value: "Support for enterprise and livelihood opportunities",
        },
        { label: "Education", value: "Financial education and learning that builds confidence" },
        { label: "Consultancy", value: "Partnership and institutional support" },
      ],
    },
  ],
};

export const BLOG_FALLBACK_COVER = "/insights/cover-savings.png";

export const PRODUCT_ICON_KEYS = ["sprout", "shield", "people", "spark"] as const;

export const PRODUCT_FAQS: Record<string, Array<{ question: string; answer: string }>> = {
  "savings-and-loans": [
    {
      question: "Do I need to be a member to save with GIWESA?",
      answer:
        "Yes. Membership registration is KES 550 and includes an official membership passbook. Our team will explain the current process before you join.",
    },
    {
      question: "How soon can I qualify for a loan?",
      answer:
        "The published requirement is three consecutive months of active savings before a loan can be considered.",
    },
    {
      question: "How much can I borrow?",
      answer:
        "The published loan limit is up to three times your total savings. The amount is discussed with GIWESA based on your situation and the current terms.",
    },
    {
      question: "What interest rate applies?",
      answer:
        "The published rate is a 10% flat interest rate. Confirm the current terms with our team before applying.",
    },
    {
      question: "What repayment periods are available?",
      answer:
        "Emergency loans run for one month, development loans for three to six months, and expansion loans for up to twelve months.",
    },
    {
      question: "What do I need to register?",
      answer:
        "Registration is open to adults aged 18 and over with a valid ID or passport and a passport photo.",
    },
  ],
  "welfare-protection": [
    {
      question: "How much does welfare registration cost?",
      answer:
        "The one-time welfare registration fee is KES 200. Monthly package contributions are separate and range from KES 100 to KES 1,000.",
    },
    {
      question: "When do the welfare packages mature?",
      answer:
        "Packages 1–4 mature after three months. Package 5 matures after three months for immediate family and five months for parents or in-laws.",
    },
    {
      question: "What does a welfare package provide?",
      answer:
        "Each package has a defined cash benefit, from KES 30,000 to KES 100,000. Additional support includes death and burial announcements via Girwa Radio, live streaming, and PA system support.",
    },
    {
      question: "How do I make a claim?",
      answer:
        "Contact the GIWESA team as soon as possible. They will guide you through the current process and the information needed for your package.",
    },
    {
      question: "Can I discuss the packages before registering?",
      answer:
        "Yes. Our team can explain the current package levels, maturity periods and support benefits so you can decide what fits your family.",
    },
  ],
  "community-development": [
    {
      question: "What kind of partnerships does GIWESA explore?",
      answer:
        "GIWESA's work spans financial inclusion, enterprise development, education, welfare and consultancy. Partnerships are shaped around the local priority and the value each partner brings.",
    },
    {
      question: "Is there a standard community programme?",
      answer:
        "Community work is shaped with the group, institution or partner involved. Start with a conversation about the change you want to see.",
    },
    {
      question: "How do we start a conversation?",
      answer:
        "Send an inquiry or book a consultation. Tell us about your organisation, the community you work with and the opportunity you have in mind.",
    },
    {
      question: "Where is GIWESA based?",
      answer:
        "GIWESA's head office is in Homa Bay Town, Homa Bay County. Partnership conversations can begin by phone, email or through this website.",
    },
  ],
};
