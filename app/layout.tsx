import type { Metadata } from "next";
import "./globals.css";
import "./ocr.css";
import "./final.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:5173"),
  title: "Triage247Ng",
  manifest: "/manifest.webmanifest",
  description: "Independent, AI-assisted cyber incident triage and routing for Nigerian institutions.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Triage247Ng — Intelligent Cyber Incident Triage & Routing",
    description: "Report securely. Triage intelligently. Respond faster.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Triage247Ng intelligent cyber incident triage and routing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Triage247Ng — Intelligent Cyber Incident Triage & Routing",
    description: "Report securely. Triage intelligently. Respond faster.",
    images: ["/og.png"],
  },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
