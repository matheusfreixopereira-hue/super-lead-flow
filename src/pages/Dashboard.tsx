import { useCRM } from '@/contexts/CRMContext';
import { PIPELINE_STAGES } from '@/types/crm';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, CalendarCheck, Bot, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function StatCard({ title, value, change, positive, icon: Icon }: { 
  title: string; value: string | number; change: string; positive: boolean; icon: React.ElementType 
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-display font-bold mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${positive ? 'text-success' : 'text-destructive'}`}>
        {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span>{change} vs semana passada</span>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { leads } = useCRM();

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.bantStatus === 'qualified').length;
  const closedLeads = leads.filter(l => l.stage === 'closed').length;
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;
  const aiAttending = leads.filter(l => l.isAIControlled && l.stage === 'attending').length;

  const stageData = PIPELINE_STAGES.map(s => ({
    name: s.label.split(' ')[0],
    leads: leads.filter(l => l.stage === s.key).length,
  }));

  const tempData = [
    { name: 'Quente', value: leads.filter(l => l.temperature === 'hot').length, color: 'hsl(0, 72%, 51%)' },
    { name: 'Morno', value: leads.filter(l => l.temperature === 'warm').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Frio', value: leads.filter(l => l.temperature === 'cold').length, color: 'hsl(210, 50%, 60%)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do seu CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Leads" value={totalLeads} change="+12%" positive icon={Users} />
        <StatCard title="Qualificados (BANT)" value={qualifiedLeads} change="+8%" positive icon={Target} />
        <StatCard title="Taxa de Conversão" value={`${conversionRate}%`} change="+3%" positive icon={TrendingUp} />
        <StatCard title="IA Atendendo" value={aiAttending} change="+2" positive icon={Bot} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="stat-card lg:col-span-2">
          <h3 className="font-display font-semibold mb-4">Leads por Etapa</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 10%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="leads" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="stat-card">
          <h3 className="font-display font-semibold mb-4">Temperatura</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tempData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                {tempData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {tempData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent leads */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="stat-card">
        <h3 className="font-display font-semibold mb-4">Leads Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-muted-foreground font-medium">Nome</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Franquia</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Etapa</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Score</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Temp.</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 5).map(lead => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 font-medium">{lead.name}</td>
                  <td className="py-3 text-muted-foreground">{lead.franchise}</td>
                  <td className="py-3">
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full font-medium text-secondary-foreground">
                      {PIPELINE_STAGES.find(s => s.key === lead.stage)?.label}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{lead.score}</td>
                  <td className="py-3">
                    <span className={`tag-${lead.temperature === 'hot' ? 'hot' : lead.temperature === 'warm' ? 'warm' : 'cold'}`}>
                      {lead.temperature === 'hot' ? '🔥 Quente' : lead.temperature === 'warm' ? '🌤️ Morno' : '❄️ Frio'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
