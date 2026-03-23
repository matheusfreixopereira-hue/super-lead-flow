import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Clock, CheckCircle2, XCircle, User, Loader2 } from 'lucide-react';

interface AppointmentRow {
  id: string;
  lead_id: string;
  date: string;
  duration_minutes: number;
  confirmed: boolean;
  notes: string | null;
}

export default function Schedule() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });
    if (data) setAppointments(data);
    setLoading(false);
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
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Agenda</h1>
        <p className="text-muted-foreground text-sm">Reuniões agendadas</p>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center shadow-sm">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma reunião agendada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <div key={apt.id} className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(apt.date).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(apt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-muted-foreground">{apt.duration_minutes} min • {apt.notes || 'Sem observações'}</p>
                </div>
              </div>
              {apt.confirmed ? (
                <span className="flex items-center gap-1 text-sm text-primary font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Confirmada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4" /> Pendente
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
