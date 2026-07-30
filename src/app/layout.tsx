import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

// SEO Otimizado
export const metadata: Metadata = {
  title: "HubTask Academy | Aprenda, Execute e Lucre",
  description: "A plataforma premium para você dominar a criação de conteúdo com IA, executar tarefas e gerar renda.",
  manifest: "/manifest.webmanifest",
  keywords: ["HubTask", "Minute", "Renda Extra", "IA", "Treinamento"],
  openGraph: {
    title: "HubTask Academy",
    description: "A plataforma premium para você dominar a criação de conteúdo com IA.",
    type: "website",
    locale: "pt_BR",
  },
};

// Configuração de Viewport para Mobile First e Safe Areas (iPhone)
export const viewport: Viewport = {
  themeColor: "#00C853",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", 
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Registra o Service Worker para PWA (Instalação no celular) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 md:ml-64 w-full">
                {children}
              </main>
            </div>
            {/* Toasts Responsivos: Top no Mobile, Bottom-Right no Desktop */}
            <Toaster position="top-center" richColors className="md:hidden" />
            <Toaster position="bottom-right" richColors className="hidden md:block" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}