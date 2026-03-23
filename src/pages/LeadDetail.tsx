import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isCloser } = useAuth();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    const { data } = await supabase.from('leads').select('*').eq('id', id).single();
    if (data) setLead(data);
    setLoading(false);
  };

  const canEdit = () => {
    if (role === 'admin' || role === 'supervisor') return true;
    if (role === 'sdr') return true;
    if (isCloser && lead?.created_by === user?.id) return true;
    return false;
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase.from('leads').update({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
    }).eq('id', lead.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Salvo!', description: 'Lead atualizado com sucesso.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) return <p className="text-muted-foreground">Lead não encontrado.</p>;

  const editable = canEdit();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{lead.first_name} {lead.last_name || ''}</h1>
          <p className="text-muted-foreground text-sm">Detalhes do lead</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={lead.first_name} onChange={e => setLead({ ...lead, first_name: e.target.value })} disabled={!editable} />
          </div>
          <div className="space-y-2">
            <Label>Sobrenome</Label>
            <Input value={lead.last_name || ''} onChange={e => setLead({ ...lead, last_name: e.target.value })} disabled={!editable} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={lead.email || ''} onChange={e => setLead({ ...lead, email: e.target.value })} disabled={!editable} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={lead.phone || ''} onChange={e => setLead({ ...lead, phone: e.target.value })} disabled={!editable} />
          </div>
          <div className="space-y-2">
            <Label>Origem</Label>
            <Input value={lead.source} disabled />
          </div>
          <div className="space-y-2">
            <Label>Franquia</Label>
            <Input value={lead.franchise} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea value={lead.notes || ''} onChange={e => setLead({ ...lead, notes: e.target.value })} disabled={!editable} placeholder="Notas internas..." />
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Qualificação BANT</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Budget</Label><Input value={lead.bant_budget || 'Não informado'} disabled /></div>
            <div className="space-y-2"><Label>Authority</Label><Input value={lead.bant_authority || 'Não informado'} disabled /></div>
            <div className="space-y-2"><Label>Need</Label><Input value={lead.bant_need || 'Não informado'} disabled /></div>
            <div className="space-y-2"><Label>Timing</Label><Input value={lead.bant_timing || 'Não informado'} disabled /></div>
          </div>
        </div>

        {editable && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar alterações
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
