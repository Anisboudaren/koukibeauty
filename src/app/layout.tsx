import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import {
  SITE_NAME,
  SITE_NAME_AR,
  SITE_TAGLINE,
  SITE_URL,
  SITE_LOCALE,
} from "@/lib/seo";
import { Providers } from "@/components/providers";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_NAME_AR}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  authors: [{ name: "Kouki", url: SITE_URL }],
  creator: "Kouki",
  publisher: SITE_NAME,
  keywords: [
    "كوكي بيوتي",
    "koukibeauty",
    "أكاديمية جمال",
    "دورات مكياج",
    "دورات شعر",
    "تعليم التجميل",
    "الجزائر",
    "online beauty courses",
  ],
  icons: {
    icon: [
      { url: "/icon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon/K.png", sizes: "1080x1080", type: "image/png" },
    ],
    apple: [
      {
        url: "/icon/apple-touch-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/icon/favicon-32.png"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_NAME_AR}`,
    description: SITE_TAGLINE,
    images: [
      {
        url: "/icon/K.png",
        width: 1080,
        height: 1080,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} | ${SITE_NAME_AR}`,
    description: SITE_TAGLINE,
    images: ["/icon/K.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbeaed" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0808" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: SITE_NAME_AR,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon/K.png`,
      },
      image: `${SITE_URL}/icon/K.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_TAGLINE,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "ar",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full bg-black`}>
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
