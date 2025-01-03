import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { twMerge } from "tailwind-merge";
import "./globals.css";
import { Providers } from "./providers";

import localFont from "next/font/local";

const simplonNorm = localFont({
  src: [
    { path: "../../public/fonts/SimplonNorm-Light.otf", weight: "400" },
    { path: "../../public/fonts/SimplonNorm-Regular.otf", weight: "500" },
    { path: "../../public/fonts/SimplonNorm-Bold.otf", weight: "700" },
  ],
  variable: "--font-simplon-norm",
});
const simplonMono = localFont({
  src: [
    { path: "../../public/fonts/SimplonMono-Light.otf", weight: "400" },
    { path: "../../public/fonts/SimplonMono-Regular.otf", weight: "500" },
    { path: "../../public/fonts/SimplonMono-Bold.otf", weight: "700" },
  ],
  variable: "--font-simplon-mono",
});

export const metadata = {
  title: "Farcaster Frames v2 REVNET",
  description: "A Farcaster Frames v2 demo app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={twMerge(
          simplonNorm.variable,
          simplonMono.variable,
          "bg-darkPurple text-teal-500 font-sans min-h-screen tracking-[0.015em]"
        )}
      >
        <Providers>
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>

        <Toaster />
      </body>
    </html>
  );
}
