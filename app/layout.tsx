import type { Metadata } from "next";
import "./globals.css";
import { ClientProvider } from "./client-provider";
import { ThemeProvider } from "./theme-provider";
import { cn } from "@/_lib/utils";
import { Saira } from "next/font/google";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
});

export const metadata: Metadata = {
  title: "Tably",
  description: "Sistema PDV para o seu negócio",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("antialiased select-none", saira.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClientProvider>{children}</ClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
