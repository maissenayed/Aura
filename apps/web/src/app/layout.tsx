import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "../components/pwa/ServiceWorkerRegister";
import { THEME_BOOT_SCRIPT } from "../utils/themeBoot";

/**
 * One family in three widths: narrow for titles and numbers, normal for text,
 * wide for small labels. Variable, with the width axis, so it is one file.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Aura",
  description: "Earn your aura. Your training as an RPG: daily quests, bosses to beat and a skill tree to climb, for calisthenics, the gym, bouldering and yoga.",
  applicationName: "Aura",
  // iPhone "Add to Home Screen": opens full screen with its own name; the icon is app/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "Aura",
    statusBarStyle: "black",
  },
  formatDetection: { telephone: false },
  // `appleWebApp.capable` only emits `mobile-web-app-capable`; iPhones before iOS 26 still look for the Apple name.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#0e0d0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The theme script sets data-theme before React hydrates, so the attribute may differ from the server's.
    <html lang="en" className={`${archivo.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-ink-950 text-fg">
        {/* Outside the sign-in wall, so Chrome can offer "Install" from the sign-in screen too. */}
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
