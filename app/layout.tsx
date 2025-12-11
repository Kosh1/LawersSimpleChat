import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "jHelper — ИИ-помощник для юристов",
  description: "Искусственный интеллект для работы с юридическими документами. Анализ материалов, подготовка документов, организация дел. Специально для российских юристов.",
  keywords: "юридический ИИ, помощник юриста, анализ документов, подготовка исков, работа с договорами, искусственный интеллект для юристов",
  authors: [{ name: "jHelper" }],
  creator: "jHelper",
  publisher: "jHelper",
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
    title: "jHelper — ИИ-помощник для юристов",
    description: "Искусственный интеллект для работы с юридическими документами. Анализ материалов, подготовка документов, организация дел. Специально для российских юристов.",
    url: '/',
    siteName: 'jHelper',
    type: "website",
    locale: "ru_RU",
    countryName: "Russia",
  },
  twitter: {
    card: "summary_large_image",
    title: "jHelper — ИИ-помощник для юристов",
    description: "Искусственный интеллект для работы с юридическими документами. Анализ материалов, подготовка документов, организация дел. Специально для российских юристов.",
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
