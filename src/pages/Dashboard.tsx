import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, Bot, DollarSign, ArrowUpRight } from 'lucide-react';

interface LeadRow {
  id: string;
  stage: string;
  temperature: string;
  bant_status: string;
  source: string;
  sdr_id: string | null;
  closer_id: string | null;
  created_at: string;
}

const SDR_STAGES = ['sdr_received', 'sdr_meeting_scheduled', 'sdr_meeting_done', 'sdr_disqualified', 'sdr_no_show'];
const CLOSER_STAGES = ['closer_received', 'closer_meeting_done', 'closer_contract_sent', 'closer_closed', 'closer_disqualified', 'closer_franchisee_base'];

const STAGE_LABELS: Record<string, string> = {
  sdr_received: 'Leads Recebidos',
  sdr_meeting_scheduled: 'Agendaram Reunião',
  sdr_meeting_done: 'Fizeram Reunião',
  sdr_disqualified: 'Desqualificados (SDR)',
  sdr_no_show: 'No Show',
  closer_received: 'Leads Recebidos',
  closer_meeting_done: 'Fizeram Reunião',
  closer_contract_sent: 'Receberam Contrato',
  closer_closed: 'Fecharam',
  closer_disqualified: 'Desqualificados',
  closer_franchisee_base: 'Base de Franqueados',
};

export default function Dashboard() {
  const { user, role, canViewMarketing, isSDR, isCloser } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('id, stage, temperature, bant_status, source, sdr_id, closer_id, created_at');
    if (data) setLeads(data);
    setLoading(false);
  };

  const myLeads = isSDR
    ? leads.filter(l => l.sdr_id === user?.id)
    : isCloser
    ? leads.filter(l => l.closer_id === user?.id)
    : leads;

  const totalLeads = myLeads.length;
  const qualifiedLeads = myLeads.filter(l => l.bant_status === 'qualified').length;
  const closedLeads = myLeads.filter(l => l.stage === 'closer_closed').length;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';
  const aiActiveLeads = leads.filter(l => l.stage === 'sdr_received').length;

  const allStages = canViewMarketing ? [...SDR_STAGES, ...CLOSER_STAGES] : isSDR ? SDR_STAGES : CLOSER_STAGES;
  const chartData = allStages.map(stage => ({
    name: STAGE_LABELS[stage] || stage,
    leads: myLeads.filter(l => l.stage === stage).length,
  }));

  const statCards = [
    { label: 'Total de Leads', value: totalLeads, icon: Users, change: '+12%' },
    { label: 'Qualificados BANT', value: qualifiedLeads, icon: Target, change: '+8%' },
    { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: TrendingUp, change: '+5%' },
    ...(canViewMarketing ? [{ label: 'IA Atendendo', value: aiActiveLeads, icon: Bot, change: '+15%' }] : []),
  ];

  const marketingCards = canViewMarketing ? [
    { label: 'Leads Marketing', value: leads.filter(l => l.source === 'marketing').length, icon: Users },
    { label: 'Investido Marketing', value: 'R$ 25.000', icon: DollarSign },
    { label: 'CPL', value: 'R$ 42', icon: Target },
    { label: 'ROI Estimado', value: '320%', icon: TrendingUp },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {canViewMarketing ? 'Visão geral de leads e marketing' : 'Seus leads e métricas'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-primary font-medium flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              {card.change} vs semana passada
            </p>
          </div>
        ))}
      </div>

      {marketingCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketingCards.map((card, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <card.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Leads por Etapa</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="leads" fill="hsl(148, 62%, 26%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
