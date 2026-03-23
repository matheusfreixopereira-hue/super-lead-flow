import { useCRM } from '@/contexts/CRMContext';
import { PIPELINE_STAGES, PipelineStage, STAGE_LABELS } from '@/types/crm';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pipeline() {
  const { leads, moveLead } = useCRM();
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (stage: PipelineStage) => {
    if (draggedId) {
      moveLead(draggedId, stage);
      setDraggedId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Pipeline de Vendas</h1>
        <p className="text-muted-foreground text-sm">Arraste os leads entre as etapas</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.key);
          return (
            <div
              key={stage.key}
              className="pipeline-column flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-semibold">{stage.label}</span>
                </div>
                <span className="text-xs bg-card px-2 py-0.5 rounded-full font-medium border">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {stageLeads.map(lead => (
                  <motion.div
                    key={lead.id}
                    layout
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="lead-card"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{lead.name}</p>
                      <span className={`tag-${lead.temperature === 'hot' ? 'hot' : lead.temperature === 'warm' ? 'warm' : 'cold'}`}>
                        {lead.temperature === 'hot' ? '🔥' : lead.temperature === 'warm' ? '🌤️' : '❄️'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{lead.franchise}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{lead.source}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-xs font-medium">{lead.score}</span>
                      </div>
                    </div>
                    {lead.isAIControlled && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
                        IA ativa
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
