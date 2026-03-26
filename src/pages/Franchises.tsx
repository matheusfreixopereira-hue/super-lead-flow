import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, ChevronDown, ChevronUp, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function Franchises() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', description: '' });

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false });
    if (data) setCompanies(data);
    setLoading(false);
  };

  const handleAddCompany = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('companies').insert({
      name: form.name,
      description: form.description,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Empresa adicionada!' });
      setAddModalOpen(false);
      setForm({ name: '', description: '' });
      fetchCompanies();
    }
    setSaving(false);
  };

  const handleEditCompany = async () => {
    setSaving(true);
    const { error } = await supabase.from('companies').update({
      name: editForm.name,
      description: editForm.description,
    }).eq('id', editForm.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Empresa atualizada!' });
      setEditModalOpen(false);
      fetchCompanies();
    }
    setSaving(false);
  };

  const handleDeleteCompany = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('companies').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Empresa excluída!' });
      fetchCompanies();
    }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

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
          <h1 className="text-2xl font-display font-bold text-foreground">Minhas Empresas</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas empresas cadastradas</p>
        </div>
        {(role === 'admin') && (
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Empresa
          </Button>
        )}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Nenhuma empresa cadastrada ainda.</div>
      )}

      <div className="space-y-3">
        {companies.map(company => {
          const isExpanded = expanded === company.id;
          return (
            <div key={company.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : company.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{company.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {role === 'admin' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setEditForm({ id: company.id, name: company.name, description: company.description });
                        setEditModalOpen(true);
                      }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(company.id);
                        setDeleteDialogOpen(true);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{company.description || 'Sem descrição'}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Empresa</DialogTitle>
            <DialogDescription>Cadastre uma nova empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Empresa *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Minha Empresa" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição da empresa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCompany} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Altere os dados da empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Empresa *</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditCompany} disabled={saving || !editForm.name.trim()}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
