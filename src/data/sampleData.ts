import { Lead, Franchise, Appointment, ChatMessage } from '@/types/crm';

const vinho24h: Franchise = {
  id: '1',
  name: 'Vinho 24h',
  description: 'A Vinho 24h é uma franquia inovadora de enotecas self-service que opera 24 horas por dia, 7 dias por semana. Com um modelo de negócio automatizado e escalável, oferece vinhos premium em máquinas de autoatendimento em locais estratégicos como condomínios, hotéis, aeroportos e centros comerciais.',
  investment: 'A partir de R$ 95.000,00',
  expectedReturn: 'Payback estimado entre 12 a 18 meses, com faturamento médio de R$ 25.000 a R$ 45.000/mês por unidade.',
  differentials: [
    'Operação 24 horas sem necessidade de funcionários',
    'Modelo self-service automatizado',
    'Baixo custo operacional',
    'Múltiplos pontos de venda por franqueado',
    'Suporte completo da franqueadora',
    'Tecnologia proprietária de dispensação',
    'Vinhos selecionados por sommeliers',
  ],
  targetAudience: 'Empreendedores que buscam um negócio com operação simplificada, investidores que desejam renda passiva, e pessoas apaixonadas pelo universo de vinhos que querem transformar sua paixão em negócio.',
  faq: [
    { question: 'Preciso ter experiência com vinhos?', answer: 'Não! A franqueadora oferece treinamento completo e todo o suporte necessário para a operação.' },
    { question: 'Quantas máquinas recebo?', answer: 'O modelo inicial inclui 2 máquinas de autoatendimento, podendo expandir conforme a demanda.' },
    { question: 'Qual o território de exclusividade?', answer: 'Cada franqueado recebe exclusividade territorial para instalação de suas máquinas.' },
    { question: 'Como funciona o abastecimento?', answer: 'A franqueadora fornece toda a logística de abastecimento com vinhos selecionados por sommeliers.' },
  ],
  active: true,
};

const sampleMessages: ChatMessage[] = [
  { id: '1', sender: 'ai', content: 'Olá! 👋 Sou a assistente da Super Franquias. Vi que você demonstrou interesse em franquias. Posso te ajudar a encontrar a oportunidade ideal! Como prefere que eu te chame?', timestamp: new Date(Date.now() - 3600000) },
  { id: '2', sender: 'lead', content: 'Oi! Pode me chamar de Carlos. Estou interessado na franquia Vinho 24h.', timestamp: new Date(Date.now() - 3500000) },
  { id: '3', sender: 'ai', content: 'Prazer, Carlos! 🍷 A Vinho 24h é uma das nossas franquias mais procuradas — opera 24h com modelo self-service. Pra eu entender melhor seu perfil, você já tem um valor de investimento em mente?', timestamp: new Date(Date.now() - 3400000) },
  { id: '4', sender: 'lead', content: 'Tenho cerca de R$ 120 mil disponíveis para investir.', timestamp: new Date(Date.now() - 3300000) },
  { id: '5', sender: 'ai', content: 'Ótimo, Carlos! Com R$ 120 mil você se encaixa perfeitamente no modelo da Vinho 24h, que começa em R$ 95 mil. E essa decisão seria só sua ou tem mais alguém envolvido?', timestamp: new Date(Date.now() - 3200000) },
];

