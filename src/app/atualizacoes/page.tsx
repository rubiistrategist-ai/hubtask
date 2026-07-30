"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase-client";
import { Card } from "@/components/ui/card";
import { Megaphone, CalendarClock, BellOff } from "lucide-react";
import { motion } from "framer-motion";

export default function AtualizacoesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('updates').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setUpdates(data); });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-12 pt-24 md:pt-16 max-w-4xl mx-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4"><Megaphone className="w-3 h-3" /> Novidades</div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Atualizações da Plataforma</h1>
      </motion.div>
      
      <div className="space-y-4">
        {updates.length === 0 ? (
          <Card className="p-12 bg-card/50 backdrop-blur-xl border-border/50 flex flex-col items-center justify-center text-center">
            <BellOff className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">Tudo em dia!</h3>
            <p className="text-sm text-muted-foreground/70 mt-2">Não há novas atualizações no momento. Volte em breve.</p>
          </Card>
        ) : (
          updates.map((up) => (
            <Card key={up.id} className="p-6 bg-card/50 backdrop-blur-xl border-border/50 border-l-4 border-l-primary">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-primary font-medium">{new Date(up.created_at).toLocaleDateString('pt-BR')}</span>
                {up.end_date && (
                  <span className="text-xs text-orange-500 font-medium flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-md">
                    <CalendarClock className="w-3 h-3" /> Válido até {new Date(up.end_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold mt-1 mb-2">{up.title}</h3>
              <p className="text-muted-foreground text-sm">{up.content}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}