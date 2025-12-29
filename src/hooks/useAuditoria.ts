'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type LogAuditoria = Database['public']['Tables']['logs_auditoria']['Row'];

// ============================================================================
// Categorias de Eventos
// ============================================================================

export const CATEGORIAS_EVENTO = [
  { value: 'autenticacao', label: 'Autenticação', icone: 'key' },
  { value: 'caso', label: 'Caso', icone: 'briefcase' },
  { value: 'lead', label: 'Lead', icone: 'user-plus' },
  { value: 'documento', label: 'Documento', icone: 'file' },
  { value: 'prazo', label: 'Prazo', icone: 'clock' },
  { value: 'tarefa', label: 'Tarefa', icone: 'check-square' },
  { value: 'ia', label: 'IA', icone: 'brain' },
  { value: 'acao', label: 'Ação', icone: 'zap' },
  { value: 'cliente', label: 'Cliente', icone: 'users' },
  { value: 'configuracao', label: 'Configuração', icone: 'settings' },
] as const;

export const TIPOS_ATOR = [
  { value: 'usuario', label: 'Usuário' },
  { value: 'agente', label: 'Agente IA' },
  { value: 'sistema', label: 'Sistema' },
] as const;

export type CategoriaEvento = typeof CATEGORIAS_EVENTO[number]['value'];
export type TipoAtor = typeof TIPOS_ATOR[number]['value'];

// ============================================================================
// useAuditoria - Lista de logs de auditoria
// ============================================================================

interface UseAuditoriaOptions {
  organizacaoId?: string;
  tipoAtor?: TipoAtor | TipoAtor[];
  categoriaEvento?: CategoriaEvento | CategoriaEvento[];
  tipoEntidade?: string;
  idEntidade?: string;
  idUsuarioAtor?: string;
  dataInicio?: Date;
  dataFim?: Date;
  limite?: number;
  offset?: number;
}

