import { useCRM } from '@/contexts/CRMContext';
import { PIPELINE_STAGES, Lead, LeadTemperature, PipelineStage } from '@/types/crm';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, Bot, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

function NewLeadDialog({ onAdd }: { onAdd: (lead: Lead) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!name || !phone) return;
    const newLead: Lead = {
      id: Date.now().toString(),
      name, phone, email, source, franchise: 'Vinho 24h',
      stage: 'new', temperature: 'warm', score: 30,
      bant: { budget: null, authority: null, need: null, timing: null },
      bantStatus: 'pending', messages: [], isAIControlled: true,
      createdAt: new Date(), updatedAt: new Date(),
    };
    onAdd(newLead);
    setName(''); setPhone(''); setEmail(''); setSource('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Lead</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Cadastrar Novo Lead</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <Input placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="WhatsApp (11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Origem (ex: Instagram Ads)" value={source} onChange={e => setSource(e.target.value)} />
          <Button onClick={handleSubmit} className="w-full">Cadastrar e Iniciar SDR IA</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Leads() {
  const { leads, addLead } = useCRM();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');
  const [tempFilter, setTempFilter] = useState<LeadTemperature | 'all'>('all');

  const filtered = leads.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (stageFilter !== 'all' && l.stage !== stageFilter) return false;
    if (tempFilter !== 'all' && l.temperature !== tempFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} leads encontrados</p>
        </div>
        <NewLeadDialog onAdd={addLead} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value as any)}
          className="h-10 px-3 rounded-lg border bg-card text-sm">
          <option value="all">Todas etapas</option>
          {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={tempFilter} onChange={e => setTempFilter(e.target.value as any)}
          className="h-10 px-3 rounded-lg border bg-card text-sm">
          <option value="all">Temperatura</option>
          <option value="hot">🔥 Quente</option>
          <option value="warm">🌤️ Morno</option>
          <option value="cold">❄️ Frio</option>
        </select>
      </div>

      {/* Lead list */}
      <div className="space-y-2">
        {filtered.map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/leads/${lead.id}`)}
            className="lead-card flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground flex-shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{lead.name}</p>
                {lead.isAIControlled && (
                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Bot className="w-3 h-3" /> IA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs bg-secondary px-2 py-1 rounded-full font-medium text-secondary-foreground hidden md:inline">
                {PIPELINE_STAGES.find(s => s.key === lead.stage)?.label}
              </span>
              <span className={`tag-${lead.temperature === 'hot' ? 'hot' : lead.temperature === 'warm' ? 'warm' : 'cold'}`}>
                {lead.temperature === 'hot' ? '🔥 Quente' : lead.temperature === 'warm' ? '🌤️ Morno' : '❄️ Frio'}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${lead.score}%` }} />
                </div>
                <span className="text-xs font-semibold w-6 text-right">{lead.score}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
