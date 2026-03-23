import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2 } from 'lucide-react';

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  franchise: string;
  stage: string;
  temperature: string;
  score: number;
  created_at: string;
}

const STAGE_LABELS: Record<string, string> = {
  sdr_received: 'Leads Recebidos',
  sdr_meeting_scheduled: 'Agendaram Reunião',
  sdr_meeting_done: 'Fizeram Reunião',
  sdr_disqualified: 'Desqualificados (SDR)',
  sdr_no_show: 'No Show',
  closer_received: 'Leads Recebidos (Closer)',
  closer_meeting_done: 'Fizeram Reunião (Closer)',
  closer_contract_sent: 'Receberam Contrato',
  closer_closed: 'Fecharam',
  closer_disqualified: 'Desqualificados (Closer)',
  closer_franchisee_base: 'Base de Franqueados',
};

export default function Leads() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, source, franchise, stage, temperature, score, created_at')
      .order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  const filtered = leads.filter(l => {
    const matchSearch = `${l.first_name} ${l.last_name || ''} ${l.email || ''} ${l.phone || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

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
          <h1 className="text-2xl font-display font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} leads encontrados</p>
        </div>
        {(role === 'admin' || role === 'supervisor' || role === 'sdr') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {Object.entries(STAGE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Origem</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Etapa</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Temp.</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/leads/${lead.id}`)}>
                <td className="px-4 py-3 font-medium text-foreground">{lead.first_name} {lead.last_name || ''}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.email || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.phone || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{lead.source}</td>
                <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-1 rounded-full">{STAGE_LABELS[lead.stage] || lead.stage}</span></td>
                <td className="px-4 py-3">
                  <span className={`tag-${lead.temperature === 'hot' ? 'hot' : lead.temperature === 'warm' ? 'warm' : 'cold'}`}>
                    {lead.temperature === 'hot' ? '🔥 Quente' : lead.temperature === 'warm' ? '🌤️ Morno' : '❄️ Frio'}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{lead.score}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum lead encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