interface UseAuditoriaReturn {
  logs: LogAuditoria[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  carregarMais: () => Promise<void>;
  temMais: boolean;
}

export function useAuditoria(options: UseAuditoriaOptions = {}): UseAuditoriaReturn {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(options.offset || 0);

  const limite = options.limite || 50;
  const supabase = getSupabaseClient();

  const fetchLogs = useCallback(async (appendMode = false) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('logs_auditoria')
        .select('*', { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.tipoAtor) {
        if (Array.isArray(options.tipoAtor)) {
          query = query.in('tipo_ator', options.tipoAtor);
        } else {
          query = query.eq('tipo_ator', options.tipoAtor);
        }
      }

      if (options.categoriaEvento) {
        if (Array.isArray(options.categoriaEvento)) {
          query = query.in('categoria_evento', options.categoriaEvento);
        } else {
          query = query.eq('categoria_evento', options.categoriaEvento);
        }
      }

      if (options.tipoEntidade) {
        query = query.eq('tipo_entidade', options.tipoEntidade);
      }

      if (options.idEntidade) {
        query = query.eq('id_entidade', options.idEntidade);
      }

      if (options.idUsuarioAtor) {
        query = query.eq('actor_user_id', options.idUsuarioAtor);
      }

      if (options.dataInicio) {
        query = query.gte('criado_em', options.dataInicio.toISOString());
      }

      if (options.dataFim) {
        query = query.lte('criado_em', options.dataFim.toISOString());
      }

      // Paginação e ordenação
      query = query
        .order('criado_em', { ascending: false })
        .range(appendMode ? offset : 0, (appendMode ? offset : 0) + limite - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      if (appendMode) {
        setLogs(prev => [...prev, ...(data || [])]);
      } else {
        setLogs(data || []);
      }
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar logs'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options, offset, limite]);

  const carregarMais = useCallback(async () => {
    setOffset(prev => prev + limite);
    await fetchLogs(true);
  }, [fetchLogs, limite]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    total,
    refetch: () => fetchLogs(false),
    carregarMais,
    temMais: logs.length < total,
  };
}

// ============================================================================
// useAuditoriaEntidade - Logs de uma entidade específica
// ============================================================================

export function useAuditoriaEntidade(
  tipoEntidade: string,
  idEntidade: string
): {
  logs: LogAuditoria[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { logs, loading, error, refetch } = useAuditoria({
    tipoEntidade,
    idEntidade,
    limite: 100,
  });

  return { logs, loading, error, refetch };
}

// ============================================================================
// useAuditoriaRecente - Últimos logs da organização
// ============================================================================

export function useAuditoriaRecente(
  organizacaoId: string,
  limite: number = 20
): {
  logs: LogAuditoria[];
  loading: boolean;
} {
  const { logs, loading } = useAuditoria({
    organizacaoId,
    limite,
  });

  return { logs, loading };
}

// ============================================================================
// useAuditoriaStats - Estatísticas de auditoria
// ============================================================================

interface AuditoriaStats {
  total: number;
  porCategoria: Record<string, number>;
  porTipoAtor: {
    usuario: number;
    agente: number;
    sistema: number;
  };
  ultimasHoras: {
    hora1: number;
    hora6: number;
    hora24: number;
  };
}

export function useAuditoriaStats(organizacaoId?: string): {
  stats: AuditoriaStats;
  loading: boolean;
} {
  const [stats, setStats] = useState<AuditoriaStats>({
    total: 0,
    porCategoria: {},
    porTipoAtor: {
      usuario: 0,
      agente: 0,
      sistema: 0,
    },
    ultimasHoras: {
      hora1: 0,
      hora6: 0,
      hora24: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);

      try {
        const agora = new Date();
        const hora1 = new Date(agora.getTime() - 1 * 60 * 60 * 1000);
        const hora6 = new Date(agora.getTime() - 6 * 60 * 60 * 1000);
        const hora24 = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

        let query = supabase
          .from('logs_auditoria')
          .select('tipo_ator, categoria_evento, criado_em')
          .gte('criado_em', hora24.toISOString());

        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        const { data, count } = await query;

        if (data) {
          const result: AuditoriaStats = {
            total: count || data.length,
            porCategoria: {},
            porTipoAtor: {
              usuario: 0,
              agente: 0,
              sistema: 0,
            },
            ultimasHoras: {
              hora1: 0,
              hora6: 0,
              hora24: data.length,
            },
          };

          data.forEach(log => {
            // Por categoria
            if (log.categoria_evento) {
              result.porCategoria[log.categoria_evento] = 
                (result.porCategoria[log.categoria_evento] || 0) + 1;
            }

            // Por tipo de ator
            if (log.tipo_ator) {
              result.porTipoAtor[log.tipo_ator as TipoAtor]++;
            }

            // Por período
            const logDate = new Date(log.criado_em);
            if (logDate >= hora1) {
              result.ultimasHoras.hora1++;
            }
            if (logDate >= hora6) {
              result.ultimasHoras.hora6++;
            }
          });

          setStats(result);
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [organizacaoId, supabase]);

  return { stats, loading };
}

// ============================================================================
// Helper: Formatar log para exibição
// ============================================================================

export function formatarLog(log: LogAuditoria): {
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
} {
  const categoria = CATEGORIAS_EVENTO.find(c => c.value === log.categoria_evento);
  
  // Formatar título baseado no evento
  let titulo = log.evento;
  let descricao = '';
  let cor = '#6B7280'; // gray

  switch (log.tipo_ator) {
    case 'usuario':
      titulo = `Usuário: ${log.evento}`;
      cor = '#3B82F6'; // blue
      break;
    case 'agente':
      titulo = `IA: ${log.evento}`;
      cor = '#A855F7'; // purple
      break;
    case 'sistema':
      titulo = `Sistema: ${log.evento}`;
      cor = '#6B7280'; // gray
      break;
  }

  if (log.tipo_entidade && log.id_entidade) {
    descricao = `${log.tipo_entidade} #${log.id_entidade}`;
  }

  return {
    titulo,
    descricao,
    icone: categoria?.icone || 'activity',
    cor,
  };
}

// ============================================================================
// Helper: Registrar log de auditoria
// ============================================================================

export async function registrarAuditoria(
  supabase: ReturnType<typeof getSupabaseClient>,
  dados: {
    organizacaoId: string;
    evento: string;
    categoriaEvento?: string;
    tipoAtor: TipoAtor;
    idUsuarioAtor?: string;
    tipoAgenteAtor?: string;
    tipoEntidade?: string;
    idEntidade?: string;
    dadosAntes?: Record<string, unknown>;
    dadosDepois?: Record<string, unknown>;
    idExecucaoIA?: string;
    idAcao?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('logs_auditoria').insert({
      organizacao_id: dados.organizacaoId,
      evento: dados.evento,
      categoria_evento: dados.categoriaEvento,
      tipo_ator: dados.tipoAtor,
      actor_user_id: dados.idUsuarioAtor,
      tipo_agente_ator: dados.tipoAgenteAtor,
      tipo_entidade: dados.tipoEntidade,
      id_entidade: dados.idEntidade,
      dados_antes: dados.dadosAntes,
      dados_depois: dados.dadosDepois,
      id_execucao_ia: dados.idExecucaoIA,
      id_acao: dados.idAcao,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao registrar auditoria:', err);
    return false;
  }
}
