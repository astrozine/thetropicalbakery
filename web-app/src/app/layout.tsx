import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import GlobalMenuTeaser from "@/components/GlobalMenuTeaser";
import Providers from "@/app/Providers";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Tropical Bakery",
  description: "Experience the ultimate in healthy, tropical indulgence. SOS-Free, Vegan, and Gluten-Free Surprise Treat Boxes.",
  metadataBase: new URL('https://the-tropical-bakery.vercel.app'),
  openGraph: {
    title: "The Tropical Bakery",
    description: "Experience the ultimate in healthy, tropical indulgence.",
    url: "https://the-tropical-bakery.vercel.app",
    siteName: "The Tropical Bakery",
    images: [
      {
        url: "https://the-tropical-bakery.vercel.app/box1.jpg",
        width: 1200,
        height: 630,
        alt: "The Tropical Bakery Surprise Treat Box",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navigation />
          <CartDrawer />
          <main style={{ paddingBottom: '80px' }}>
            {children}
          </main>
          <GlobalMenuTeaser />
          <Footer />
          <MobileBottomNav />
        </Providers>
        <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
        <Script id="google-translate-script" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'pt',
                includedLanguages: 'pt,en,es,it,fr,de,nl'
              }, 'google_translate_element');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
