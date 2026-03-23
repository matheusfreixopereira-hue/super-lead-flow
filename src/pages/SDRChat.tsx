import { useCRM } from '@/contexts/CRMContext';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Lead } from '@/types/crm';

const BANT_QUESTIONS = {
  intro: [
    'Olá! 👋 Sou a assistente virtual da Super Franquias. Estou aqui para te ajudar a encontrar a franquia ideal para seu perfil! Como posso te chamar?',
  ],
  budget: [
    'Que ótimo te conhecer, {name}! Para te ajudar da melhor forma, gostaria de entender: você já tem um valor de investimento em mente? A Vinho 24h começa a partir de R$ 95 mil.',
  ],
  authority: [
    'Excelente! E essa decisão de investimento seria tomada por você ou tem mais alguém envolvido, como um sócio ou familiar?',
  ],
  need: [
    'Entendi! Me conta um pouco mais: o que te motivou a buscar uma franquia? Está buscando renda extra, trocar de carreira ou diversificar investimentos?',
  ],
  timing: [
    'Perfeito! E em quanto tempo você gostaria de começar a operar? Tem algum prazo em mente?',
  ],
  qualified: [
    '🎉 {name}, pelo que conversamos, seu perfil se encaixa muito bem na Vinho 24h! Gostaria de agendar uma reunião com nosso consultor especializado para apresentar todos os detalhes? Temos horários disponíveis esta semana.',
  ],
  not_qualified: [
    'Obrigada por compartilhar, {name}! Por enquanto, vou te enviar alguns materiais sobre a franquia para você conhecer melhor. Quando estiver pronto para avançar, é só me chamar! 📚',
  ],
};

function getNextBANTStep(lead: Lead): keyof typeof BANT_QUESTIONS {
  if (!lead.bant.budget) return 'budget';
  if (!lead.bant.authority) return 'authority';
  if (!lead.bant.need) return 'need';
  if (!lead.bant.timing) return 'timing';
  return 'qualified';
}

export default function SDRChat() {
  const { leads, addMessage, updateLead } = useCRM();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const aiLeads = leads.filter(l => l.isAIControlled || l.stage === 'attending');
  const selectedLead = leads.find(l => l.id === selectedLeadId) || aiLeads[0];

  useEffect(() => {
    if (aiLeads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(aiLeads[0].id);
    }
  }, [aiLeads, selectedLeadId]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [selectedLead?.messages]);

  const simulateAIResponse = (leadId: string, lead: Lead) => {
    const step = getNextBANTStep(lead);
    const templates = BANT_QUESTIONS[step];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const content = template.replace('{name}', lead.name.split(' ')[0]);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        content,
        timestamp: new Date(),
      };
      addMessage(leadId, aiMsg);
    }, 1500);
  };

  const handleSend = () => {
    if (!message.trim() || !selectedLead) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'lead',
      content: message,
      timestamp: new Date(),
    };
    addMessage(selectedLead.id, msg);
    setMessage('');

    // Simulate AI analyzing BANT responses
    const step = getNextBANTStep(selectedLead);
    if (step === 'budget') {
      updateLead(selectedLead.id, { bant: { ...selectedLead.bant, budget: message }, score: Math.min(selectedLead.score + 20, 100) });
    } else if (step === 'authority') {
      updateLead(selectedLead.id, { bant: { ...selectedLead.bant, authority: message }, score: Math.min(selectedLead.score + 15, 100) });
    } else if (step === 'need') {
      updateLead(selectedLead.id, { bant: { ...selectedLead.bant, need: message }, score: Math.min(selectedLead.score + 15, 100) });
    } else if (step === 'timing') {
      updateLead(selectedLead.id, { 
        bant: { ...selectedLead.bant, timing: message }, 
        score: Math.min(selectedLead.score + 15, 100),
        bantStatus: 'qualified',
        stage: 'qualified',
      });
    }

    simulateAIResponse(selectedLead.id, selectedLead);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Bot className="w-7 h-7 text-primary" /> SDR IA
        </h1>
        <p className="text-muted-foreground text-sm">Assistente inteligente com método BANT</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-180px)]">
        {/* Lead list */}
        <div className="stat-card overflow-y-auto">
          <h3 className="font-display font-semibold text-sm mb-3">Leads em Atendimento</h3>
          <div className="space-y-1.5">
            {aiLeads.map(lead => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                  selectedLead?.id === lead.id ? 'bg-secondary' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-xs text-primary">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.franchise}</p>
                  </div>
                </div>
                {lead.isAIControlled && (
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" /> IA ativa
                  </div>
                )}
              </button>
            ))}
            {aiLeads.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum lead em atendimento</p>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="stat-card lg:col-span-2 flex flex-col">
          {selectedLead ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selectedLead.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLead.phone} · {selectedLead.franchise}</p>
                </div>
                {selectedLead.isAIControlled && (
                  <span className="ml-auto text-xs bg-secondary text-primary px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> IA Respondendo
                  </span>
                )}
              </div>
              <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 py-3">
                {selectedLead.messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'lead' ? 'justify-end' : 'justify-start'}`}>
                    <div className={msg.sender === 'lead' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {msg.sender === 'ai' && <Bot className="w-3 h-3" />}
                        {msg.sender === 'human' && <User className="w-3 h-3" />}
                        <span className="text-[10px] opacity-70">
                          {msg.sender === 'ai' ? 'SDR IA' : msg.sender === 'human' ? 'Consultor' : selectedLead.name.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-2 pt-3 border-t">
                <Input
                  placeholder={selectedLead.isAIControlled ? 'Simular resposta do lead...' : 'Digitar mensagem...'}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Selecione um lead para ver a conversa
            </div>
          )}
        </div>

        {/* BANT sidebar */}
        <div className="stat-card overflow-y-auto">
          {selectedLead ? (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-sm">BANT - {selectedLead.name.split(' ')[0]}</h3>
              <div className="space-y-3">
                {[
                  { key: 'budget', label: 'Budget', icon: '💰', value: selectedLead.bant.budget },
                  { key: 'authority', label: 'Authority', icon: '👤', value: selectedLead.bant.authority },
                  { key: 'need', label: 'Need', icon: '🎯', value: selectedLead.bant.need },
                  { key: 'timing', label: 'Timing', icon: '⏰', value: selectedLead.bant.timing },
                ].map(item => (
                  <div key={item.key} className={`p-3 rounded-lg border text-sm ${item.value ? 'bg-secondary border-primary/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{item.icon}</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">{item.label}</span>
                      {item.value ? <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" /> : null}
                    </div>
                    <p className="font-medium">{item.value || 'Aguardando...'}</p>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full inline-block ${
                  selectedLead.bantStatus === 'qualified' ? 'bg-secondary text-primary' :
                  selectedLead.bantStatus === 'not_qualified' ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {selectedLead.bantStatus === 'qualified' ? '✅ Qualificado' :
                   selectedLead.bantStatus === 'not_qualified' ? '❌ Não Qualificado' :
                   selectedLead.bantStatus === 'nurturing' ? '🌱 Nutrição' : '⏳ Em Análise'}
                </span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      animate={{ width: `${selectedLead.score}%` }} />
                  </div>
                  <span className="font-display font-bold text-lg">{selectedLead.score}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Selecione um lead</p>
          )}
        </div>
      </div>
    </div>
  );
}
