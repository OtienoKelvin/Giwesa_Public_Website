import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const insights = path.join(root, "public", "insights");
const og = path.join(root, "public", "og");
await mkdir(insights, { recursive: true });
await mkdir(og, { recursive: true });

const navy = "#013e77";
const navyDeep = "#012b56";
const green = "#61a627";
const amber = "#dd9912";
const cream = "#f7f3e9";
const ink = "#122a3a";

const grain = `
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.045"/></feComponentTransfer>
  </filter>
`;

function coverSvg({ background, accent, title, kicker, variant }) {
  const marks =
    variant === 1
      ? `
        <path d="M760 620 C820 450 830 300 940 180" fill="none" stroke="${cream}" stroke-width="2" opacity=".38"/>
        <g>
          <rect x="690" y="470" width="70" height="190" rx="35" fill="${green}"/>
          <rect x="790" y="380" width="70" height="280" rx="35" fill="${amber}"/>
          <rect x="890" y="270" width="70" height="390" rx="35" fill="${cream}"/>
        </g>
        <circle cx="1010" cy="205" r="78" fill="none" stroke="${cream}" stroke-width="2" opacity=".45"/>
        <path d="M180 120 C420 120 580 300 580 520 C580 650 500 730 390 760" fill="none" stroke="${cream}" stroke-width="110" stroke-linecap="round" opacity=".1"/>
      `
      : variant === 2
        ? `
        <circle cx="900" cy="250" r="160" fill="none" stroke="${cream}" stroke-width="2" opacity=".35"/>
        <circle cx="900" cy="250" r="105" fill="${amber}" opacity=".9"/>
        <path d="M620 680 C760 510 760 360 1010 300" fill="none" stroke="${cream}" stroke-width="2" opacity=".45"/>
        <path d="M160 620 C300 450 470 430 590 560" fill="none" stroke="${green}" stroke-width="80" stroke-linecap="round" opacity=".85"/>
        <circle cx="690" cy="520" r="46" fill="${cream}"/>
        <circle cx="520" cy="380" r="30" fill="${cream}" opacity=".55"/>
      `
        : `
        <path d="M150 610 C280 520 380 500 500 590" fill="none" stroke="${cream}" stroke-width="2" opacity=".4"/>
        <path d="M690 660 C690 440 820 330 1020 330" fill="none" stroke="${cream}" stroke-width="2" opacity=".4"/>
        <circle cx="820" cy="340" r="150" fill="${cream}" opacity=".12"/>
        <circle cx="820" cy="340" r="96" fill="none" stroke="${cream}" stroke-width="2" opacity=".7"/>
        <circle cx="820" cy="340" r="42" fill="${amber}"/>
        <rect x="690" y="500" width="260" height="160" rx="24" fill="${cream}" opacity=".94"/>
        <path d="M740 580 L790 580 M740 610 L850 610" stroke="${navy}" stroke-width="8" stroke-linecap="round"/>
      `;

  return `
  <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
    <defs>${grain}</defs>
    <rect width="1200" height="800" fill="${background}"/>
    <g opacity=".35" stroke="${cream}" stroke-width="1">
      <line x1="80" y1="80" x2="1120" y2="80"/>
      <line x1="80" y1="720" x2="1120" y2="720"/>
      <line x1="80" y1="80" x2="80" y2="720"/>
      <line x1="1120" y1="80" x2="1120" y2="720"/>
    </g>
    ${marks}
    <g font-family="Arial, Helvetica, sans-serif">
      <text x="110" y="140" fill="${cream}" font-size="15" letter-spacing="6" opacity=".8">GIWESA INSIGHTS</text>
      <text x="110" y="530" fill="${cream}" font-size="20" letter-spacing="3" opacity=".8">${kicker}</text>
      <text x="110" y="624" fill="${cream}" font-size="72" font-family="Georgia, 'Times New Roman', serif" letter-spacing="-2">${title[0]}</text>
      <text x="110" y="704" fill="${cream}" font-size="72" font-family="Georgia, 'Times New Roman', serif" letter-spacing="-2">${title[1]}</text>
    </g>
    <rect width="1200" height="800" fill="${accent}" opacity=".035"/>
    <rect x="0" y="0" width="1200" height="800" filter="url(#grain)" opacity=".55"/>
  </svg>`;
}

const covers = [
  {
    file: "cover-savings.png",
    svg: coverSvg({
      background: navy,
      accent: green,
      kicker: "SAVINGS + CREDIT",
      title: ["Small steps,", "steady ground."],
      variant: 1,
    }),
  },
  {
    file: "cover-borrowing.png",
    svg: coverSvg({
      background: navyDeep,
      accent: amber,
      kicker: "MONEY BASICS",
      title: ["Saving and borrowing,", "side by side."],
      variant: 2,
    }),
  },
  {
    file: "cover-welfare.png",
    svg: coverSvg({
      background: "#2f5d36",
      accent: green,
      kicker: "FAMILY PROTECTION",
      title: ["A plan for", "the unexpected."],
      variant: 3,
    }),
  },
];

for (const cover of covers) {
  await sharp(Buffer.from(cover.svg)).png({ quality: 92 }).toFile(path.join(insights, cover.file));
}

// A share image built from the supplied GIWESA logo, not a redrawn mark.
const logoPath = path.join(root, "public", "giwesa-logo.jpg");
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${cream}"/>
  <rect x="0" y="0" width="1200" height="12" fill="${green}"/>
  <rect x="0" y="12" width="400" height="6" fill="${amber}"/>
  <rect x="400" y="12" width="800" height="6" fill="${navy}"/>
  <text x="80" y="150" fill="${navy}" font-size="18" letter-spacing="6" font-family="Arial, sans-serif">GIWESA SOLUTIONS</text>
  <text x="80" y="360" fill="${ink}" font-size="84" font-family="Georgia, serif">Financial confidence,</text>
  <text x="80" y="450" fill="${ink}" font-size="84" font-family="Georgia, serif" font-style="italic">built with community.</text>
  <text x="82" y="540" fill="#4f5e58" font-size="22" font-family="Arial, sans-serif">Savings · Micro-loans · Welfare · Community</text>
  <rect x="905" y="88" width="220" height="220" rx="28" fill="#ffffff"/>
  <text x="82" y="590" fill="#4f5e58" font-size="18" font-family="Arial, sans-serif">www.giwesa.co.ke</text>
</svg>`;

const logoBuffer = await sharp(logoPath).resize(188, 188, { fit: "contain" }).toBuffer();

await sharp(Buffer.from(ogSvg))
  .composite([{ input: logoBuffer, top: 104, left: 921 }])
  .png()
  .toFile(path.join(og, "giwesa-og.png"));

console.log("Generated editorial cover art and the Open Graph image.");
