'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getUntypedSupabaseClient } from '@/lib/supabase/client';

// Tipos locais (serão substituídos por tipos gerados após migration)
interface Acao {
  id: string;
  organizacao_id: string;
  tipo_entidade: string;
  id_entidade: string;
  tipo_acao: string;
  parametros_acao: Record<string, unknown>;
  origem: 'manual' | 'playbook' | 'sugerida_por_ia' | 'automacao' | null;
  id_sugestao_origem: string | null;
  id_playbook_origem: string | null;
  status: 'proposta' | 'em_aprovacao' | 'aprovada' | 'executando' | 'executada' | 'concluida' | 'rejeitada' | 'falhou';
  aprovada_por: string | null;
  aprovada_em: string | null;
  rejeitada_em: string | null;
  motivo_rejeicao: string | null;
  executada_em: string | null;
  resultado_execucao: Record<string, unknown> | null;
  erro_execucao: string | null;
  criado_por: string | null;
  criado_em: string;
}

type AcaoInsert = Partial<Acao> & { 
  tipo_entidade: string; 
  id_entidade: string; 
  tipo_acao: string; 
};

type AcaoUpdate = Partial<Acao>;

// ============================================================================
// Tipos de Ações disponíveis
// ============================================================================

export const TIPOS_ACAO = [
  // Documentais
  { value: 'gerar_minuta', label: 'Gerar Minuta', categoria: 'documental' },
  { value: 'protocolar', label: 'Protocolar', categoria: 'documental' },
  { value: 'enviar_documento', label: 'Enviar Documento', categoria: 'documental' },
  { value: 'solicitar_documento', label: 'Solicitar Documento', categoria: 'documental' },
  
  // Comunicação
  { value: 'notificar_cliente', label: 'Notificar Cliente', categoria: 'comunicacao' },
  { value: 'enviar_email', label: 'Enviar E-mail', categoria: 'comunicacao' },
  { value: 'agendar_reuniao', label: 'Agendar Reunião', categoria: 'comunicacao' },
  { value: 'ligar_cliente', label: 'Ligar para Cliente', categoria: 'comunicacao' },
  
  // Tarefas
  { value: 'criar_tarefa', label: 'Criar Tarefa', categoria: 'tarefa' },
  { value: 'atribuir_responsavel', label: 'Atribuir Responsável', categoria: 'tarefa' },
  { value: 'definir_prazo', label: 'Definir Prazo', categoria: 'tarefa' },
  
  // Processuais
  { value: 'interpor_recurso', label: 'Interpor Recurso', categoria: 'processual' },
  { value: 'pedir_tutela', label: 'Pedir Tutela', categoria: 'processual' },
  { value: 'propor_acordo', label: 'Propor Acordo', categoria: 'processual' },
  { value: 'requerer_audiencia', label: 'Requerer Audiência', categoria: 'processual' },
  
  // Estratégicas
  { value: 'mudar_estrategia', label: 'Mudar Estratégia', categoria: 'estrategica' },
  { value: 'escalar_caso', label: 'Escalar Caso', categoria: 'estrategica' },
  { value: 'arquivar_caso', label: 'Arquivar Caso', categoria: 'estrategica' },
] as const;

export const STATUS_ACAO = [
  { value: 'proposta', label: 'Proposta', cor: 'gray', icone: 'lightbulb' },
  { value: 'em_aprovacao', label: 'Em Aprovação', cor: 'yellow', icone: 'clock' },
  { value: 'aprovada', label: 'Aprovada', cor: 'blue', icone: 'check' },
  { value: 'executada', label: 'Executada', cor: 'green', icone: 'check-circle' },
  { value: 'cancelada', label: 'Cancelada', cor: 'gray', icone: 'x' },
  { value: 'rejeitada', label: 'Rejeitada', cor: 'red', icone: 'x-circle' },
] as const;

export const ORIGENS_ACAO = [
  { value: 'manual', label: 'Manual' },
  { value: 'sugerida_por_ia', label: 'Sugerida por IA' },
  { value: 'playbook', label: 'Playbook' },
  { value: 'automacao', label: 'Automação' },
] as const;

export type TipoAcao = typeof TIPOS_ACAO[number]['value'];
export type StatusAcao = typeof STATUS_ACAO[number]['value'];
export type OrigemAcao = typeof ORIGENS_ACAO[number]['value'];

// ============================================================================
// useAcoes - Lista de ações com filtros
// ============================================================================