const sampleLeads: Lead[] = [
  {
    id: '1', name: 'Carlos Silva', phone: '(11) 99876-5432', email: 'carlos@email.com',
    source: 'Instagram Ads', franchise: 'Vinho 24h', stage: 'attending', temperature: 'hot', score: 85,
    bant: { budget: 'R$ 120.000', authority: 'Decisor único', need: null, timing: null },
    bantStatus: 'pending', messages: sampleMessages, isAIControlled: true,
    createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(),
  },
  {
    id: '2', name: 'Ana Oliveira', phone: '(21) 98765-4321', email: 'ana@email.com',
    source: 'Google Ads', franchise: 'Vinho 24h', stage: 'qualified', temperature: 'hot', score: 92,
    bant: { budget: 'R$ 150.000', authority: 'Decisora com sócio', need: 'Renda passiva', timing: '30 dias' },
    bantStatus: 'qualified', messages: [], isAIControlled: false,
    createdAt: new Date(Date.now() - 172800000), updatedAt: new Date(),
  },
  {
    id: '3', name: 'Pedro Santos', phone: '(31) 97654-3210', email: 'pedro@email.com',
    source: 'Indicação', franchise: 'Vinho 24h', stage: 'new', temperature: 'warm', score: 45,
    bant: { budget: null, authority: null, need: null, timing: null },
    bantStatus: 'pending', messages: [], isAIControlled: true,
    createdAt: new Date(Date.now() - 43200000), updatedAt: new Date(),
  },
  {
    id: '4', name: 'Maria Costa', phone: '(41) 96543-2109', email: 'maria@email.com',
    source: 'Facebook Ads', franchise: 'Vinho 24h', stage: 'meeting', temperature: 'hot', score: 88,
    bant: { budget: 'R$ 100.000', authority: 'Decisora', need: 'Negócio próprio', timing: '15 dias' },
    bantStatus: 'qualified', messages: [], isAIControlled: false,
    createdAt: new Date(Date.now() - 259200000), updatedAt: new Date(),
    meetingDate: new Date(Date.now() + 86400000),
  },
  {
    id: '5', name: 'João Mendes', phone: '(51) 95432-1098', email: 'joao@email.com',
    source: 'Site', franchise: 'Vinho 24h', stage: 'negotiating', temperature: 'hot', score: 95,
    bant: { budget: 'R$ 200.000', authority: 'Decisor', need: 'Diversificação', timing: 'Imediato' },
    bantStatus: 'qualified', messages: [], isAIControlled: false,
    createdAt: new Date(Date.now() - 432000000), updatedAt: new Date(),
  },
  {
    id: '6', name: 'Fernanda Lima', phone: '(61) 94321-0987', email: 'fernanda@email.com',
    source: 'LinkedIn', franchise: 'Vinho 24h', stage: 'attending', temperature: 'warm', score: 60,
    bant: { budget: 'R$ 80.000', authority: null, need: null, timing: null },
    bantStatus: 'pending', messages: [], isAIControlled: true,
    createdAt: new Date(Date.now() - 100000000), updatedAt: new Date(),
  },
  {
    id: '7', name: 'Roberto Alves', phone: '(71) 93210-9876', email: 'roberto@email.com',
    source: 'Google Ads', franchise: 'Vinho 24h', stage: 'closed', temperature: 'hot', score: 100,
    bant: { budget: 'R$ 180.000', authority: 'Decisor', need: 'Investimento', timing: 'Imediato' },
    bantStatus: 'qualified', messages: [], isAIControlled: false,
    createdAt: new Date(Date.now() - 604800000), updatedAt: new Date(),
  },
  {
    id: '8', name: 'Luciana Rocha', phone: '(81) 92109-8765', email: 'luciana@email.com',
    source: 'Instagram Ads', franchise: 'Vinho 24h', stage: 'lost', temperature: 'cold', score: 20,
    bant: { budget: 'R$ 30.000', authority: 'Não decisora', need: 'Indefinido', timing: 'Indefinido' },
    bantStatus: 'not_qualified', messages: [], isAIControlled: false,
    createdAt: new Date(Date.now() - 500000000), updatedAt: new Date(),
  },
  {
    id: '9', name: 'Marcos Pereira', phone: '(91) 91098-7654', email: 'marcos@email.com',
    source: 'Evento', franchise: 'Vinho 24h', stage: 'new', temperature: 'cold', score: 30,
    bant: { budget: null, authority: null, need: null, timing: null },
    bantStatus: 'pending', messages: [], isAIControlled: true,
    createdAt: new Date(Date.now() - 36000000), updatedAt: new Date(),
  },
  {
    id: '10', name: 'Juliana Barbosa', phone: '(11) 90987-6543', email: 'juliana@email.com',
    source: 'Indicação', franchise: 'Vinho 24h', stage: 'attending', temperature: 'warm', score: 55,
    bant: { budget: null, authority: 'Decisora com marido', need: null, timing: null },
    bantStatus: 'pending', messages: [], isAIControlled: true,
    createdAt: new Date(Date.now() - 150000000), updatedAt: new Date(),
  },
];

const sampleAppointments: Appointment[] = [
  { id: '1', leadId: '4', leadName: 'Maria Costa', date: new Date(Date.now() + 86400000), time: '14:00', confirmed: true, notes: 'Apresentação completa da franquia Vinho 24h' },
  { id: '2', leadId: '5', leadName: 'João Mendes', date: new Date(Date.now() + 172800000), time: '10:00', confirmed: false, notes: 'Discussão sobre termos contratuais' },
];

export { vinho24h, sampleLeads, sampleAppointments };
export const franchises: Franchise[] = [vinho24h];
