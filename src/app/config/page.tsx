"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabase-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProgressStore } from "@/store/useProgressStore";
import { User, Lock, Award, Upload, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ConfigPage() {
  const { completedLessons } = useProgressStore();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const courseCompleted = completedLessons.length === 9; // Ajuste se tiver mais módulos

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
        }
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').upsert({ 
        user_id: user.id, 
        full_name: fullName 
      }, { onConflict: 'user_id' });
      
      if (error) toast.error("Erro ao salvar: " + error.message);
      else toast.success("Perfil atualizado com sucesso!");
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileName = `${user.id}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
    
    if (uploadError) { toast.error("Erro ao subir imagem: " + uploadError.message); return; }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase.from('profiles').upsert({ 
      user_id: user.id, 
      avatar_url: publicUrl 
    }, { onConflict: 'user_id' });
    
    if (updateError) toast.error("Erro ao salvar link da imagem.");
    else { setAvatarUrl(`${publicUrl}?t=${Date.now()}`); toast.success("Avatar atualizado!"); }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("A senha precisa ter no mínimo 6 caracteres."); return; }
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error("Erro ao trocar senha: " + error.message);
    else { toast.success("Senha alterada com sucesso!"); setNewPassword(""); }
  };

  // LÓGICA DE GERAR PDF
  const handleDownloadCertificate = async () => {
    if (!certificateRef.current) return;
    setIsGenerating(true);
    toast.info("Gerando seu certificado, aguarde um instante...");

    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificado-HubTask-${fullName.replace(/\s/g, '-')}.pdf`);
      toast.success("Certificado baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar certificado.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-12 pt-24 md:pt-16 max-w-4xl mx-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Configurações</h1>
      </motion.div>

      <div className="space-y-8">
        {/* Perfil */}
        <Card className="p-8 bg-card/50 backdrop-blur-xl border-border/50">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><User className="w-5 h-5 text-primary" /> Perfil</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32 border-4 border-border/50 shadow-xl relative">
                {avatarUrl ? (
                  <img src={`${avatarUrl}?t=${Date.now()}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="text-4xl bg-muted">{fullName.substring(0, 2).toUpperCase() || "HT"}</AvatarFallback>
                )}
              </Avatar>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Trocar Avatar
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUploadAvatar} />
            </div>
            <div className="flex-1 w-full space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" />
                <p className="text-xs text-muted-foreground mt-1">* Use seu nome real, pois ele aparecerá no certificado.</p>
              </div>
              <Button onClick={handleSaveProfile} className="bg-primary">Salvar Alterações</Button>
            </div>
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-8 bg-card/50 backdrop-blur-xl border-border/50">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><Lock className="w-5 h-5 text-primary" /> Segurança</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button onClick={handleChangePassword} variant="outline">Alterar Senha</Button>
          </div>
        </Card>

        {/* Certificado */}
        <Card className={`p-8 backdrop-blur-xl border-2 ${courseCompleted ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-card/50'}`}>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><Award className="w-5 h-5 text-primary" /> Certificado de Conclusão</h3>
          {courseCompleted ? (
            <div className="text-center py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>
              <h4 className="text-2xl font-bold mb-2">🎉 Parabéns, {fullName || "Aluno"}!</h4>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Você concluiu todas as aulas da HubTask Academy. Seu certificado está pronto para download!</p>
              <Button size="lg" className="bg-primary" onClick={handleDownloadCertificate} disabled={isGenerating}>
                {isGenerating ? "Gerando..." : <><Download className="w-4 h-4 mr-2" /> Baixar Certificado (PDF)</>}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2">Certificado Bloqueado</h4>
              <p className="text-muted-foreground">Termine o curso para liberar o certificado. Progresso atual: {completedLessons.length} / 9 aulas.</p>
            </div>
          )}
        </Card>
      </div>

      {/* MODELO DO CERTIFICADO (ESCONDIDO) - Usado apenas para gerar o PDF */}
      {courseCompleted && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={certificateRef} style={{ width: '1123px', height: '794px', backgroundColor: '#ffffff', position: 'relative', fontFamily: 'Arial, sans-serif' }}>
            {/* Borda do Certificado */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: '4px solid #0A192F', borderRadius: '8px' }}></div>
            <div style={{ position: 'absolute', top: '30px', left: '30px', right: '30px', bottom: '30px', border: '2px solid #00C853', borderRadius: '6px' }}></div>
            
            {/* Conteúdo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#0A192F' }}>
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#00C853', marginBottom: '10px' }}>HubTask Academy</div>
              <div style={{ fontSize: '24px', textTransform: 'uppercase', letterSpacing: '4px', color: '#555' }}>Certificado de Conclusão</div>
              <div style={{ fontSize: '18px', color: '#555', marginTop: '40px' }}>Este certificado é orgulhosamente apresentado para</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '20px 0 40px 0', borderBottom: '2px solid #00C853', paddingBottom: '10px', minWidth: '600px' }}>
                {fullName || "Aluno HubTask"}
              </div>
              <div style={{ fontSize: '18px', color: '#333', maxWidth: '700px', lineHeight: '1.6' }}>
                Por concluir com êxito o treinamento de onboarding e tarefas da HubTask Academy, estando apto a executar atividades de coleta de dados para treinamento de Inteligência Artificial.
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-around', width: '80%', marginTop: '80px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #333', width: '200px', marginBottom: '10px' }}></div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Rubian</div>
                  <div style={{ fontSize: '14px', color: '#555' }}>Embaixador HubTask BR</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #333', width: '200px', marginBottom: '10px' }}></div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{new Date().toLocaleDateString('pt-BR')}</div>
                  <div style={{ fontSize: '14px', color: '#555' }}>Data de Conclusão</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