interface UseAcoesOptions {
  organizacaoId?: string;
  tipoEntidade?: string;
  idEntidade?: string;
  tipoAcao?: TipoAcao | TipoAcao[];
  status?: StatusAcao | StatusAcao[];
  origem?: OrigemAcao | OrigemAcao[];
  requerAprovacao?: boolean;
  limite?: number;
  ordenarPor?: keyof Acao;
  ordem?: 'asc' | 'desc';
}

interface UseAcoesReturn {
  acoes: any[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  criar: (data: AcaoInsert) => Promise<any | null>;
  aprovar: (id: string, notas?: string) => Promise<boolean>;
  rejeitar: (id: string, motivo: string) => Promise<boolean>;
  executar: (id: string, resultado?: Record<string, unknown>) => Promise<boolean>;
  cancelar: (id: string) => Promise<boolean>;
}

export function useAcoes(options: UseAcoesOptions = {}): UseAcoesReturn {
  const [acoes, setAcoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getUntypedSupabaseClient();

  const fetchAcoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('acoes')
        .select('*', { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.tipoEntidade) {
        query = query.eq('tipo_entidade', options.tipoEntidade);
      }

      if (options.idEntidade) {
        query = query.eq('id_entidade', options.idEntidade);
      }

      if (options.tipoAcao) {
        if (Array.isArray(options.tipoAcao)) {
          query = query.in('tipo_acao', options.tipoAcao);
        } else {
          query = query.eq('tipo_acao', options.tipoAcao);
        }
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.origem) {
        if (Array.isArray(options.origem)) {
          query = query.in('origem', options.origem);
        } else {
          query = query.eq('origem', options.origem);
        }
      }

      if (options.requerAprovacao !== undefined) {
        query = query.eq('requer_aprovacao', options.requerAprovacao);
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

      setAcoes(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar ações'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const criar = useCallback(async (data: AcaoInsert): Promise<Acao | null> => {
    try {
      const { data: newAcao, error: insertError } = await supabase
        .from('acoes')
        .insert(data as any)
        .select()
        .single();

      if (insertError) throw insertError;

      setAcoes(prev => [newAcao, ...prev]);
      setTotal(prev => prev + 1);

      return newAcao;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar ação'));
      return null;
    }
  }, [supabase]);

  const aprovar = useCallback(async (id: string, notas?: string): Promise<boolean> => {
    try {
      const { error: updateError } = await (supabase
        .from('acoes') as any)
        .update({
          status: 'aprovada',
          aprovada_em: new Date().toISOString(),
          notas_aprovacao: notas,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setAcoes(prev => prev.map(a => a.id === id ? {
        ...a,
        status: 'aprovada',
        aprovada_em: new Date().toISOString(),
        notas_aprovacao: notas || null,
      } : a) as any);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao aprovar ação'));
      return false;
    }
  }, [supabase]);

  const rejeitar = useCallback(async (id: string, motivo: string): Promise<boolean> => {
    try {
      const { error: updateError } = await (supabase
        .from('acoes')
        .update({
          status: 'rejeitada',
          rejeitada_em: new Date().toISOString(),
          motivo_rejeicao: motivo,
        })
        .eq('id', id) as any);

      if (updateError) throw updateError;

      setAcoes(prev => prev.map(a => a.id === id ? {
        ...a,
        status: 'rejeitada',
        rejeitada_em: new Date().toISOString(),
        motivo_rejeicao: motivo,
      } : a));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao rejeitar ação'));
      return false;
    }
  }, [supabase]);

  const executar = useCallback(async (
    id: string,
    resultado?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('acoes')
        .update({
          status: 'executada',
          executada_em: new Date().toISOString(),
          resultado_execucao: resultado,
        } as any)
        .eq('id', id);

      if (updateError) throw updateError;

      setAcoes(prev => prev.map(a => a.id === id ? {
        ...a,
        status: 'executada',
        executada_em: new Date().toISOString(),
        resultado_execucao: resultado,
      } : a));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao executar ação'));
      return false;
    }
  }, [supabase]);

  const cancelar = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('acoes')
        .update({ status: 'cancelada' } as any)
        .eq('id', id);

      if (updateError) throw updateError;

      setAcoes(prev => prev.map(a => a.id === id ? {
        ...a,
        status: 'cancelada',
      } : a));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao cancelar ação'));
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchAcoes();
  }, [fetchAcoes]);

  return {
    acoes,
    loading,
    error,
    total,
    refetch: fetchAcoes,
    criar,
    aprovar,
    rejeitar,
    executar,
    cancelar,
  };
}

// ============================================================================
// useAcoesPendentes - Ações pendentes de aprovação
// ============================================================================

interface UseAcoesPendentesReturn {
  acoes: Acao[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  aprovarTodas: () => Promise<number>;
}

export function useAcoesPendentes(organizacaoId?: string): UseAcoesPendentesReturn {
  const [acoes, setAcoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getUntypedSupabaseClient();

  const fetchAcoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('acoes')
        .select('*', { count: 'exact' })
        .in('status', ['proposta', 'em_aprovacao'])
        .eq('requer_aprovacao', true)
        .order('criado_em', { ascending: true });

      if (organizacaoId) {
        query = query.eq('organizacao_id', organizacaoId);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setAcoes(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar ações pendentes'));
    } finally {
      setLoading(false);
    }
  }, [organizacaoId, supabase]);

  const aprovarTodas = useCallback(async (): Promise<number> => {
    try {
      const ids = acoes.map(a => a.id);
      
      const { error: updateError } = await supabase
        .from('acoes')
        .update({
          status: 'aprovada',
          aprovada_em: new Date().toISOString(),
        } as any)
        .in('id', ids);

      if (updateError) throw updateError;

      setAcoes([]);
      setTotal(0);

      return ids.length;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao aprovar ações'));
      return 0;
    }
  }, [acoes, supabase]);

  useEffect(() => {
    fetchAcoes();
  }, [fetchAcoes]);

  return {
    acoes,
    loading,
    error,
    total,
    refetch: fetchAcoes,
    aprovarTodas,
  };
}

// ============================================================================
// useAcoesCounters - Contadores de ações
// ============================================================================

interface AcoesCounters {
  total: number;
  porStatus: {
    proposta: number;
    em_aprovacao: number;
    aprovada: number;
    executada: number;
    cancelada: number;
    rejeitada: number;
  };
  pendentes: number;
  taxaAprovacao: number;
  taxaExecucao: number;
}

export function useAcoesCounters(organizacaoId?: string): {
  counters: AcoesCounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<AcoesCounters>({
    total: 0,
    porStatus: {
      proposta: 0,
      em_aprovacao: 0,
      aprovada: 0,
      executada: 0,
      cancelada: 0,
      rejeitada: 0,
    },
    pendentes: 0,
    taxaAprovacao: 0,
    taxaExecucao: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getUntypedSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        let query = supabase.from('acoes').select('status');
        
        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        const { data } = await query;

        if (data) {
          const result: AcoesCounters = {
            total: data.length,
            porStatus: {
              proposta: 0,
              em_aprovacao: 0,
              aprovada: 0,
              executada: 0,
              cancelada: 0,
              rejeitada: 0,
            },
            pendentes: 0,
            taxaAprovacao: 0,
            taxaExecucao: 0,
          };

          data.forEach(a => {
            result.porStatus[a.status as StatusAcao]++;
          });

          result.pendentes = result.porStatus.proposta + result.porStatus.em_aprovacao;

          const totalDecididas = result.porStatus.aprovada + 
            result.porStatus.executada + 
            result.porStatus.rejeitada;

          if (totalDecididas > 0) {
            result.taxaAprovacao = (result.porStatus.aprovada + result.porStatus.executada) / totalDecididas;
          }

          const totalAprovadas = result.porStatus.aprovada + result.porStatus.executada;
          if (totalAprovadas > 0) {
            result.taxaExecucao = result.porStatus.executada / totalAprovadas;
          }

          setCounters(result);
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

// ============================================================================
// useAcoesEntidade - Ações de uma entidade específica (caso, lead, etc.)
// ============================================================================

export function useAcoesEntidade(
  tipoEntidade: string,
  idEntidade: string
): {
  acoes: Acao[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { acoes, loading, error, refetch } = useAcoes({
    tipoEntidade,
    idEntidade,
  });

  return { acoes, loading, error, refetch };
}

// ============================================================================
// Helper: Criar ação a partir de sugestão IA
// ============================================================================

export async function criarAcaoDesugestaoIA(
  supabase: ReturnType<typeof getUntypedSupabaseClient>,
  sugestaoId: string,
  dadosAcao: Omit<AcaoInsert, 'id_sugestao_ia' | 'origem'>
): Promise<Acao | null> {
  try {
    const { data: newAcao, error: insertError } = await supabase
      .from('acoes')
      .insert({
        ...dadosAcao,
        id_sugestao_ia: sugestaoId,
        origem: 'sugerida_por_ia',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Atualiza status da sugestão para 'aceita'
    await supabase
      .from('sugestoes_ia')
      .update({
        status: 'aceita',
        acionada_em: new Date().toISOString(),
      } as any)
      .eq('id', sugestaoId);

    return newAcao;
  } catch (err) {
    console.error('Erro ao criar ação de sugestão:', err);
    return null;
  }
}
