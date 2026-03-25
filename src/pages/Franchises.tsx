import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, DollarSign, Target, Users, ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface KBEntry {
  id: string;
  category: string;
  title: string;
  content: string;
}

export default function Franchises() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'descricao', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('knowledge_base')
      .select('id, category, title, content')
      .order('sort_order');
    if (data) setEntries(data);
    setLoading(false);
  };

  const handleAddCompany = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('knowledge_base').insert({
      title: form.title,
      category: form.category,
      content: form.content,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Empresa adicionada!' });
      setAddModalOpen(false);
      setForm({ title: '', category: 'descricao', content: '' });
      fetchEntries();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ICONS: Record<string, React.ElementType> = {
    descricao: Building2,
    investimento: DollarSign,
    argumentos: Target,
    faq: Users,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Minhas Empresas</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas empresas cadastradas</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Empresa
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {entries.map(entry => {
          const Icon = ICONS[entry.category] || Building2;
          const isExpanded = expanded === entry.id;
          return (
            <div key={entry.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : entry.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{entry.title}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-3">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-body">{entry.content}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Empresa *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Minha Empresa" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Breve descrição da empresa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCompany} disabled={saving || !form.title.trim()}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
