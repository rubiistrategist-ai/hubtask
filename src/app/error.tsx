"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <Card className="p-10 bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Ocorreu um erro inesperado ao carregar esta página. Verifique sua conexão com a internet e tente novamente.
        </p>
        <Button onClick={() => reset()} className="w-full bg-primary hover:bg-primary/90">
          <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
        </Button>
      </Card>
    </div>
  );
}