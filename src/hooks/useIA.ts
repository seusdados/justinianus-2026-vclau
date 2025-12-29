'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type ExecucaoAgente = Database['public']['Tables']['execucoes_agente']['Row'];
type SugestaoIA = Database['public']['Tables']['sugestoes_ia']['Row'];
type SugestaoIAUpdate = Database['public']['Tables']['sugestoes_ia']['Update'];

// ============================================================================
// Tipos de Agentes disponíveis
// ============================================================================

export const TIPOS_AGENTE = [
  // Operacionais
  { value: 'processador_docs', label: 'Processador de Documentos', categoria: 'operacional' },
  { value: 'extrator_entidades', label: 'Extrator de Entidades', categoria: 'operacional' },
  { value: 'classificador', label: 'Classificador', categoria: 'operacional' },
  { value: 'avaliador_risco', label: 'Avaliador de Risco', categoria: 'operacional' },
  { value: 'gerador_minuta', label: 'Gerador de Minutas', categoria: 'operacional' },
  { value: 'construtor_timeline', label: 'Construtor de Timeline', categoria: 'operacional' },
  { value: 'mapeador_evidencias', label: 'Mapeador de Evidências', categoria: 'operacional' },
  
  // Estratégicos
  { value: 'perfilador_juiz', label: 'Perfilador de Juiz', categoria: 'estrategico' },
  { value: 'analisador_painel', label: 'Analisador de Painel', categoria: 'estrategico' },
  { value: 'scanner_oponente', label: 'Scanner de Oponente', categoria: 'estrategico' },
  { value: 'otimizador_timing', label: 'Otimizador de Timing', categoria: 'estrategico' },
  { value: 'preditor_acordo', label: 'Preditor de Acordo', categoria: 'estrategico' },
  { value: 'detector_fraquezas', label: 'Detector de Fraquezas', categoria: 'estrategico' },
  { value: 'avaliador_urgencia', label: 'Avaliador de Urgência', categoria: 'estrategico' },
  { value: 'preditor_resultado', label: 'Preditor de Resultado', categoria: 'estrategico' },
  
  // Relacionais
  { value: 'copiloto_consulta', label: 'Copiloto de Consulta', categoria: 'relacional' },
  { value: 'agente_conciliacao', label: 'Agente de Conciliação', categoria: 'relacional' },
  { value: 'agente_instrucao', label: 'Agente de Instrução', categoria: 'relacional' },
  { value: 'assistente_depoimento', label: 'Assistente de Depoimento', categoria: 'relacional' },
  { value: 'comunicador_cliente', label: 'Comunicador com Cliente', categoria: 'relacional' },
  { value: 'sumarizador_reuniao', label: 'Sumarizador de Reunião', categoria: 'relacional' },
] as const;

export const NIVEIS_AUTONOMIA = [
  { value: 'A0', label: 'Manual', descricao: 'Apenas sob demanda explícita' },
  { value: 'A1', label: 'Sugestivo', descricao: 'Propõe, mas não executa' },
  { value: 'A2', label: 'Semi-autônomo', descricao: 'Executa com confirmação' },
  { value: 'A3', label: 'Autônomo', descricao: 'Executa automaticamente' },
] as const;

export const STATUS_EXECUCAO = [
  { value: 'na_fila', label: 'Na Fila', cor: 'gray' },
  { value: 'executando', label: 'Executando', cor: 'blue' },
  { value: 'concluido', label: 'Concluído', cor: 'green' },
  { value: 'falhou', label: 'Falhou', cor: 'red' },
  { value: 'cancelado', label: 'Cancelado', cor: 'yellow' },
] as const;

export type TipoAgente = typeof TIPOS_AGENTE[number]['value'];
export type NivelAutonomia = typeof NIVEIS_AUTONOMIA[number]['value'];
export type StatusExecucao = typeof STATUS_EXECUCAO[number]['value'];

// ============================================================================
// useExecucoesIA - Lista de execuções de agentes
// ============================================================================

interface UseExecucoesIAOptions {
  organizacaoId?: string;
  tipoAgente?: TipoAgente | TipoAgente[];
  status?: StatusExecucao | StatusExecucao[];
  tipoEntidadeGatilho?: string;
  idEntidadeGatilho?: string;
  limite?: number;
  ordenarPor?: keyof ExecucaoAgente;
  ordem?: 'asc' | 'desc';
}

