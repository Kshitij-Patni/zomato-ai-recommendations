import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Zomato AI — Smart Restaurant Recommendations",
  description:
    "Discover the perfect restaurant with AI-powered recommendations. Tell us your preferences and get personalized suggestions powered by Groq.",
  openGraph: {
    title: "Zomato AI — Smart Restaurant Recommendations",
    description:
      "AI-powered restaurant recommendations tailored to your taste.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable} h-full antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
          precedence="default"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#F8F8F8] text-[#1C1C1C]">
        {children}
      </body>
    </html>
  );
}
