"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, GraduationCap, BookOpen, HelpCircle, MessageSquare, Megaphone, Settings, Menu, LogOut, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase-client";

const ADMIN_EMAIL = "rubiistrategist@gmail.com"; // Altere para o seu e-mail

const navItems = [
  { icon: Home, label: "Início", href: "/" },
  { icon: BookOpen, label: "Materiais", href: "/materiais" },
  { icon: HelpCircle, label: "FAQ", href: "/faq" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Megaphone, label: "Atualizações", href: "/atualizacoes" },
  { icon: Settings, label: "Configurações", href: "/config" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-4 h-full">
      <div className="mb-8 px-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">H</div>
        <div>
          <h1 className="text-lg font-bold leading-none tracking-tight">HubTask</h1>
          <span className="text-xs text-muted-foreground">Academy</span>
        </div>
      </div>
      
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            {isActive && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
            )}
            <item.icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}

      {isAdmin && (
        <Link href="/admin" onClick={() => setOpen(false)} className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
          <Trophy className="h-4 w-4" />
          <span className="relative z-10">Painel Admin</span>
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <aside className="hidden md:flex h-screen w-64 flex-col fixed top-0 left-0 z-40 border-r border-border bg-background/50 backdrop-blur-xl">
        <div className="flex-grow overflow-y-auto">
          <NavContent />
        </div>
        <div className="p-4 border-t border-border space-y-2">
          <ThemeToggle />
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
            <LogOut className="h-4 w-4" /> Sair da Conta
          </Button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] border-b border-border bg-background/80 backdrop-blur-xl safe-area-top">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 outline-none">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold tracking-tight">HubTask Academy</span>
      </div>
    </>
  );
}