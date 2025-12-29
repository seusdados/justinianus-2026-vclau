'use client';
// @ts-nocheck
// ============================================================================
// JUSTINIANUS.AI - useQualificacoes HOOK
// Hook para gerenciar qualificações de leads
// ============================================================================

import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { QualificacaoLead } from '@/types';

// ============================================================================
// Tipos
// ============================================================================

interface UseQualificacoesReturn {
  qualificacoes: QualificacaoLead[];
  loading: boolean;
  error: Error | null;
  buscarQualificacoes: () => Promise<void>;
  buscarQualificacaoPorLead: (leadId: string) => Promise<void>;
  decidirLead: (leadId: string, decisao: 'aceito' | 'recusado' | 'pendente', motivo?: string) => Promise<boolean>;
}

// ============================================================================
// useQualificacoes - Lista de qualificações
// ============================================================================

export function useQualificacoes(): UseQualificacoesReturn {
  const [qualificacoes, setQualificacoes] = useState<QualificacaoLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const buscarQualificacoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('qualificacoes_leads')
        .select('*')
        .order('criado_em', { ascending: false });

      if (fetchError) throw fetchError;

      // Converter snake_case para camelCase
      const mapped = (data || []).map(q => ({
        id: q.id,
        organizacaoId: q.organizacao_id,
        leadId: q.lead_id,
        classificacao: q.classificacao,
        nivelRisco: q.nivel_risco,
        areaJuridica: q.area_juridica || [],
        prazoCritico: q.prazo_critico,
        dataPrescricao: q.data_prescricao,
        alertaPrescricaoEnviado: q.alerta_prescricao_enviado,
        resumoExecutivo: q.resumo_executivo,
        fatosPrincipais: q.fatos_principais,
        estrategiaRecomendada: q.estrategia_recomendada,
        confiancaIa: q.confianca_ia,
        idExecucaoIa: q.id_execucao_ia,
        pontuacaoFundamentacao: q.pontuacao_fundamentacao,
        pontuacaoConsistencia: q.pontuacao_consistencia,
        decisao: q.decisao,
        motivoRecusa: q.motivo_recusa,
        validadoPor: q.validado_por,
        validadoEm: q.validado_em,
        criadoEm: q.criado_em,
      })) as QualificacaoLead[];

      setQualificacoes(mapped);
    } catch (err) {
      console.error('Erro ao buscar qualificações:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const buscarQualificacaoPorLead = useCallback(async (leadId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('qualificacoes_leads')
        .select('*')
        .eq('lead_id', leadId)
        .order('criado_em', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const q = data[0];
        const mapped: QualificacaoLead = {
          id: q.id,
          organizacaoId: q.organizacao_id,
          leadId: q.lead_id,
          classificacao: q.classificacao,
          nivelRisco: q.nivel_risco,
          areaJuridica: q.area_juridica || [],
          prazoCritico: q.prazo_critico,
          dataPrescricao: q.data_prescricao,
          alertaPrescricaoEnviado: q.alerta_prescricao_enviado,
          resumoExecutivo: q.resumo_executivo,
          fatosPrincipais: q.fatos_principais,
          estrategiaRecomendada: q.estrategia_recomendada,
          confiancaIa: q.confianca_ia,
          idExecucaoIa: q.id_execucao_ia,
          pontuacaoFundamentacao: q.pontuacao_fundamentacao,
          pontuacaoConsistencia: q.pontuacao_consistencia,
          decisao: q.decisao,
          motivoRecusa: q.motivo_recusa,
          validadoPor: q.validado_por,
          validadoEm: q.validado_em,
          criadoEm: q.criado_em,
        };

        setQualificacoes(prev => {
          const existing = prev.findIndex(x => x.id === mapped.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = mapped;
            return updated;
          }
          return [...prev, mapped];
        });
      }
    } catch (err) {
      console.error('Erro ao buscar qualificação do lead:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const decidirLead = useCallback(async (
    leadId: string, 
    decisao: 'aceito' | 'recusado' | 'pendente',
    motivo?: string
  ): Promise<boolean> => {
    try {
      // Atualizar qualificação
      const { error: qualError } = await supabase
        .from('qualificacoes_leads')
        .update({
          decisao,
          motivo_recusa: decisao === 'recusado' ? motivo : null,
          validado_em: new Date().toISOString(),
        })
        .eq('lead_id', leadId);

      if (qualError) throw qualError;

      // Atualizar status do lead
      const novoStatus = decisao === 'aceito' ? 'aceito' : 
                         decisao === 'recusado' ? 'recusado' : 
                         'em_analise';

      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: novoStatus })
        .eq('id', leadId);

      if (leadError) throw leadError;

      // Atualizar estado local
      setQualificacoes(prev => prev.map(q => 
        q.leadId === leadId 
          ? { ...q, decisao, motivoRecusa: motivo }
          : q
      ));

      return true;
    } catch (err) {
      console.error('Erro ao decidir lead:', err);
      return false;
    }
  }, [supabase]);

  return {
    qualificacoes,
    loading,
    error,
    buscarQualificacoes,
    buscarQualificacaoPorLead,
    decidirLead,
  };
}
