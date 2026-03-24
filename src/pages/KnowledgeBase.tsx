import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Save, Loader2, BookOpen, DollarSign, HelpCircle, Target, ShieldAlert, FileText,
  Plus, Pencil, Trash2, Upload, X, File, Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  descricao: { icon: BookOpen, label: 'Descrição do Negócio' },
  investimento: { icon: DollarSign, label: 'Modelo de Franquia' },
  faq: { icon: HelpCircle, label: 'Perguntas Frequentes' },
  argumentos: { icon: Target, label: 'Argumentos de Venda' },
  objecoes: { icon: ShieldAlert, label: 'Objeções e Respostas' },
  materiais: { icon: FileText, label: 'Materiais de Apoio' },
};

interface KBEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  sort_order: number;
}

interface KBFile {
  id: string;
  entry_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

export default function KnowledgeBase() {
  const { canViewMarketing, user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [files, setFiles] = useState<Record<string, KBFile[]>>({});
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [form, setForm] = useState({ title: '', category: '', content: '' });
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('knowledge_base')
      .select('id, category, title, content, sort_order')
      .order('sort_order');
    if (data) {
      setEntries(data);
      const contentMap: Record<string, string> = {};
      data.forEach(e => { contentMap[e.id] = e.content; });
      setEditedContent(contentMap);
      fetchFiles(data.map(e => e.id));
    }
    setLoading(false);
  };

  const fetchFiles = async (entryIds: string[]) => {
    if (entryIds.length === 0) return;
    const { data } = await supabase
      .from('knowledge_files')
      .select('*')
      .in('entry_id', entryIds);
    if (data) {
      const grouped: Record<string, KBFile[]> = {};
      data.forEach(f => {
        if (!grouped[f.entry_id]) grouped[f.entry_id] = [];
        grouped[f.entry_id].push(f);
      });
      setFiles(grouped);
    }
  };

  const handleSave = async (entry: KBEntry) => {
    setSaving(entry.id);
    const { error } = await supabase
      .from('knowledge_base')
      .update({ content: editedContent[entry.id] })
      .eq('id', entry.id);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Salvo!', description: `${entry.title} atualizado com sucesso.` });
      // Update local state so hasChanges resets
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, content: editedContent[entry.id] } : e));
    }
    setSaving(null);
  };

  const openCreate = () => {
    setEditingEntry(null);
    setForm({ title: '', category: '', content: '' });
    setModalOpen(true);
  };

  const openEditModal = (entry: KBEntry) => {
    setEditingEntry(entry);
    setForm({ title: entry.title, category: entry.category, content: entry.content });
    setModalOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    if (editingEntry) {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ title: form.title, category: form.category, content: form.content })
        .eq('id', editingEntry.id);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Atualizado!' });
        setModalOpen(false);
        fetchEntries();
      }
    } else {
      const maxOrder = entries.length > 0 ? Math.max(...entries.map(e => e.sort_order)) + 1 : 1;
      const { error } = await supabase
        .from('knowledge_base')
        .insert({ title: form.title, category: form.category, content: form.content, sort_order: maxOrder });
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Conhecimento adicionado!' });
        setModalOpen(false);
        fetchEntries();
      }
    }
  };

  const handleDelete = async (entry: KBEntry) => {
    if (!confirm(`Excluir "${entry.title}"?`)) return;
    const { error } = await supabase.from('knowledge_base').delete().eq('id', entry.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Excluído!' });
      fetchEntries();
    }
  };

  const handleFileUpload = async (entryId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(entryId);
    for (const file of Array.from(fileList)) {
      const path = `${entryId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('knowledge-files').upload(path, file);
      if (uploadError) {
        toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
        continue;
      }
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      await supabase.from('knowledge_files').insert({
        entry_id: entryId,
        file_name: file.name,
        file_path: path,
        file_type: fileType,
        file_size: file.size,
        uploaded_by: user?.id,
      });
    }
    setUploading(null);
    fetchFiles(entries.map(e => e.id));
    toast({ title: 'Upload concluído!' });
  };

  const handleDeleteFile = async (file: KBFile) => {
    await supabase.storage.from('knowledge-files').remove([file.file_path]);
    await supabase.from('knowledge_files').delete().eq('id', file.id);
    fetchFiles(entries.map(e => e.id));
    toast({ title: 'Arquivo removido!' });
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from('knowledge-files').getPublicUrl(path);
    return data.publicUrl;
  };

  if (!canViewMarketing) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Acesso restrito a Admin e Supervisores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Banco de Dados</h1>
          <p className="text-muted-foreground text-sm">Base de conhecimento do SDR IA — Vinho 24h</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Conhecimento
        </Button>
      </div>

      <div className="grid gap-4">
        {entries.map(entry => {
          const config = CATEGORY_CONFIG[entry.category] || { icon: FileText, label: entry.title };
          const Icon = config.icon;
          const hasChanges = editedContent[entry.id] !== entry.content;
          const entryFiles = files[entry.id] || [];

          return (
            <div key={entry.id} className="bg-card rounded-xl border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{entry.title}</h3>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(entry)} title="Editar título/categoria">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(entry)} title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(entry)}
                    disabled={!hasChanges || saving === entry.id}
                    variant={hasChanges ? 'default' : 'outline'}
                  >
                    {saving === entry.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Salvar
                  </Button>
                </div>
              </div>

              <Textarea
                value={editedContent[entry.id] || ''}
                onChange={(e) => setEditedContent(prev => ({ ...prev, [entry.id]: e.target.value }))}
                className="min-h-[150px] font-mono text-sm"
              />

              {/* Files section */}
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Arquivos anexados</p>
                  <div>
                    <input
                      type="file"
                      multiple
                      ref={el => { fileInputRefs.current[entry.id] = el; }}
                      className="hidden"
                      onChange={e => handleFileUpload(entry.id, e.target.files)}
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRefs.current[entry.id]?.click()}
                      disabled={uploading === entry.id}
                    >
                      {uploading === entry.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                      Upload
                    </Button>
                  </div>
                </div>
                {entryFiles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum arquivo anexado</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {entryFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs">
                        {f.file_type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-primary" /> : <File className="w-3.5 h-3.5 text-primary" />}
                        <a href={getFileUrl(f.file_path)} target="_blank" rel="noreferrer" className="text-foreground hover:underline max-w-[150px] truncate">
                          {f.file_name}
                        </a>
                        <button onClick={() => handleDeleteFile(f)} className="text-destructive hover:text-destructive/80">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Editar Conhecimento' : 'Adicionar Conhecimento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Scripts de Venda" />
            </div>
            <div>
              <Label>Categoria (slug)</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: scripts" />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="min-h-[120px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!form.title || !form.category}>
              {editingEntry ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
