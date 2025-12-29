'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type QualificacaoLead = Database['public']['Tables']['qualificacoes_lead']['Row'];

interface UseLeadsOptions {
  organizacaoId?: string;
  status?: Lead['status'] | Lead['status'][];
  tipoServico?: Lead['tipo_servico'];
  limite?: number;
  ordenarPor?: keyof Lead;
  ordem?: 'asc' | 'desc';
}

interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  criar: (data: LeadInsert) => Promise<Lead | null>;
  atualizar: (id: string, data: LeadUpdate) => Promise<Lead | null>;
  deletar: (id: string) => Promise<boolean>;
}

export function useLeads(options: UseLeadsOptions = {}): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.tipoServico) {
        query = query.eq('tipo_servico', options.tipoServico);
      }

      if (options.limite) {
        query = query.limit(options.limite);
      }

      if (options.ordenarPor) {
        query = query.order(options.ordenarPor, { 
          ascending: options.ordem === 'asc' 
        });
      } else {
        query = query.order('criado_em', { ascending: false });
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setLeads(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar leads'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const criar = useCallback(async (data: LeadInsert): Promise<Lead | null> => {
    try {
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualiza a lista local
      setLeads(prev => [newLead, ...prev]);
      setTotal(prev => prev + 1);

      return newLead;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar lead'));
      return null;
    }
  }, [supabase]);

  const atualizar = useCallback(async (id: string, data: LeadUpdate): Promise<Lead | null> => {
    try {
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualiza a lista local
      setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));

      return updatedLead;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar lead'));
      return null;
    }
  }, [supabase]);

  const deletar = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Remove da lista local
      setLeads(prev => prev.filter(l => l.id !== id));
      setTotal(prev => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao deletar lead'));
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    total,
    refetch: fetchLeads,
    criar,
    atualizar,
    deletar,
  };
}

// Hook para buscar um lead específico com qualificação
interface UseLeadReturn {
  lead: Lead | null;
  qualificacao: QualificacaoLead | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLead(id: string): UseLeadReturn {
  const [lead, setLead] = useState<Lead | null>(null);
  const [qualificacao, setQualificacao] = useState<QualificacaoLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchLead = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Busca o lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadError) throw leadError;

      setLead(leadData);

      // Busca a qualificação se existir
      const { data: qualData } = await supabase
        .from('qualificacoes_lead')
        .select('*')
        .eq('lead_id', id)
        .single();

      setQualificacao(qualData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar lead'));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  return {
    lead,
    qualificacao,
    loading,
    error,
    refetch: fetchLead,
  };
}

// Hook para contadores de leads por status
interface LeadsCounters {
  novo: number;
  em_analise: number;
  qualificado: number;
  recusado: number;
  convertido: number;
  total: number;
}

export function useLeadsCounters(organizacaoId?: string): {
  counters: LeadsCounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<LeadsCounters>({
    novo: 0,
    em_analise: 0,
    qualificado: 0,
    recusado: 0,
    convertido: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        let query = supabase
          .from('leads')
          .select('status', { count: 'exact' });

        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        const { data, count } = await query;

        if (data) {
          const counts = data.reduce((acc, lead) => {
            acc[lead.status as keyof Omit<LeadsCounters, 'total'>] = 
              (acc[lead.status as keyof Omit<LeadsCounters, 'total'>] || 0) + 1;
            return acc;
          }, {} as Partial<LeadsCounters>);

          setCounters({
            novo: counts.novo || 0,
            em_analise: counts.em_analise || 0,
            qualificado: counts.qualificado || 0,
            recusado: counts.recusado || 0,
            convertido: counts.convertido || 0,
            total: count || 0,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar contadores:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounters();
  }, [organizacaoId, supabase]);

  return { counters, loading };
}
