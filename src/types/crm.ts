export type LeadTemperature = 'hot' | 'warm' | 'cold';

export type PipelineStage = 
  | 'new'
  | 'attending'
  | 'qualified'
  | 'meeting'
  | 'negotiating'
  | 'closed'
  | 'lost';

export type BANTStatus = 'pending' | 'qualified' | 'not_qualified' | 'nurturing';

export interface BANTData {
  budget: string | null;
  authority: string | null;
  need: string | null;
  timing: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'human' | 'lead';
  content: string;
  timestamp: Date;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  franchise: string;
  stage: PipelineStage;
  temperature: LeadTemperature;
  score: number;
  bant: BANTData;
  bantStatus: BANTStatus;
  messages: ChatMessage[];
  isAIControlled: boolean;
  createdAt: Date;
  updatedAt: Date;
  meetingDate?: Date;
  notes?: string;
}

export interface Franchise {
  id: string;
  name: string;
  description: string;
  investment: string;
  expectedReturn: string;
  differentials: string[];
  targetAudience: string;
  faq: { question: string; answer: string }[];
  active: boolean;
}

export interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  date: Date;
  time: string;
  confirmed: boolean;
  notes: string;
}

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'new', label: 'Novo Lead', color: 'bg-info' },
  { key: 'attending', label: 'Em Atendimento (IA)', color: 'bg-warning' },
  { key: 'qualified', label: 'Qualificado (BANT)', color: 'bg-success' },
  { key: 'meeting', label: 'Reunião Agendada', color: 'bg-purple-500' },
  { key: 'negotiating', label: 'Em Negociação', color: 'bg-orange-500' },
  { key: 'closed', label: 'Fechado ✅', color: 'bg-primary' },
  { key: 'lost', label: 'Perdido', color: 'bg-destructive' },
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'Novo Lead',
  attending: 'Em Atendimento (IA)',
  qualified: 'Qualificado (BANT)',
  meeting: 'Reunião Agendada',
  negotiating: 'Em Negociação',
  closed: 'Fechado',
  lost: 'Perdido',
};
