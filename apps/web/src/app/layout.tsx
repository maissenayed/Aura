import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/** Body text: the few words the game still needs. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Numbers, names and headings. Not a variable font, so the weights are listed. */
const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Calisthenics Skill Tree | RPG Bodyweight Roadmap",
  description: "Gamified RPG roadmap from beginner bodyweight exercises to pro-level static holds across Push, Pull, Core, and Legs.",
  applicationName: "Aura",
  // iPhone "Add to Home Screen": opens full screen with its own name; the icon is app/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "Aura",
    statusBarStyle: "black",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#06070b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${chakra.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-ink-950 text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
