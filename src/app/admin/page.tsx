"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabase-client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Users, CheckCircle2, Clock, Mail, BookOpen, HelpCircle, Edit3, PlusCircle, Trash2, Link as LinkIcon, Megaphone, Settings2, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminDashboard() {
  const router = useRouter();
  const ADMIN_EMAIL = "rubiistrategist@gmail.com"; // COLOQUE SEU E-MAIL AQUI
  const [activeTab, setActiveTab] = useState('ranking');
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [communityLink, setCommunityLink] = useState("");
  const [editingModule, setEditingModule] = useState<any | null>(null);
  
  const [newFaq, setNewFaq] = useState({ q: "", a: "" });
  const [newUpdate, setNewUpdate] = useState({ t: "", c: "", d: "" });
  const [newMaterial, setNewMaterial] = useState({ name: "", url: "" });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Bloqueio de segurança: Se não for o admin, joga pra Home
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email !== ADMIN_EMAIL) {
        router.push('/');
      }
    };
    checkAdmin();
  }, [router]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: usersData } = await supabase.rpc('get_all_users_progress');
    if (usersData) setUsers(usersData);
    const { data: modsData } = await supabase.from('modules').select('*').order('order_index', { ascending: true });
    if (modsData) setModules(modsData);
    const { data: faqData } = await supabase.from('faq').select('*');
    if (faqData) setFaqs(faqData);
    const { data: upData } = await supabase.from('updates').select('*').order('created_at', { ascending: false });
    if (upData) setUpdates(upData);
    const { data: setData } = await supabase.from('settings').select('community_link').single();
    if (setData) setCommunityLink(setData.community_link);
  };

  // --- Handlers Módulos ---
  const handleSaveModule = async () => {
    if (!editingModule) return;
    setIsSaving(true);
    const { error } = await supabase.from('modules').update({
      title: editingModule.title, 
      description: editingModule.description, 
      video_url: editingModule.video_url,
      lesson_content: editingModule.lesson_content, 
      thumbnail_url: editingModule.thumbnail_url,
      links: editingModule.links, 
      materials: editingModule.materials, 
      section: editingModule.section,
      checklist: editingModule.checklist
    }).eq('id', editingModule.id);
    
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Módulo salvo com sucesso!");
    
    setIsSaving(false);
    setEditingModule(null); 
    fetchAll();
  };

  const handleUploadThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingModule) return;
    setIsUploadingThumb(true);

    const fileName = `thumb-${editingModule.id}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('thumbnails').upload(fileName, file, { upsert: true });
    
    if (error) {
      toast.error("Erro ao subir imagem: " + error.message);
    } else {
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
      setEditingModule({ ...editingModule, thumbnail_url: urlData.publicUrl });
      toast.success("Imagem enviada!");
    }
    setIsUploadingThumb(false);
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    if (index === 0 && direction === 'up') return;
    if (index === modules.length - 1 && direction === 'down') return;
    
    const newModules = [...modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentOrder = newModules[index].order_index;
    const targetOrder = newModules[targetIndex].order_index;
    
    await supabase.from('modules').update({ order_index: targetOrder }).eq('id', newModules[index].id);
    await supabase.from('modules').update({ order_index: currentOrder }).eq('id', newModules[targetIndex].id);
    
    toast.success("Ordem atualizada!");
    fetchAll();
  };

  const handleAddModule = async () => {
    const newId = `mod-${Date.now()}`;
    const { data } = await supabase.from('modules').insert({
      id: newId,
      title: "Novo Módulo",
      description: "Descrição do novo módulo",
      order_index: modules.length,
      section: "Curso Principal",
      duration: "5 min",
      duration_in_min: 5,
      checklist: ["Assistiu o vídeo"],
      materials: [],
      links: []
    }).select().single();
    
    if (data) {
      toast.success("Módulo criado! Edite as informações.");
      fetchAll();
      setEditingModule(data);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este módulo?")) return;
    await supabase.from('modules').delete().eq('id', id);
    toast.success("Módulo deletado.");
    fetchAll();
  };

  // --- Handlers de Itens (Links, Materiais, Checklist) ---
  const addItem = (type: 'links' | 'materials') => {
    if (!editingModule) return;
    if (!newMaterial.name || !newMaterial.url) return;
    const current = editingModule[type] || [];
    setEditingModule({ ...editingModule, [type]: [...current, type === 'materials' ? newMaterial : { label: newMaterial.name, url: newMaterial.url }] });
    setNewMaterial({ name: "", url: "" });
  };

  const removeItem = (type: 'links' | 'materials', index: number) => {
    if (!editingModule || !editingModule[type]) return;
    setEditingModule({ ...editingModule, [type]: editingModule[type].filter((_: any, i: number) => i !== index) });
  };

  const addChecklistItem = () => {
    if (!editingModule || !newChecklistItem) return;
    const current = editingModule.checklist || [];
    setEditingModule({ ...editingModule, checklist: [...current, newChecklistItem] });
    setNewChecklistItem("");
  };

  const removeChecklistItem = (index: number) => {
    if (!editingModule || !editingModule.checklist) return;
    setEditingModule({ ...editingModule, checklist: editingModule.checklist.filter((_: any, i: number) => i !== index) });
  };

  // --- Handlers FAQ e Updates ---
  const addFaq = async () => {
    if (!newFaq.q || !newFaq.a) return;
    await supabase.from('faq').insert({ question: newFaq.q, answer: newFaq.a });
    setNewFaq({ q: "", a: "" }); fetchAll();
  };
  const deleteFaq = async (id: string) => { await supabase.from('faq').delete().eq('id', id); fetchAll(); };

  const addUpdate = async () => {
    if (!newUpdate.t || !newUpdate.c) return;
    await supabase.from('updates').insert({ title: newUpdate.t, content: newUpdate.c, end_date: newUpdate.d || null });
    setNewUpdate({ t: "", c: "", d: "" }); fetchAll();
  };
  const deleteUpdate = async (id: string) => { await supabase.from('updates').delete().eq('id', id); fetchAll(); };

  const saveCommunityLink = async () => {
    await supabase.from('settings').update({ community_link: communityLink }).eq('id', 1);
    toast.success("Link da comunidade salvo!");
  };

  // Agrupar módulos por seção (Tipado para evitar erro no build)
  const sections: Record<string, any[]> = modules.reduce((acc, mod) => {
    const sec = mod.section || "Curso Principal";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(mod);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="relative min-h-screen overflow-hidden p-6 md:p-12 pt-24 md:pt-16 max-w-7xl mx-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Painel Administrativo</h1>
      </motion.div>

      <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto pb-2">
        <Button variant="ghost" className={activeTab === 'ranking' ? 'border-b-2 border-primary text-primary' : ''} onClick={() => setActiveTab('ranking')}><Users className="w-4 h-4 mr-2" /> Ranking</Button>
        <Button variant="ghost" className={activeTab === 'modules' ? 'border-b-2 border-primary text-primary' : ''} onClick={() => setActiveTab('modules')}><BookOpen className="w-4 h-4 mr-2" /> Módulos</Button>
        <Button variant="ghost" className={activeTab === 'faq' ? 'border-b-2 border-primary text-primary' : ''} onClick={() => setActiveTab('faq')}><HelpCircle className="w-4 h-4 mr-2" /> FAQ</Button>
        <Button variant="ghost" className={activeTab === 'updates' ? 'border-b-2 border-primary text-primary' : ''} onClick={() => setActiveTab('updates')}><Megaphone className="w-4 h-4 mr-2" /> Atualizações</Button>
        <Button variant="ghost" className={activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : ''} onClick={() => setActiveTab('settings')}><Settings2 className="w-4 h-4 mr-2" /> Config Global</Button>
      </div>

      {/* RANKING */}
      {activeTab === 'ranking' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"><Users className="w-6 h-6 text-blue-500" /></div>
              <div><p className="text-sm text-muted-foreground">Total de Alunos</p><p className="text-3xl font-bold mt-1">{users.length}</p></div>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20"><CheckCircle2 className="w-6 h-6 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Concluíram o Curso</p><p className="text-3xl font-bold mt-1">{users.filter(u => (u.completed_lessons?.length || 0) === modules.length).length}</p></div>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"><Clock className="w-6 h-6 text-orange-500" /></div>
              <div><p className="text-sm text-muted-foreground">Horas Estudadas</p><p className="text-3xl font-bold mt-1">{Math.round(users.reduce((sum, u) => sum + (u.studied_minutes || 0), 0) / 60)}h</p></div>
            </Card>
          </div>
          <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 overflow-hidden">
            <h3 className="text-xl font-bold mb-6">Ranking de Alunos</h3>
            <div className="rounded-lg border border-border/50 overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="border-border/50 hover:bg-transparent"><TableHead className="w-16 text-center">Pos.</TableHead><TableHead>Aluno</TableHead><TableHead className="text-center">Progresso</TableHead><TableHead className="text-center">Sequência</TableHead><TableHead className="text-center">Tempo</TableHead><TableHead className="text-right">Certificado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map((user, index) => {
                    const lessonsCount = user.completed_lessons?.length || 0;
                    const isFinished = lessonsCount === modules.length;
                    return (
                      <TableRow key={user.user_id} className="border-border/50">
                        <TableCell className="text-center font-bold">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}</TableCell>
                        <TableCell><div className="flex items-center gap-3"><Avatar className="w-10 h-10 border border-border/50">{user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-full" /> : <AvatarFallback className="bg-muted text-xs">{user.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>}</Avatar><div className="flex flex-col"><span className="font-medium text-sm">{user.full_name || "Sem Nome"}</span><span className="text-xs text-muted-foreground">{user.email}</span></div></div></TableCell>
                        <TableCell className="text-center"><span className={`px-2 py-1 rounded-md text-xs font-medium ${isFinished ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{lessonsCount} / {modules.length}</span></TableCell>
                        <TableCell className="text-center text-sm">🔥 {user.streak || 0} dias</TableCell>
                        <TableCell className="text-center text-sm">{user.studied_minutes || 0} min</TableCell>
                        <TableCell className="text-right">{isFinished ? <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${user.email}`} className="gap-2"><Mail className="w-3 h-3" /> Enviar</Button> : <span className="text-xs text-muted-foreground">Em andamento</span>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* MÓDULOS COM REORDENAÇÃO E UPLOAD */}
      {activeTab === 'modules' && (
        <div className="space-y-8">
          <Button onClick={handleAddModule} className="bg-primary"><PlusCircle className="w-4 h-4 mr-2" /> Adicionar Novo Módulo</Button>
          
          {Object.entries(sections).map(([sectionName, mods]) => (
            <div key={sectionName}>
              <h3 className="text-xl font-bold mb-4 text-primary">{sectionName}</h3>
              <div className="space-y-4 w-full">
                {mods.map((mod) => {
                  const globalIndex = modules.findIndex(m => m.id === mod.id);
                  return (
                    <Card key={mod.id} className="p-4 bg-card/50 border-border/50 grid grid-cols-[auto_1fr_auto] items-center gap-4 w-full">
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={globalIndex === 0} onClick={() => handleMoveModule(globalIndex, 'up')}><ChevronUp className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={globalIndex === modules.length - 1} onClick={() => handleMoveModule(globalIndex, 'down')}><ChevronDown className="w-4 h-4" /></Button>
                      </div>

                      <div className="flex items-center gap-6 min-w-0">
                        <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                          {mod.thumbnail_url ? <Image src={mod.thumbnail_url} alt="Thumb" fill sizes="112px" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">Sem imagem</div>}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/90 pointer-events-none"></div>
                        </div>
                        <div className="min-w-0 flex flex-col justify-center text-left">
                          <span className="text-xs text-primary font-medium">Ordem: {mod.order_index}</span>
                          <h3 className="text-lg font-bold truncate">{mod.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{mod.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-self-end">
                        <Button variant="outline" onClick={() => setEditingModule(mod)}><Edit3 className="w-4 h-4 mr-2" /> Editar</Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteModule(mod.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <Card className="p-6 bg-card/50 border-border/50 space-y-4">
            <h3 className="font-bold">Adicionar Pergunta</h3>
            <Input placeholder="Pergunta" value={newFaq.q} onChange={(e) => setNewFaq({...newFaq, q: e.target.value})} />
            <Textarea placeholder="Resposta" value={newFaq.a} onChange={(e) => setNewFaq({...newFaq, a: e.target.value})} />
            <Button onClick={addFaq}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar</Button>
          </Card>
          {faqs.map(faq => (
            <Card key={faq.id} className="p-6 bg-card/50 border-border/50 flex justify-between items-center">
              <div><h4 className="font-medium">{faq.question}</h4><p className="text-sm text-muted-foreground line-clamp-1">{faq.answer}</p></div>
              <Button size="icon" variant="ghost" onClick={() => deleteFaq(faq.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </Card>
          ))}
        </div>
      )}

      {/* ATUALIZAÇÕES */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <Card className="p-6 bg-card/50 border-border/50 space-y-4">
            <h3 className="font-bold">Postar Atualização</h3>
            <Input placeholder="Título" value={newUpdate.t} onChange={(e) => setNewUpdate({...newUpdate, t: e.target.value})} />
            <Textarea placeholder="Conteúdo" value={newUpdate.c} onChange={(e) => setNewUpdate({...newUpdate, c: e.target.value})} />
            <div className="flex flex-col gap-2">
              <Label>Válido até (Opcional)</Label>
              <Input type="date" value={newUpdate.d} onChange={(e) => setNewUpdate({...newUpdate, d: e.target.value})} />
            </div>
            <Button onClick={addUpdate}><PlusCircle className="w-4 h-4 mr-2" /> Postar</Button>
          </Card>
          {updates.map(up => (
            <Card key={up.id} className="p-6 bg-card/50 border-border/50 flex justify-between items-center">
              <div>
                <h4 className="font-medium">{up.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-1">{up.content}</p>
                {up.end_date && <span className="text-xs text-orange-500">Válido até: {new Date(up.end_date).toLocaleDateString('pt-BR')}</span>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteUpdate(up.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <Card className="p-6 bg-card/50 border-border/50 max-w-2xl">
          <h3 className="font-bold mb-4">Link da Comunidade</h3>
          <Input value={communityLink} onChange={(e) => setCommunityLink(e.target.value)} />
          <Button className="mt-4" onClick={saveCommunityLink}>Salvar Link</Button>
        </Card>
      )}

      {/* MODAL DE EDIÇÃO COMPLETO COM UPLOAD */}
      {editingModule && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="p-8 bg-card border-border/50 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Editando: {editingModule.title}</h2>
            <div className="space-y-4">
              <div><Label>Seção (Ex: Curso Principal, Bônus)</Label><Input value={editingModule.section || ""} onChange={(e) => setEditingModule({...editingModule, section: e.target.value})} /></div>
              <div><Label>Título</Label><Input value={editingModule.title} onChange={(e) => setEditingModule({...editingModule, title: e.target.value})} /></div>
              <div><Label>Descrição</Label><Input value={editingModule.description} onChange={(e) => setEditingModule({...editingModule, description: e.target.value})} /></div>
              <div><Label>URL do Vídeo</Label><Input value={editingModule.video_url} onChange={(e) => setEditingModule({...editingModule, video_url: e.target.value})} /></div>
              
              <div>
                <Label>Thumbnail da Aula</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={editingModule.thumbnail_url || ""} onChange={(e) => setEditingModule({...editingModule, thumbnail_url: e.target.value})} placeholder="Cole o link ou envie um arquivo" />
                  <Button type="button" variant="outline" onClick={() => thumbInputRef.current?.click()} disabled={isUploadingThumb}>
                    {isUploadingThumb ? "Enviando..." : <Upload className="w-4 h-4 mr-2" />}
                    Enviar
                  </Button>
                  <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={handleUploadThumb} />
                </div>
                {editingModule.thumbnail_url && (
                  <div className="mt-4 relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 bg-zinc-900">
                    <img src={editingModule.thumbnail_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x169?text=Link+Invalido'; }} />
                  </div>
                )}
              </div>

              <div><Label>Conteúdo da Aula</Label><Textarea value={editingModule.lesson_content} onChange={(e) => setEditingModule({...editingModule, lesson_content: e.target.value})} rows={4} /></div>
              
              <div>
                <Label className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4" /> Checklist da Aula</Label>
                {editingModule.checklist?.map((item: string, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-md bg-secondary mb-2">
                    <span className="text-sm">{item}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeChecklistItem(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Novo item (ex: Baixou o app)" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} />
                  <Button onClick={addChecklistItem}><PlusCircle className="w-4 h-4" /></Button>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2"><LinkIcon className="w-4 h-4" /> Materiais de Apoio</Label>
                {editingModule.materials?.map((mat: any, i: number) => (
                  <div key={i} className="flex justify-between p-2 rounded-md bg-secondary mb-2">
                    <span className="text-sm">{mat.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeItem('materials', i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Nome (ex: PDF de Regras)" value={newMaterial.name} onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})} />
                  <Input placeholder="URL" value={newMaterial.url} onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})} />
                  <Button onClick={() => addItem('materials')}><PlusCircle className="w-4 h-4" /></Button>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2"><LinkIcon className="w-4 h-4" /> Botões de Link</Label>
                {editingModule.links?.map((link: any, i: number) => (
                  <div key={i} className="flex justify-between p-2 rounded-md bg-secondary mb-2">
                    <span className="text-sm">{link.label}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeItem('links', i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Título (ex: Criar Conta)" value={newMaterial.name} onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})} />
                  <Input placeholder="URL" value={newMaterial.url} onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})} />
                  <Button onClick={() => addItem('links')}><PlusCircle className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-border">
              <Button variant="outline" className="px-8" onClick={() => setEditingModule(null)}>Cancelar</Button>
              <Button className="bg-primary px-8" onClick={handleSaveModule} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
