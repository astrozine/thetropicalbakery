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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
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
                includedLanguages: 'pt,en,es,it,fr,de,nl',
                autoDisplay: false
              }, 'google_translate_element');
            }

            // Google's script re-asserts the top banner's inline styles (with its own
            // !important) on its own timer, so a plain inline override loses that fight
            // no matter how often we reapply it. Use !important on our side too, watch
            // for the banner via MutationObserver for an instant reaction, and poll as
            // a fallback for whatever timer Google uses internally.
            function suppressGoogleTranslateBanner() {
              document.body.style.setProperty('top', '0px', 'important');
              document.documentElement.style.setProperty('margin-top', '0px', 'important');
              document.querySelectorAll(
                'iframe.goog-te-banner-frame, .goog-te-banner-frame, body > .skiptranslate, iframe[id^=":"]'
              ).forEach(function(el) {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
                el.style.setProperty('height', '0px', 'important');
              });
            }
            suppressGoogleTranslateBanner();
            setInterval(suppressGoogleTranslateBanner, 250);
            new MutationObserver(suppressGoogleTranslateBanner).observe(document.body, { childList: true, attributes: true, subtree: false });
          `}
        </Script>
      </body>
    </html>
  );
}
