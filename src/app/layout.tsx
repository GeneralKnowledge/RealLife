import type { Metadata } from "next";
import { Archivo_Black, Manrope } from "next/font/google";
import { AnalyticsBeacon } from "@/lib/analytics-client";
import { appUrl } from "@/lib/urls";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl("/")),
  title: {
    default: "Get Outside",
    template: "%s · Get Outside",
  },
  description:
    "Highly targeted outdoor trip creatives that send people to bookable Scotland adventures.",
  openGraph: {
    siteName: "Get Outside",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <AnalyticsBeacon />
      </body>
    </html>
  );
}
