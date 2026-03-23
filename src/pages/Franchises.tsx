import { useCRM } from '@/contexts/CRMContext';
import { motion } from 'framer-motion';
import { Building2, DollarSign, Target, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function Franchises() {
  const { franchises } = useCRM();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Franquias</h1>
        <p className="text-muted-foreground text-sm">Gerencie sua base de franquias</p>
      </div>

      {franchises.map((franchise, i) => (
        <motion.div key={franchise.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }} className="stat-card space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">{franchise.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">{franchise.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Investimento</span>
              </div>
              <p className="text-lg font-display font-bold text-primary">{franchise.investment}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Retorno Esperado</span>
              </div>
              <p className="text-sm">{franchise.expectedReturn}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Público-Alvo</span>
              </div>
              <p className="text-sm">{franchise.targetAudience}</p>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-3">Diferenciais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {franchise.differentials.map((d, j) => (
                <div key={j} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-3">Perguntas Frequentes</h3>
            <div className="space-y-2">
              {franchise.faq.map((item, j) => (
                <div key={j} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === `${franchise.id}-${j}` ? null : `${franchise.id}-${j}`)}
                    className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    {item.question}
                    {expandedFaq === `${franchise.id}-${j}` ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedFaq === `${franchise.id}-${j}` && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-3 pb-3 text-sm text-muted-foreground">
                      {item.answer}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
