import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Send, User, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string | null;
  stage: string;
  temperature: string;
}

interface MessageRow {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string;
  role: string;
}

const STAGE_LABELS: Record<string, string> = {
  sdr_received: 'Leads Recebidos (SDR)',
  sdr_meeting_scheduled: 'Agendaram Reunião',
  sdr_meeting_done: 'Fizeram Reunião',
  sdr_disqualified: 'Desqualificados (SDR)',
  sdr_no_show: 'No Show',
};

export default function SDRChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchLeads(); }, []);
  useEffect(() => { if (selectedLeadId) fetchMessages(); }, [selectedLeadId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, first_name, last_name, stage, temperature')
      .order('created_at', { ascending: false });
    if (data) {
      setLeads(data);
      if (data.length > 0) setSelectedLeadId(data[0].id);
    }
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('user_id, display_name, role');
    if (data) setProfiles(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('lead_messages')
      .select('id, content, sender_type, created_at')
      .eq('lead_id', selectedLeadId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedLeadId) return;
    const msg = input.trim();
    setInput('');

    await supabase.from('lead_messages').insert({
      lead_id: selectedLeadId,
      content: msg,
      sender_type: 'human',
      sender_id: user?.id,
    });

    setTimeout(async () => {
      await supabase.from('lead_messages').insert({
        lead_id: selectedLeadId,
        content: 'Obrigado pela informação! Vou analisar e retorno em breve. 🤖',
        sender_type: 'ai',
      });
      fetchMessages();
    }, 1000);

    fetchMessages();
  };

  const handleMoveLead = async () => {
    if (!selectedLeadId) return;
    const updates: Record<string, string | null> = { stage: moveStage };
    if (assignTo) {
      const targetProfile = profiles.find(p => p.user_id === assignTo);
      if (targetProfile?.role === 'closer') updates.closer_id = assignTo;
      if (targetProfile?.role === 'sdr') updates.sdr_id = assignTo;
    }
    const { error } = await supabase.from('leads').update(updates).eq('id', selectedLeadId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Lead movido com sucesso!' });
      setMoveModalOpen(false);
      fetchLeads();
    }
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Left: lead list */}
      <div className="w-72 flex-shrink-0 bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> Leads ({leads.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className={`w-full text-left px-3 py-3 border-b transition-colors text-sm ${
                selectedLeadId === lead.id ? 'bg-primary/10' : 'hover:bg-muted/30'
              }`}
            >
              <p className="font-medium text-foreground truncate">{lead.first_name} {lead.last_name || ''}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{STAGE_LABELS[lead.stage] || lead.stage}</span>
                <span className="text-xs">
                  {lead.temperature === 'hot' ? '🔥' : lead.temperature === 'warm' ? '🌤️' : '❄️'}
                </span>
              </div>
            </button>
          ))}
          {leads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">Nenhum lead</p>
          )}
        </div>
      </div>

      {/* Right: chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">SDR IA</h1>
            {selectedLead && (
              <p className="text-muted-foreground text-sm">
                Conversando com {selectedLead.first_name} {selectedLead.last_name || ''}
              </p>
            )}
          </div>
          {selectedLeadId && (
            <Button variant="outline" onClick={() => setMoveModalOpen(true)}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Mover Lead
            </Button>
          )}
        </div>

        <div className="flex-1 bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {selectedLeadId ? 'Nenhuma mensagem ainda' : 'Selecione um lead para iniciar'}
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={msg.sender_type === 'ai' ? '' : 'flex justify-end'}>
                <div className={msg.sender_type === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user'}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender_type === 'ai' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    <span className="text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite uma mensagem..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!selectedLeadId}
            />
            <Button onClick={sendMessage} disabled={!selectedLeadId || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Move Lead Modal */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova etapa</Label>
              <Select value={moveStage} onValueChange={setMoveStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Atribuir a (opcional)</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {profiles.filter(p => ['sdr', 'closer'].includes(p.role)).map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.display_name} ({p.role.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleMoveLead}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
