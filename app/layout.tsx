import type { Metadata } from "next";
import "./globals.css";
import { ClientProvider } from "./client-provider";
import { cn } from "@/_lib/utils";
import { Montserrat } from "next/font/google";
import { SidebarInset, SidebarProvider } from "@/_components/ui/sidebar";
import { AppSidebar } from "@/_components/ui/app-sidebar";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
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
    <html lang="pt-BR" className={cn("antialiased select-none", montserrat.variable)}>
      <body>
        <ClientProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <main>{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
