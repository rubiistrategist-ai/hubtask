"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Clock, Flame, Sparkles, ArrowRight, CalendarDays, Hourglass, ChevronLeft, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { supabase } from "@/utils/supabase-client";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  order_index: number;
  thumbnail_url: string | null;
  section: string | null;
}

export default function DashboardHome() {
  const { 
    completedLessons, 
    streak, 
    studiedMinutes, 
    checkDailyAccess, 
    loadFromSupabase, 
    isLoaded,
    setModuleOrder
  } = useProgressStore();
  
  const [modules, setModules] = useState<Module[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState("");
  const [shakingId, setShakingId] = useState<string | null>(null);
  const carouselRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalLessons = 9;
  const progress = Math.round((completedLessons.length / (modules.length || totalLessons)) * 100);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        await loadFromSupabase();
        checkDailyAccess();

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();
          
        if (profile) {
          setUserName(profile.full_name || "Aluno");
          setUserAvatarUrl(profile.avatar_url || "");
        }
      }
    }
    checkUser();

    const fetchModules = async () => {
      const { data } = await supabase.from('modules').select('*').order('order_index', { ascending: true });
      if (data) {
        setModules(data);
        setModuleOrder(data.map((m: any) => m.id));
      }
    };
    fetchModules();

    // REALTIME: Atualiza a lista de módulos automaticamente se o admin mudar algo
    const channel = supabase
      .channel('modules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        fetchModules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFromSupabase, checkDailyAccess, setModuleOrder]);

  // LÓGICA DO BOTÃO INTELIGENTE
  const nextModule = modules.find(m => !completedLessons.includes(m.id));
  const nextModuleId = nextModule?.id || modules[0]?.id || 'm0';

  const scrollCarousel = (index: number, direction: 'left' | 'right') => {
    const track = carouselRefs.current[index];
    if (track) {
      const amount = direction === 'left' ? -320 : 320;
      track.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // LÓGICA DE ANIMAÇÃO DE BLOQUEIO
  const handleLockedClick = (e: React.MouseEvent, moduleId: string) => {
    e.preventDefault();
    setShakingId(moduleId);
    toast.error("Termine o módulo anterior para desbloquear este.", { duration: 2000 });
    setTimeout(() => setShakingId(null), 500);
  };

  // Otimização de Scroll: Converte scroll vertical do mouse em horizontal
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // SKELETON LOADING PREMIUM
  if (!isLoaded) {
    return (
      <div className="relative min-h-screen p-6 md:p-12 pt-24 md:pt-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-card/40 border border-border/50 mb-10 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-muted"></div>
            <div className="space-y-2">
              <div className="h-6 w-40 bg-muted rounded"></div>
              <div className="h-4 w-32 bg-muted rounded"></div>
            </div>
          </div>
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between"><div className="h-4 w-24 bg-muted rounded"></div><div className="h-4 w-8 bg-muted rounded"></div></div>
            <div className="w-full bg-muted rounded-full h-3"></div>
          </div>
        </div>

        <div className="mb-12 space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded"></div>
          <div className="h-10 w-3/4 bg-muted rounded"></div>
          <div className="h-5 w-1/2 bg-muted rounded"></div>
          <div className="h-10 w-48 bg-muted rounded mt-4"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4 bg-card/40 border border-border/50 rounded-xl">
              <div className="w-11 h-11 bg-muted rounded-xl"></div>
              <div className="space-y-2"><div className="h-3 w-16 bg-muted rounded"></div><div className="h-6 w-12 bg-muted rounded"></div></div>
            </div>
          ))}
        </div>

        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="flex gap-8">
            {[...Array(3)].map((_, i) => <div key={i} className="w-[260px] aspect-[9/16] bg-muted rounded-2xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const sections = modules.reduce((acc, module) => {
    const sec = module.section || "Curso Principal";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="fixed top-0 left-0 right-0 h-screen w-full z-0">
        <Image
          src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop"
          alt="Background"
          fill
          priority
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 p-6 md:p-12 pt-24 md:pt-16 max-w-7xl mx-auto w-full flex-1 flex flex-col">
        
        {/* BANNER DE PERFIL RESPONSIVO */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-xl mb-10 shadow-2xl"
        >
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg shadow-primary/10 shrink-0">
              {userAvatarUrl ? (
                <Image
                  src={`${userAvatarUrl}?t=${Date.now()}`}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-3xl font-bold text-muted-foreground">
                  {userName?.charAt(0).toUpperCase() || "H"}
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card z-10"></div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate">{userName || "Aluno HubTask"}</h2>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Progresso do Curso</span>
              <span className="text-base md:text-lg font-bold text-primary">{progress}%</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-primary to-green-400 h-3 rounded-full shadow-lg shadow-primary/20"
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            Onboarding HubTask
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 max-w-3xl">
            Pronto para continuar de onde parou?
          </h1>
          <p className="text-muted-foreground mt-4 text-base md:text-lg max-w-2xl">
            Você está a poucos passos de concluir sua primeira tarefa e começar a gerar renda com IA.
          </p>
          
          <Link href={`/curso/${nextModuleId}`} className="inline-block mt-6">
            <Button size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" /> 
              {progress > 0 ? "Continuar de onde parei" : "Iniciar Agora"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-16 backdrop-blur-md">
          <Card className="p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-card/40 border-border/50">
            <div className="p-2 md:p-3 rounded-xl bg-primary/10 border border-primary/20"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Módulos</p><p className="text-xl md:text-2xl font-bold mt-1">{completedLessons.length}/{modules.length || totalLessons}</p></div>
          </Card>
          <Card className="p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-card/40 border-border/50">
            <div className={`p-2 md:p-3 rounded-xl border ${streak > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-muted/50 border-border'}`}><Flame className={`w-4 h-4 md:w-5 md:h-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} /></div>
            <div><p className="text-xs text-muted-foreground">Sequência</p><p className="text-xl md:text-2xl font-bold mt-1">{streak}d</p></div>
          </Card>
          <Card className="p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-card/40 border-border/50">
            <div className="p-2 md:p-3 rounded-xl bg-primary/10 border border-primary/20"><CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Tempo</p><p className="text-xl md:text-2xl font-bold mt-1">{studiedMinutes}m</p></div>
          </Card>
          <Card className="p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-card/40 border-border/50">
            <div className="p-2 md:p-3 rounded-xl bg-primary/10 border border-primary/20"><Hourglass className="w-4 h-4 md:w-5 md:h-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Status</p><p className="text-xl md:text-2xl font-bold mt-1 text-green-500">Ativo</p></div>
          </Card>
        </div>

        <div className="space-y-12 mb-8 flex-1">
          {Object.entries(sections).map(([sectionName, mods], sectionIndex) => (
            <div key={sectionName}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary">{sectionName}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => scrollCarousel(sectionIndex, 'left')} className="rounded-full bg-background/50 backdrop-blur-sm"><ChevronLeft className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" onClick={() => scrollCarousel(sectionIndex, 'right')} className="rounded-full bg-background/50 backdrop-blur-sm"><ChevronRight className="w-5 h-5" /></Button>
                </div>
              </div>

              <div 
                ref={el => carouselRefs.current[sectionIndex] = el} 
                onWheel={handleWheel} 
                className="flex gap-6 md:gap-8 overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory scroll-smooth"
              >
                {mods.map((module) => {
                  const globalIndex = modules.findIndex(m => m.id === module.id);
                  const isCompleted = completedLessons.includes(module.id);
                  const isUnlocked = globalIndex === 0 || completedLessons.includes(modules[globalIndex - 1]?.id);
                  const previousModule = modules[globalIndex - 1];

                  return (
                    <motion.div 
                      key={module.id} 
                      animate={shakingId === module.id ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      className="snap-start shrink-0 w-[200px] md:w-[260px] aspect-[9/16]"
                    >
                      <Link href={isUnlocked ? `/curso/${module.id}` : "#"} className="block h-full">
                        <Card 
                          className={cn(
                            "relative w-full h-full rounded-2xl overflow-hidden border-border/50 group transition-all",
                            !isUnlocked && "cursor-pointer"
                          )} 
                          onClick={(e) => !isUnlocked && handleLockedClick(e, module.id)}
                        >
                          <div className="absolute inset-0 bg-zinc-900">
                            {module.thumbnail_url ? (
                              <Image
                                src={module.thumbnail_url}
                                alt={module.title}
                                fill
                                sizes="(max-width: 768px) 200px, 260px"
                                className="object-cover transition-transform group-hover:scale-110 duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-zinc-900"></div>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center">
                              <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                              <p className="text-sm font-medium text-muted-foreground">Termine o módulo:<br/><span className="text-foreground font-bold">{previousModule?.title}</span></p>
                            </div>
                          )}

                          <div className="absolute top-4 right-4 z-10">
                            {isCompleted ? (
                              <div className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg"><CheckCircle2 className="w-4 h-4" /></div>
                            ) : isUnlocked ? (
                              <div className="bg-background/80 backdrop-blur p-1.5 rounded-full shadow-lg"><Play className="w-4 h-4 text-primary" /></div>
                            ) : null}
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-5 z-10 text-white">
                            <span className="text-xs font-medium text-primary bg-black/60 backdrop-blur px-2 py-0.5 rounded-md mb-2 inline-block">Aula {globalIndex}</span>
                            <h3 className="text-lg md:text-xl font-bold tracking-tight mb-1 line-clamp-2">{module.title}</h3>
                            <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 mb-3">{module.description}</p>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
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
          ))}
        </div>
      </div>
    </div>
  );
}