import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Legal Assistant UK – Chat",
  description: "Chat with an AI-powered legal assistant for fast, confidential support with UK legal questions and document preparation.",
  keywords: "UK legal advice, AI legal assistant, UK courts, legal chat, AI lawyer UK",
  authors: [{ name: "AI Legal Assistant UK" }],
  creator: "AI Legal Assistant UK",
  publisher: "AI Legal Assistant UK",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://uk-ai-lawsuit-generator-70ec5lob1-kosh1s-projects.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "AI Legal Assistant UK – Chat",
    description: "Chat with an AI-powered legal assistant for fast, confidential support with UK legal questions and document preparation.",
    url: '/',
    siteName: 'AI Legal Assistant UK',
    type: "website",
    locale: "en_GB",
    countryName: "United Kingdom",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Legal Assistant UK – Chat",
    description: "Chat with an AI-powered legal assistant for fast, confidential support with UK legal questions and document preparation.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
