"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Erro ao entrar. Verifique seu e-mail e senha.");
      setLoading(false);
    } else {
      toast.success("Bem-vindo de volta!");
      // Aguarda 500ms para garantir que o cookie de sessão foi gravado no navegador
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Efeito de Luz */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
          {/* Logo e Título */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-4 shadow-lg shadow-primary/20">H</div>
            <h1 className="text-2xl font-bold tracking-tight">Entrar na HubTask</h1>
            <p className="text-muted-foreground text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="voce@email.com" 
                  className="pl-9 bg-background/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-9 bg-background/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

                        <div className="text-right">
              <Link href="/recuperar-senha" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-6" disabled={loading}>
              {loading ? "Entrando..." : (
                <>
                  <LogIn className="w-4 h-4 mr-2" /> Entrar
                </>
              )}
            </Button>
          </form>

          {/* Link para Cadastro */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta? 
            <Link href="/signup" className="ml-1 text-primary hover:underline font-medium">
              Criar Agora
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}