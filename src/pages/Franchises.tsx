import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building2, DollarSign, Target, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface KBEntry {
  id: string;
  category: string;
  title: string;
  content: string;
}

export default function Franchises() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('knowledge_base')
      .select('id, category, title, content')
      .order('sort_order');
    if (data) setEntries(data);
    setLoading(false);
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
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Franquias</h1>
        <p className="text-muted-foreground text-sm">Informações sobre Vinho 24h</p>
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
    </div>
  );
}
