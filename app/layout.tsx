import type { Metadata } from "next";
import "./globals.css";
import { ClientProvider } from "./client-provider";
import { cn } from "@/_lib/utils";
import { Montserrat } from "next/font/google";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/_components/ui/sidebar";
import { AppSidebar } from "@/_components/ui/app-sidebar";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Mañana Cafés y Coisinhas",
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
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <ClientProvider>
              <main>{children}</main>
            </ClientProvider>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
