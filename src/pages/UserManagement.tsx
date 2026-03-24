import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, UserPlus, Shield, ShieldCheck, Headphones, Bot } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  active: boolean;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Shield,
  supervisor: ShieldCheck,
  closer: Headphones,
  sdr: Bot,
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  closer: 'Closer',
  sdr: 'SDR',
};

export default function UserManagement() {
  const { role: myRole, canManageUsers } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ display_name: '', email: '', password: '', role: 'sdr' });

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    if (data) setProfiles(data);
    setLoading(false);
  };

  const allowedRoles = myRole === 'admin'
    ? ['admin', 'supervisor', 'closer', 'sdr']
    : ['closer', 'sdr'];

  const openCreate = () => {
    setEditing(null);
    setForm({ display_name: '', email: '', password: '@superfranquias2026', role: 'sdr' });
    setModalOpen(true);
  };

  const openEdit = (p: Profile) => {
    setEditing(p);
    setForm({ display_name: p.display_name, email: p.email, password: '', role: p.role });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const action = editing ? 'update' : 'create';
      const payload: Record<string, string> = {
        action,
        display_name: form.display_name,
        email: form.email,
        role: form.role,
      };
      if (form.password) payload.password = form.password;
      if (editing) payload.user_id = editing.user_id;

      const { data, error } = await supabase.functions.invoke('manage-users', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: editing ? 'Usuário atualizado!' : 'Usuário criado!' });
      setModalOpen(false);
      fetchProfiles();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (p: Profile) => {
    if (!confirm(`Excluir ${p.display_name}?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', user_id: p.user_id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Usuário excluído!' });
      fetchProfiles();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const canEditUser = (p: Profile) => {
    if (myRole === 'admin') return true;
    if (myRole === 'supervisor' && ['sdr', 'closer'].includes(p.role)) return true;
    return false;
  };

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Acesso restrito.</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-display font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground text-sm">{profiles.length} usuários cadastrados</p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cargo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const Icon = ROLE_ICONS[p.role] || Shield;
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.display_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      <Icon className="w-3 h-3" />
                      {ROLE_LABELS[p.role] || p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEditUser(p) && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(p)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Senha {editing && '(deixe vazio para manter)'}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editing ? '••••••••' : ''} />
            </div>
            <div>
              <Label>Cargo</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedRoles.map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.display_name || !form.email}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
