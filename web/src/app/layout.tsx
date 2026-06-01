import type { Viewport } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import { Providers } from "./providers";
import { buildRootLayoutMetadata } from "@/lib/appBrandingMetadata";
import { USER_PREFERENCES_INIT_SCRIPT } from "@/lib/userPreferences";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata() {
  return buildRootLayoutMetadata();
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: USER_PREFERENCES_INIT_SCRIPT }} />
      </head>
      <body className="premium-body min-h-full font-sans antialiased text-base text-stone-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
