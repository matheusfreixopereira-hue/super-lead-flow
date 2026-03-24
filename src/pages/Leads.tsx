import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    source: 'marketing', franchise: 'Vinho 24h', stage: 'sdr_received', temperature: 'warm',
  });

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, source, franchise, stage, temperature, score, created_at')
      .order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  const handleCreateLead = async () => {
    setSaving(true);
    const { error } = await supabase.from('leads').insert({
      first_name: form.first_name,
      last_name: form.last_name || null,
      email: form.email || null,
      phone: form.phone || null,
      source: form.source,
      franchise: form.franchise,
      stage: form.stage,
      temperature: form.temperature,
      created_by: user?.id,
      sdr_id: role === 'sdr' ? user?.id : null,
      closer_id: role === 'closer' ? user?.id : null,
    });
    if (error) {
      toast({ title: 'Erro ao criar lead', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Lead criado com sucesso!' });
      setModalOpen(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', source: 'marketing', franchise: 'Vinho 24h', stage: 'sdr_received', temperature: 'warm' });
      fetchLeads();
    }
    setSaving(false);
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
          <Button onClick={() => setModalOpen(true)}>
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

      {/* New Lead Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome *</Label>
                <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div>
                <Label>Sobrenome</Label>
                <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origem</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Select value={form.temperature} onValueChange={v => setForm(f => ({ ...f, temperature: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">🔥 Quente</SelectItem>
                    <SelectItem value="warm">🌤️ Morno</SelectItem>
                    <SelectItem value="cold">❄️ Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateLead} disabled={saving || !form.first_name}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Criar Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
