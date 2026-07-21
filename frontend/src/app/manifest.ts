import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Connect HR",
    short_name: "Connect HR",
    description: "Attendance, leave, payroll, documents, and employee services in one place.",
    id: "/",
    start_url: "/",
    scope: "/",
    lang: "en-IN",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F5F8FC",
    theme_color: "#0B72E7",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
