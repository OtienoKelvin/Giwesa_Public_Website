import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GIWESA Solutions",
    short_name: "GIWESA",
    description:
      "Savings, micro-loans, welfare protection and community development from GIWESA Solutions.",
    start_url: "/",
    display: "browser",
    background_color: "#faf7f0",
    theme_color: "#013e77",
    icons: [
      {
        src: "/giwesa-logo.jpg",
        sizes: "640x640",
        type: "image/jpeg",
      },
    ],
  };
}
