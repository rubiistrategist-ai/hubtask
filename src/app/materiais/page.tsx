"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download } from "lucide-react";

export default function MateriaisPage() {
  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-12 pt-24 md:pt-16 max-w-4xl mx-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
          <BookOpen className="w-3 h-3" /> Downloads
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Materiais de Apoio</h1>
        <p className="text-muted-foreground mt-3 text-lg">Guias, checklists e atualizações importantes.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {["Guia de Gravação.pdf", "Checklist de Qualidade.pdf"].map((file, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 card-premium flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{file}</h3>
                <p className="text-sm text-muted-foreground">Clique para baixar</p>
              </div>
              <Button size="icon" variant="outline">
                <Download className="w-4 h-4" />
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}