interface UseExecucoesIAReturn {
  execucoes: ExecucaoAgente[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
}

export function useExecucoesIA(options: UseExecucoesIAOptions = {}): UseExecucoesIAReturn {
  const [execucoes, setExecucoes] = useState<ExecucaoAgente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchExecucoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('execucoes_agente')
        .select('*', { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.tipoAgente) {
        if (Array.isArray(options.tipoAgente)) {
          query = query.in('tipo_agente', options.tipoAgente);
        } else {
          query = query.eq('tipo_agente', options.tipoAgente);
        }
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.tipoEntidadeGatilho) {
        query = query.eq('tipo_entidade_gatilho', options.tipoEntidadeGatilho);
      }

      if (options.idEntidadeGatilho) {
        query = query.eq('id_entidade_gatilho', options.idEntidadeGatilho);
      }

      if (options.limite) {
        query = query.limit(options.limite);
      }

      if (options.ordenarPor) {
        query = query.order(options.ordenarPor, {
          ascending: options.ordem === 'asc',
        });
      } else {
        query = query.order('criado_em', { ascending: false });
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setExecucoes(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar execuções'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  useEffect(() => {
    fetchExecucoes();
  }, [fetchExecucoes]);

  return {
    execucoes,
    loading,
    error,
    total,
    refetch: fetchExecucoes,
  };
}

// ============================================================================
// useExecucaoIA - Execução individual com sugestões
// ============================================================================

interface ExecucaoComSugestoes extends ExecucaoAgente {
  sugestoes?: SugestaoIA[];
}

interface UseExecucaoIAReturn {
  execucao: ExecucaoComSugestoes | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  darFeedback: (feedback: 'aceito' | 'modificado' | 'rejeitado', notas?: string) => Promise<boolean>;
}

export function useExecucaoIA(id: string): UseExecucaoIAReturn {
  const [execucao, setExecucao] = useState<ExecucaoComSugestoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchExecucao = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar execução
      const { data: execucaoData, error: execucaoError } = await supabase
        .from('execucoes_agente')
        .select('*')
        .eq('id', id)
        .single();

      if (execucaoError) throw execucaoError;

      // Buscar sugestões
      const { data: sugestoesData } = await supabase
        .from('sugestoes_ia')
        .select('*')
        .eq('id_execucao_ia', id)
        .order('criado_em', { ascending: true });

      setExecucao({
        ...execucaoData,
        sugestoes: sugestoesData || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar execução'));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const darFeedback = useCallback(async (
    feedback: 'aceito' | 'modificado' | 'rejeitado',
    notas?: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('execucoes_agente')
        .update({
          feedback_humano: feedback,
          feedback_humano_em: new Date().toISOString(),
          notas_feedback_humano: notas,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Atualiza localmente
      setExecucao(prev => prev ? {
        ...prev,
        feedback_humano: feedback,
        feedback_humano_em: new Date().toISOString(),
        notas_feedback_humano: notas,
      } : null);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao dar feedback'));
      return false;
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchExecucao();
  }, [fetchExecucao]);

  return {
    execucao,
    loading,
    error,
    refetch: fetchExecucao,
    darFeedback,
  };
}

// ============================================================================
// useSugestoesIA - Lista de sugestões pendentes
// ============================================================================

interface UseSugestoesIAOptions {
  organizacaoId?: string;
  tipoSugestao?: string | string[];
  status?: SugestaoIA['status'] | SugestaoIA['status'][];
  confiancaMinima?: number;
  limite?: number;
}

interface UseSugestoesIAReturn {
  sugestoes: SugestaoIA[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  aceitar: (id: string, notas?: string) => Promise<boolean>;
  rejeitar: (id: string, notas?: string) => Promise<boolean>;
  modificar: (id: string, notas?: string) => Promise<boolean>;
}

export function useSugestoesIA(options: UseSugestoesIAOptions = {}): UseSugestoesIAReturn {
  const [sugestoes, setSugestoes] = useState<SugestaoIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchSugestoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sugestoes_ia')
        .select('*', { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.tipoSugestao) {
        if (Array.isArray(options.tipoSugestao)) {
          query = query.in('tipo_sugestao', options.tipoSugestao);
        } else {
          query = query.eq('tipo_sugestao', options.tipoSugestao);
        }
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.confiancaMinima !== undefined) {
        query = query.gte('confianca', options.confiancaMinima);
      }

      if (options.limite) {
        query = query.limit(options.limite);
      }

      query = query.order('criado_em', { ascending: false });

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setSugestoes(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar sugestões'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const atualizarStatus = useCallback(async (
    id: string,
    status: SugestaoIA['status'],
    notas?: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('sugestoes_ia')
        .update({
          status,
          acionada_em: new Date().toISOString(),
          notas_acao: notas,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Atualiza localmente
      setSugestoes(prev => prev.map(s => s.id === id ? {
        ...s,
        status,
        acionada_em: new Date().toISOString(),
        notas_acao: notas,
      } : s));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar sugestão'));
      return false;
    }
  }, [supabase]);

  const aceitar = useCallback(async (id: string, notas?: string) => {
    return atualizarStatus(id, 'aceita', notas);
  }, [atualizarStatus]);

  const rejeitar = useCallback(async (id: string, notas?: string) => {
    return atualizarStatus(id, 'rejeitada', notas);
  }, [atualizarStatus]);

  const modificar = useCallback(async (id: string, notas?: string) => {
    return atualizarStatus(id, 'modificada', notas);
  }, [atualizarStatus]);

  useEffect(() => {
    fetchSugestoes();
  }, [fetchSugestoes]);

  return {
    sugestoes,
    loading,
    error,
    total,
    refetch: fetchSugestoes,
    aceitar,
    rejeitar,
    modificar,
  };
}

// ============================================================================
// useIACounters - Contadores de execuções e sugestões
// ============================================================================

interface IACounters {
  execucoes: {
    total: number;
    emAndamento: number;
    concluidas: number;
    falhas: number;
  };
  sugestoes: {
    total: number;
    pendentes: number;
    aceitas: number;
    rejeitadas: number;
  };
  taxaAceitacao: number;
}

export function useIACounters(organizacaoId?: string): {
  counters: IACounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<IACounters>({
    execucoes: {
      total: 0,
      emAndamento: 0,
      concluidas: 0,
      falhas: 0,
    },
    sugestoes: {
      total: 0,
      pendentes: 0,
      aceitas: 0,
      rejeitadas: 0,
    },
    taxaAceitacao: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        // Buscar execuções
        let execQuery = supabase.from('execucoes_agente').select('status');
        if (organizacaoId) {
          execQuery = execQuery.eq('organizacao_id', organizacaoId);
        }
        const { data: execData } = await execQuery;

        // Buscar sugestões
        let sugQuery = supabase.from('sugestoes_ia').select('status');
        if (organizacaoId) {
          sugQuery = sugQuery.eq('organizacao_id', organizacaoId);
        }
        const { data: sugData } = await sugQuery;

        if (execData && sugData) {
          const execCounters = {
            total: execData.length,
            emAndamento: execData.filter(e => e.status === 'executando' || e.status === 'na_fila').length,
            concluidas: execData.filter(e => e.status === 'concluido').length,
            falhas: execData.filter(e => e.status === 'falhou').length,
          };

          const sugCounters = {
            total: sugData.length,
            pendentes: sugData.filter(s => s.status === 'pendente').length,
            aceitas: sugData.filter(s => s.status === 'aceita').length,
            rejeitadas: sugData.filter(s => s.status === 'rejeitada').length,
          };

          const totalDecididas = sugCounters.aceitas + sugCounters.rejeitadas;
          const taxaAceitacao = totalDecididas > 0 
            ? sugCounters.aceitas / totalDecididas 
            : 0;

          setCounters({
            execucoes: execCounters,
            sugestoes: sugCounters,
            taxaAceitacao,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar contadores IA:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounters();
  }, [organizacaoId, supabase]);

  return { counters, loading };
}

// ============================================================================
// useExecucoesRecentes - Últimas execuções com polling
// ============================================================================

export function useExecucoesRecentes(
  organizacaoId: string,
  limite: number = 10,
  pollingInterval: number = 5000
): {
  execucoes: ExecucaoAgente[];
  loading: boolean;
} {
  const [execucoes, setExecucoes] = useState<ExecucaoAgente[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchRecentes() {
      try {
        const { data } = await supabase
          .from('execucoes_agente')
          .select('*')
          .eq('organizacao_id', organizacaoId)
          .order('criado_em', { ascending: false })
          .limit(limite);

        if (isMounted && data) {
          setExecucoes(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar execuções recentes:', err);
      }
    }

    fetchRecentes();
    const interval = setInterval(fetchRecentes, pollingInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [organizacaoId, limite, pollingInterval, supabase]);

  return { execucoes, loading };
}
