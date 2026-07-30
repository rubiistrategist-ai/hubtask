"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase-client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Lock, CheckCircle2, PlayCircle, Clock } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  order_index: number;
  thumbnail_url: string | null;
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

      {/* Netflix Style Row */}
      <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory">
        {modules.map((module, index) => {
          const isCompleted = completedLessons.includes(module.id);
          const isUnlocked = isLessonUnlocked(module.id, index);
          const previousModule = modules[index - 1];

          return (
            <motion.div 
              key={module.id} 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="snap-start shrink-0 w-[280px] md:w-[340px]"
            >
              <Link href={isUnlocked ? `/curso/${module.id}` : "#"} className="block h-full">
                <Card 
                  className={cn(
                    "relative aspect-video rounded-xl overflow-hidden border-border/50 group transition-all",
                    !isUnlocked && "cursor-not-allowed"
                  )} 
                  onClick={(e) => !isUnlocked && e.preventDefault()}
                >
                  {/* Thumbnail Background */}
                  <div className="absolute inset-0 bg-zinc-900">
                    {module.thumbnail_url ? (
                      <img src={module.thumbnail_url} alt={module.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-zinc-900"></div>
                    )}
                  </div>

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                  {/* Locked Overlay */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center">
                      <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">Termine o módulo:<br/><span className="text-foreground font-bold">{previousModule?.title}</span></p>
                    </div>
                  )}

                  {/* Status Icon (Top Right) */}
                  <div className="absolute top-4 right-4 z-10">
                    {isCompleted ? (
                      <div className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg"><CheckCircle2 className="w-4 h-4" /></div>
                    ) : isUnlocked ? (
                      <div className="bg-background/80 backdrop-blur p-1.5 rounded-full shadow-lg"><PlayCircle className="w-4 h-4 text-primary" /></div>
                    ) : null}
                  </div>

                  {/* Info (Bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10 text-white">
                    <span className="text-xs font-medium text-primary bg-black/50 px-2 py-0.5 rounded-md mb-2 inline-block">Módulo {index}</span>
                    <h3 className="text-xl font-bold tracking-tight mb-1 line-clamp-1">{module.title}</h3>
                    <p className="text-sm text-zinc-300 line-clamp-2">{module.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" /> {module.duration}
                    </div>
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