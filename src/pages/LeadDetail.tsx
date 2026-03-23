import { useParams, useNavigate } from 'react-router-dom';
import { useCRM } from '@/contexts/CRMContext';
import { PIPELINE_STAGES, PipelineStage, ChatMessage } from '@/types/crm';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, User, Send, Phone, Mail, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function BANTIndicator({ label, value, icon }: { label: string; value: string | null; icon: string }) {
  return (
    <div className={`p-3 rounded-lg border ${value ? 'bg-secondary border-primary/20' : 'bg-muted/50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
        {value ? <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground ml-auto" />}
      </div>
      <p className="text-sm font-medium">{value || 'Pendente'}</p>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { leads, updateLead, addMessage, toggleAIControl, moveLead } = useCRM();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const lead = leads.find(l => l.id === id);
  if (!lead) return <div className="p-8 text-center text-muted-foreground">Lead não encontrado</div>;

  const handleSend = () => {
    if (!message.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: lead.isAIControlled ? 'ai' : 'human',
      content: message,
      timestamp: new Date(),
    };
    addMessage(lead.id, msg);
    setMessage('');
  };

  const bantProgress = [lead.bant.budget, lead.bant.authority, lead.bant.need, lead.bant.timing].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Lead info */}
        <div className="space-y-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-xl text-secondary-foreground">
                {lead.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-display font-bold">{lead.name}</h2>
                <span className={`tag-${lead.temperature === 'hot' ? 'hot' : lead.temperature === 'warm' ? 'warm' : 'cold'}`}>
                  {lead.temperature === 'hot' ? '🔥 Quente' : lead.temperature === 'warm' ? '🌤️ Morno' : '❄️ Frio'}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{lead.phone}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{lead.email}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" />
                Criado em {lead.createdAt.toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Origem:</span><span className="font-medium">{lead.source}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Franquia:</span><span className="font-medium">{lead.franchise}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Score:</span><span className="font-bold text-primary">{lead.score}/100</span></div>
            </div>
          </div>

          {/* Pipeline stage */}
          <div className="stat-card">
            <h3 className="font-display font-semibold text-sm mb-3">Etapa do Pipeline</h3>
            <select
              value={lead.stage}
              onChange={e => moveLead(lead.id, e.target.value as PipelineStage)}
              className="w-full h-10 px-3 rounded-lg border bg-card text-sm"
            >
              {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* AI control */}
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm">SDR IA</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lead.isAIControlled ? 'IA está atendendo' : 'Humano assumiu'}
                </p>
              </div>
              <Button
                variant={lead.isAIControlled ? 'destructive' : 'default'}
                size="sm"
                onClick={() => toggleAIControl(lead.id)}
              >
                {lead.isAIControlled ? '👤 Assumir' : '🤖 Ativar IA'}
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Chat */}
        <div className="stat-card lg:col-span-1 flex flex-col h-[600px]">
          <div className="flex items-center gap-2 pb-3 border-b mb-3">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-sm">Conversa</h3>
            {lead.isAIControlled && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" /> IA ativa
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {lead.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Nenhuma mensagem ainda
              </div>
            ) : (
              lead.messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'lead' ? 'justify-end' : 'justify-start'}`}>
                  <div className={msg.sender === 'lead' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.sender === 'ai' && <Bot className="w-3 h-3" />}
                      {msg.sender === 'human' && <User className="w-3 h-3" />}
                      <span className="text-[10px] opacity-70">
                        {msg.sender === 'ai' ? 'SDR IA' : msg.sender === 'human' ? 'Humano' : lead.name}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] opacity-50 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-3 border-t mt-auto">
            <Input
              placeholder="Digitar mensagem..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Right - BANT */}
        <div className="space-y-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm">Qualificação BANT</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                lead.bantStatus === 'qualified' ? 'bg-secondary text-primary' :
                lead.bantStatus === 'not_qualified' ? 'bg-red-100 text-red-700' :
                'bg-muted text-muted-foreground'
              }`}>
                {lead.bantStatus === 'qualified' ? '✅ Qualificado' :
                 lead.bantStatus === 'not_qualified' ? '❌ Não Qualificado' :
                 lead.bantStatus === 'nurturing' ? '🌱 Em Nutrição' : '⏳ Pendente'}
              </span>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{bantProgress}/4</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }}
                  animate={{ width: `${(bantProgress / 4) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <BANTIndicator label="Budget" value={lead.bant.budget} icon="💰" />
              <BANTIndicator label="Authority" value={lead.bant.authority} icon="👤" />
              <BANTIndicator label="Need" value={lead.bant.need} icon="🎯" />
              <BANTIndicator label="Timing" value={lead.bant.timing} icon="⏰" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
