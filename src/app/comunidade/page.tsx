"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CommunityPage() {
  const [link, setLink] = useState("");
  useEffect(() => {
    supabase.from('settings').select('community_link').single().then(({ data }) => { if (data) setLink(data.community_link); });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-12 pt-24 md:pt-16 max-w-4xl mx-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Entre na Comunidade</h1>
      </motion.div>
      <Card className="p-10 bg-card/50 backdrop-blur-xl border-border/50 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"><MessageSquare className="w-8 h-8 text-primary" /></div>
        <h2 className="text-2xl font-bold mb-2">Grupo Exclusivo no WhatsApp</h2>
        <p className="text-muted-foreground max-w-md mb-8">Clique no botão abaixo para ser redirecionado ao nosso grupo oficial.</p>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-primary hover:bg-primary/90 group"><ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /> Entrar na Comunidade</Button>
          </a>
        )}
      </Card>
    </div>
  );
}