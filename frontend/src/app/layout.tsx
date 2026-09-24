import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SecureOnboard — Zero-Trust Identity Lifecycle Automation",
  description:
    "Automatically revoke SaaS access the moment an employee leaves. Google, Slack, GitHub — all revoked in under 60 seconds.",
  keywords: ["cybersecurity", "identity management", "offboarding", "SaaS security", "zero trust"],
  openGraph: {
    title: "SecureOnboard",
    description: "Zero-Trust Identity Lifecycle Automation for SMBs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gradient-animated min-h-screen text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
