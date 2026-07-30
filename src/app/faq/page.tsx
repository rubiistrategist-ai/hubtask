"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase-client";
import { Card } from "@/components/ui/card";
import { HelpCircle, MessageCircleQuestion } from "lucide-react";
import { motion } from "framer-motion";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('faq').select('*').then(({ data }) => { if (data) setFaqs(data); });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-12 pt-24 md:pt-16 max-w-4xl mx-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4"><HelpCircle className="w-3 h-3" /> Suporte</div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Perguntas Frequentes</h1>
      </motion.div>
      
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <Card className="p-12 bg-card/50 backdrop-blur-xl border-border/50 flex flex-col items-center justify-center text-center">
            <MessageCircleQuestion className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">Nenhuma pergunta cadastrada</h3>
            <p className="text-sm text-muted-foreground/70 mt-2">Se você tiver dúvidas, procure a aba Comunidade para falar com o suporte.</p>
          </Card>
        ) : (
          faqs.map((faq, i) => (
            <motion.div key={faq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}