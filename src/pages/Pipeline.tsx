import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string | null;
  franchise: string;
  source: string;
  stage: string;
  temperature: string;
  score: number;
  is_ai_controlled: boolean;
  sdr_id: string | null;
  closer_id: string | null;
  created_by: string | null;
}

const SDR_STAGES = [
  { key: 'sdr_received', label: 'Leads Recebidos', color: 'bg-info' },
  { key: 'sdr_meeting_scheduled', label: 'Agendaram Reunião', color: 'bg-warning' },
  { key: 'sdr_meeting_done', label: 'Fizeram Reunião', color: 'bg-success' },
  { key: 'sdr_disqualified', label: 'Desqualificados', color: 'bg-destructive' },
  { key: 'sdr_no_show', label: 'No Show', color: 'bg-muted-foreground' },
];

const CLOSER_STAGES = [
  { key: 'closer_received', label: 'Leads Recebidos', color: 'bg-info' },
  { key: 'closer_meeting_done', label: 'Fizeram Reunião', color: 'bg-success' },
  { key: 'closer_contract_sent', label: 'Receberam Contrato', color: 'bg-warning' },
  { key: 'closer_closed', label: 'Fecharam', color: 'bg-primary' },
  { key: 'closer_disqualified', label: 'Desqualificados', color: 'bg-destructive' },
  { key: 'closer_franchisee_base', label: 'Base de Franqueados', color: 'bg-primary' },
];

export default function Pipeline() {
  const { user, role, isSDR, isCloser, isAdmin, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, first_name, last_name, franchise, source, stage, temperature, score, is_ai_controlled, sdr_id, closer_id, created_by');
    if (data) setLeads(data);
    setLoading(false);
  };

  // Determine which stages to show based on role
  let stages = isSDR ? SDR_STAGES : isCloser ? CLOSER_STAGES : [...SDR_STAGES, ...CLOSER_STAGES];

  // SDR sees closer disqualified, closer does NOT see SDR disqualified
  if (isSDR) {
    stages = [
      ...SDR_STAGES,
      { key: 'closer_disqualified', label: 'Desq. Closer', color: 'bg-orange-500' },
    ];
  }
  if (isCloser) {
    stages = CLOSER_STAGES.filter(s => s.key !== 'sdr_disqualified');
  }

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (stageKey: string) => {
    if (!draggedId) return;
    await supabase.from('leads').update({ stage: stageKey }).eq('id', draggedId);
    setLeads(prev => prev.map(l => l.id === draggedId ? { ...l, stage: stageKey } : l));
    setDraggedId(null);
  };

  // Filter leads per role
  const getStageLeads = (stageKey: string) => {
    let filtered = leads.filter(l => l.stage === stageKey);
    if (isSDR) {
      filtered = filtered.filter(l => l.sdr_id === user?.id || stageKey === 'closer_disqualified');
    }
    if (isCloser) {
      filtered = filtered.filter(l => l.closer_id === user?.id);
    }
    return filtered;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Pipeline de Vendas</h1>
        <p className="text-muted-foreground text-sm">
          {isSDR ? 'Kanban SDR' : isCloser ? 'Kanban Closer' : 'Visão completa do pipeline'}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map(stage => {
          const stageLeads = getStageLeads(stage.key);
          return (
            <div
              key={stage.key}
              className="pipeline-column flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                </div>
                <span className="text-xs bg-card px-2 py-0.5 rounded-full font-medium border">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {stageLeads.map(lead => (
                  <motion.div
                    key={lead.id}
                    layout
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="lead-card"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm text-foreground">
                        {lead.first_name} {lead.last_name || ''}
                      </p>
                      <span className={`tag-${lead.temperature === 'hot' ? 'hot' : lead.temperature === 'warm' ? 'warm' : 'cold'}`}>
                        {lead.temperature === 'hot' ? '🔥' : lead.temperature === 'warm' ? '🌤️' : '❄️'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{lead.franchise}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{lead.source}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-xs font-medium">{lead.score}</span>
                      </div>
                    </div>
                    {lead.is_ai_controlled && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        IA ativa
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
