"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase-client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Lock, CheckCircle2, PlayCircle, Clock } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  order_index: number;
  thumbnail_url: string | null;
  section: string | null;
}

export default function CourseOverview() {
  const { completedLessons, isLessonUnlocked } = useProgressStore();
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      const { data } = await supabase.from('modules').select('*').order('order_index', { ascending: true });
      if (data) setModules(data);
    };
    fetchModules();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-12 pt-24 md:pt-16 max-w-7xl mx-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">Mini Curso</h1>
        <p className="text-muted-foreground mt-3 text-lg">Complete as aulas em sequência para desbloquear o próximo módulo.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => {
          const isCompleted = completedLessons.includes(module.id);
          const isUnlocked = isLessonUnlocked(module.id, index);
          const previousModule = modules[index - 1];

          return (
            <motion.div 
              key={module.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="snap-start shrink-0 w-full"
            >
              <Link href={isUnlocked ? `/curso/${module.id}` : "#"} className="block h-full">
                <Card 
                  className={cn(
                    "card-premium p-6 bg-card/50 backdrop-blur-xl border-border/50 h-full flex flex-col justify-between relative overflow-hidden group",
                    !isUnlocked && "cursor-not-allowed"
                  )} 
                  onClick={(e) => !isUnlocked && e.preventDefault()}
                >
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
                  
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center">
                      <Lock className="w-8 h-8 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">Termine o módulo:<br/><span className="text-foreground">{previousModule?.title}</span></p>
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Módulo {index}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : isUnlocked ? (
                        <PlayCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2">{module.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
                  </div>

                  <div className="relative z-10 mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {module.duration}
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
