"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProgressStore } from "@/store/useProgressStore";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import RPlayer from "react-player";
const ReactPlayer = RPlayer as any;
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase-client";
import { Lock, CheckCircle2, Circle, Award, ChevronRight, Home, RotateCcw, Download, Link as LinkIcon, ExternalLink, ArrowRight } from "lucide-react";

export default function ModulePage() {
  const Trigger = AlertDialogTrigger as any;
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;
  
  const [moduleData, setModuleData] = useState<any>(null);
  const [allModules, setAllModules] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const nextLessonBtnRef = useRef<HTMLButtonElement>(null);

  const { completedLessons, toggleLesson, isLessonUnlocked, lessonChecklist, toggleLessonChecklist, addStudiedTime, setModuleOrder } = useProgressStore();
  
  const isCompleted = completedLessons.includes(moduleId);
  const isUnlocked = isLessonUnlocked(moduleId, currentIndex);

  useEffect(() => {
    const fetchModule = async () => {
      const { data: mods } = await supabase.from('modules').select('*').order('order_index', { ascending: true });
      if (mods) {
        setAllModules(mods);
        setModuleOrder(mods.map((m: any) => m.id));
        
        const idx = mods.findIndex(m => m.id === moduleId);
        setCurrentIndex(idx);
        setModuleData(mods[idx]);
        setIsPlayerReady(false);
        setIsVideoEnded(false);
      }
    };
    fetchModule();
  }, [moduleId, setModuleOrder]);

  useEffect(() => {
    if (isVideoEnded && nextLessonBtnRef.current) {
      nextLessonBtnRef.current.focus();
    }
  }, [isVideoEnded]);

  if (!moduleData) {
    return (
      <div className="p-6 md:p-10 max-w-6xl mx-auto pt-24 md:pt-10 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-6"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-muted rounded-xl"></div>
            <div className="h-8 w-3/4 bg-muted rounded"></div>
            <div className="h-10 w-48 bg-muted rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-muted rounded-xl"></div>
            <div className="h-24 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center pt-20">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Módulo Bloqueado</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Você precisa concluir o módulo anterior para desbloquear esta etapa.
        </p>
        <Link href={`/curso/${allModules[currentIndex - 1]?.id || ''}`}>
          <Button variant="outline">Voltar para o módulo anterior</Button>
        </Link>
      </div>
    );
  }

  const handleComplete = (auto = false) => {
    if (!isCompleted) {
      toggleLesson(moduleId);
      addStudiedTime(moduleData.duration_in_min || 0);
      const nextModule = allModules[currentIndex + 1];
      
      if (nextModule) {
        toast.success("Aula concluída! Avançando para a próxima...", {
          action: {
            label: "Ficar aqui",
            onClick: () => clearTimeout(timer),
          }
        });
        const timer = setTimeout(() => router.push(`/curso/${nextModule.id}`), 2500);
      } else {
        toast.success("Você concluiu a última aula! 🎉");
      }
    }
  };

  const handleUnmark = () => {
    toggleLesson(moduleId);
    toast.warning("Aula desmarcada. Os módulos seguintes foram bloqueados.");
  };

  const handleVideoProgress = (state: any) => {
    if (state.played >= 0.8) {
      const key = `${moduleData.id}-Assistiu o vídeo`;
      if (!lessonChecklist[key]) {
        toggleLessonChecklist(key);
      }
    }
    
    if (state.played >= 0.95 && !isCompleted) {
      handleComplete(true);
    }
  };

  const isLastModule = currentIndex === allModules.length - 1;
  const courseCompleted = isLastModule && isCompleted;

  if (courseCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center pt-20">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
          <Card className="p-12 border-2 border-primary/30 shadow-2xl bg-card/50 backdrop-blur-xl max-w-lg">
            <Award className="w-20 h-20 mx-auto text-primary mb-6" />
            <h1 className="text-4xl font-bold mb-3">🎉 Parabéns!</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Você concluiu o treinamento inicial. Agora você está pronto para iniciar suas atividades.
            </p>
            <a href="/comunidade">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                Ir para Comunidade
              </Button>
            </a>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pt-20 md:pt-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary flex items-center gap-1">
          <Home className="w-3 h-3" /> Início
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/" className="hover:text-primary">Mini Curso</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">{moduleData.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-video bg-black rounded-xl overflow-hidden group shadow-2xl"
          >
            {!isPlayerReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-pulse z-20">
                <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-primary animate-spin"></div>
              </div>
            )}

            {isVideoEnded && (
              <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Aula Concluída!</h3>
                <p className="text-muted-foreground mb-6">Você terminou esta etapa. Continue avançando.</p>
                {allModules[currentIndex + 1] ? (
                  <Button ref={nextLessonBtnRef} size="lg" onClick={() => router.push(`/curso/${allModules[currentIndex + 1].id}`)} className="bg-primary hover:bg-primary/90 group">
                    Próxima Aula: {allModules[currentIndex + 1].title}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <Button ref={nextLessonBtnRef} size="lg" onClick={() => router.push('/')} className="bg-primary hover:bg-primary/90">
                    Voltar para o Início
                  </Button>
                )}
              </div>
            )}
            {moduleData.video_url ? (
              <ReactPlayer 
                url={moduleData.video_url} 
                width="100%" 
                height="100%" 
                controls={true}
                onReady={() => setIsPlayerReady(true)}
                onProgress={handleVideoProgress}
                onEnded={() => setIsVideoEnded(true)}
                onPlay={() => setIsVideoEnded(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 text-sm p-4 text-center">
                Vídeo não configurado. Adicione o link no painel Admin.
              </div>
            )}
          </motion.div>

          <div className="mt-6 flex justify-between items-center flex-wrap gap-4">
            <div>
              <span className="text-sm text-primary font-medium">Módulo {currentIndex}</span>
              <h1 className="text-2xl md:text-3xl font-bold mt-1 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80">
                {moduleData.title}
              </h1>
              <p className="text-muted-foreground mt-1">{moduleData.description}</p>
            </div>
            
            {isCompleted ? (
                            <AlertDialog>
                <Trigger asChild>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="mt-4 md:mt-0 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Desmarcar Aula
                  </Button>
                               </Trigger>
                <AlertDialogContent className="bg-card/90 backdrop-blur-xl border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desmarcar esta aula?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se você desmarcar, os módulos seguintes serão bloqueados novamente e você precisará concluir esta etapa para avançar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-border/50">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnmark} className="bg-red-500 hover:bg-red-600 text-white border-0">
                      Sim, desmarcar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                size="lg" 
                onClick={() => handleComplete(false)}
                className="mt-4 md:mt-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Marcar como concluída
              </Button>
            )}
          </div>

          {moduleData.lesson_content && (
            <Card className="mt-8 p-6 bg-card/30 backdrop-blur-xl border-border/50">
              <h3 className="text-xl font-bold tracking-tight mb-3">Sobre esta aula</h3>
              <p className="text-muted-foreground leading-relaxed">{moduleData.lesson_content}</p>
              
              {moduleData.links && moduleData.links.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/50 flex flex-col gap-3">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-primary" /> Links Importantes
                  </h4>
                  {moduleData.links.map((link: any, i: number) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-4 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all"
                    >
                      <span className="text-sm font-medium text-primary">
                        {link.label}
                      </span>
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </a>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50">
            <h3 className="font-semibold mb-4">Checklist da Aula</h3>
            <div className="space-y-3 text-sm">
              {moduleData.checklist && Array.isArray(moduleData.checklist) && moduleData.checklist.map((item: string, i: number) => {
                const key = `${moduleData.id}-${item}`;
                const isChecked = lessonChecklist[key] || false;
                
                return (
                  <button 
                    key={i} 
                    onClick={() => toggleLessonChecklist(key)}
                    className="flex items-center gap-2 w-full text-left group transition-all"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                    )}
                    <span className={`transition-colors ${isChecked ? "text-muted-foreground line-through" : "text-foreground/90"}`}>
                      {item}
                    </span>
                  </button>
                );
              })}
              {(!moduleData.checklist || moduleData.checklist.length === 0) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Circle className="w-4 h-4" /> Assistiu o vídeo
                </div>
              )}
            </div>
          </Card>

          {moduleData.materials && moduleData.materials.length > 0 && (
            <Card className="p-6 bg-secondary/30 border-border/50">
              <h3 className="font-semibold mb-2">Materiais de Apoio</h3>
              <p className="text-sm text-muted-foreground mb-4">Baixe os arquivos desta aula.</p>
              <div className="space-y-2">
                {moduleData.materials.map((mat: any, i: number) => (
                  <a href={mat.url} key={i} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Download className="w-4 h-4" /> {mat.name}
                    </Button>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
