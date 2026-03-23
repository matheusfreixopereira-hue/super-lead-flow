import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string | null;
  stage: string;
}

interface MessageRow {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
}

export default function SDRChat() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLeadId) fetchMessages();
  }, [selectedLeadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, first_name, last_name, stage')
      .order('created_at', { ascending: false });
    if (data) {
      setLeads(data);
      if (data.length > 0) setSelectedLeadId(data[0].id);
    }
    setLoading(false);
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

    // Simulate AI response
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

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">SDR IA</h1>
          <p className="text-muted-foreground text-sm">Chat com leads via IA</p>
        </div>
        <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione um lead" />
          </SelectTrigger>
          <SelectContent>
            {leads.map(lead => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.first_name} {lead.last_name || ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat area */}
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
                  {msg.sender_type === 'ai' ? (
                    <Bot className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
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

        {/* Input */}
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
  );
}
