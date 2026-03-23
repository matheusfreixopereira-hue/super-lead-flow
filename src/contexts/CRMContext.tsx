import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Lead, Franchise, Appointment, PipelineStage, ChatMessage } from '@/types/crm';
import { sampleLeads, franchises as initialFranchises, sampleAppointments } from '@/data/sampleData';

interface CRMContextType {
  leads: Lead[];
  franchises: Franchise[];
  appointments: Appointment[];
  updateLead: (id: string, updates: Partial<Lead>) => void;
  addLead: (lead: Lead) => void;
  moveLead: (id: string, stage: PipelineStage) => void;
  addMessage: (leadId: string, message: ChatMessage) => void;
  toggleAIControl: (leadId: string) => void;
  addAppointment: (apt: Appointment) => void;
  getLeadsByStage: (stage: PipelineStage) => Lead[];
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [franchisesState] = useState<Franchise[]>(initialFranchises);
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l));
  }, []);

  const addLead = useCallback((lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
  }, []);

  const moveLead = useCallback((id: string, stage: PipelineStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage, updatedAt: new Date() } : l));
  }, []);

  const addMessage = useCallback((leadId: string, message: ChatMessage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, messages: [...l.messages, message], updatedAt: new Date() } : l));
  }, []);

  const toggleAIControl = useCallback((leadId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, isAIControlled: !l.isAIControlled, updatedAt: new Date() } : l));
  }, []);

  const addAppointment = useCallback((apt: Appointment) => {
    setAppointments(prev => [...prev, apt]);
  }, []);

  const getLeadsByStage = useCallback((stage: PipelineStage) => {
    return leads.filter(l => l.stage === stage);
  }, [leads]);

  return (
    <CRMContext.Provider value={{
      leads, franchises: franchisesState, appointments,
      updateLead, addLead, moveLead, addMessage, toggleAIControl,
      addAppointment, getLeadsByStage, selectedLead, setSelectedLead,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}
