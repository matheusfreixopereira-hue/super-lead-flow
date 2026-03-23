import { useCRM } from '@/contexts/CRMContext';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, CheckCircle2, XCircle, User } from 'lucide-react';

export default function Schedule() {
  const { appointments } = useCRM();

  const upcoming = appointments.filter(a => new Date(a.date) >= new Date());
  const past = appointments.filter(a => new Date(a.date) < new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Agenda</h1>
        <p className="text-muted-foreground text-sm">Reuniões agendadas com leads qualificados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Próximas Reuniões
          </h2>
          {upcoming.length === 0 ? (
            <div className="stat-card text-center py-8 text-muted-foreground text-sm">
              Nenhuma reunião agendada
            </div>
          ) : (
            upcoming.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center">
                      <span className="text-xs text-primary font-semibold">
                        {new Date(apt.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-primary uppercase">
                        {new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" /> {apt.leadName}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {apt.time}
                      </p>
                    </div>
                  </div>
                  {apt.confirmed ? (
                    <span className="flex items-center gap-1 text-xs text-primary font-medium bg-secondary px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Confirmada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-warning font-medium bg-amber-50 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Pendente
                    </span>
                  )}
                </div>
                {apt.notes && <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">{apt.notes}</p>}
              </motion.div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Horários Disponíveis
          </h2>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-4">Horários para agendamento esta semana:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Seg 09:00', 'Seg 14:00', 'Ter 10:00', 'Ter 15:00', 'Qua 09:00', 'Qua 14:00', 'Qui 10:00', 'Qui 16:00', 'Sex 09:00', 'Sex 11:00'].map(slot => (
                <button key={slot}
                  className="p-2.5 text-sm border rounded-lg hover:bg-secondary hover:border-primary/20 transition-colors text-center font-medium">
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
