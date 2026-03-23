import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, BookOpen, DollarSign, HelpCircle, Target, ShieldAlert, FileText } from 'lucide-react';
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
}

export default function KnowledgeBase() {
  const { canViewMarketing } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('knowledge_base')
      .select('id, category, title, content')
      .order('sort_order');
    if (data) {
      setEntries(data);
      const contentMap: Record<string, string> = {};
      data.forEach(e => { contentMap[e.id] = e.content; });
      setEditedContent(contentMap);
    }
    setLoading(false);
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
    }
    setSaving(null);
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
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Banco de Dados</h1>
        <p className="text-muted-foreground text-sm">Base de conhecimento do SDR IA — Vinho 24h</p>
      </div>

      <div className="grid gap-4">
        {entries.map(entry => {
          const config = CATEGORY_CONFIG[entry.category] || { icon: FileText, label: entry.title };
          const Icon = config.icon;
          const hasChanges = editedContent[entry.id] !== entry.content;

          return (
            <div key={entry.id} className="bg-card rounded-xl border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{config.label}</h3>
                    <p className="text-xs text-muted-foreground">{entry.category}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSave(entry)}
                  disabled={!hasChanges || saving === entry.id}
                  variant={hasChanges ? 'default' : 'outline'}
                >
                  {saving === entry.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Salvar alterações
                </Button>
              </div>
              <Textarea
                value={editedContent[entry.id] || ''}
                onChange={(e) => setEditedContent(prev => ({ ...prev, [entry.id]: e.target.value }))}
                className="min-h-[150px] font-mono text-sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
