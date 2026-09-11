import type { Metadata } from "next";
import "./globals.css";
import { ClientProvider } from "./client-provider";
import { ThemeProvider } from "./theme-provider";
import { cn } from "@/_lib/utils";
import { Saira } from "next/font/google";
import { SidebarInset, SidebarProvider } from "@/_components/ui/sidebar";
import { AppSidebar } from "@/_components/ui/app-sidebar";
import { OperatorGate } from "@/_components/ui/operator-gate";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
});

export const metadata: Metadata = {
  title: "BrewDesk",
  description: "PDV offline para sua cafeteria",
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
          <ClientProvider>
            <OperatorGate>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <main>{children}</main>
                </SidebarInset>
              </SidebarProvider>
            </OperatorGate>
          </ClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
