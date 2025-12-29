'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type Tarefa = Database['public']['Tables']['tarefas_caso']['Row'];
type TarefaInsert = Database['public']['Tables']['tarefas_caso']['Insert'];
type TarefaUpdate = Database['public']['Tables']['tarefas_caso']['Update'];
type Caso = Database['public']['Tables']['casos']['Row'];
type Prazo = Database['public']['Tables']['prazos']['Row'];

interface TarefaComRelacionamentos extends Tarefa {
  caso?: Caso;
  prazo?: Prazo;
}

// ============================================================================
// useTarefas - Lista de tarefas com filtros
// ============================================================================

interface UseTarefasOptions {
  organizacaoId?: string;
  casoId?: number;
  prazoId?: string;
  status?: Tarefa['status'] | Tarefa['status'][];
  prioridade?: Tarefa['prioridade'] | Tarefa['prioridade'][];
  atribuidaA?: string;
  criadaPor?: string;
  dataLimiteAte?: string;
  limite?: number;
  ordenarPor?: keyof Tarefa;
  ordem?: 'asc' | 'desc';
  incluirRelacionamentos?: boolean;
}

interface UseTarefasReturn {
  tarefas: TarefaComRelacionamentos[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  criar: (data: TarefaInsert) => Promise<Tarefa | null>;
  atualizar: (id: number, data: TarefaUpdate) => Promise<Tarefa | null>;
  deletar: (id: number) => Promise<boolean>;
  iniciar: (id: number) => Promise<boolean>;
  concluir: (id: number) => Promise<boolean>;
  cancelar: (id: number) => Promise<boolean>;
  atribuir: (id: number, usuarioId: string) => Promise<boolean>;
}

export function useTarefas(options: UseTarefasOptions = {}): UseTarefasReturn {
  const [tarefas, setTarefas] = useState<TarefaComRelacionamentos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchTarefas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const selectQuery = options.incluirRelacionamentos
        ? '*, caso:casos(*), prazo:prazos(*)'
        : '*';

      let query = supabase
        .from('tarefas_caso')
        .select(selectQuery, { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.casoId) {
        query = query.eq('caso_id', options.casoId);
      }

      if (options.prazoId) {
        query = query.eq('prazo_id', options.prazoId);
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.prioridade) {
        if (Array.isArray(options.prioridade)) {
          query = query.in('prioridade', options.prioridade);
        } else {
          query = query.eq('prioridade', options.prioridade);
        }
      }

      if (options.atribuidaA) {
        query = query.eq('atribuida_a', options.atribuidaA);
      }

      if (options.criadaPor) {
        query = query.eq('criado_por', options.criadaPor);
      }

      if (options.dataLimiteAte) {
        query = query.lte('data_limite', options.dataLimiteAte);
      }

      if (options.limite) {
        query = query.limit(options.limite);
      }

      if (options.ordenarPor) {
        query = query.order(options.ordenarPor, { 
          ascending: options.ordem === 'asc' 
        });
      } else {
        // Ordenar por prioridade (crítica primeiro) e depois por data limite
        query = query.order('data_limite', { ascending: true, nullsFirst: false });
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setTarefas(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar tarefas'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const criar = useCallback(async (data: TarefaInsert): Promise<Tarefa | null> => {
    try {
      const { data: newTarefa, error: insertError } = await supabase
        .from('tarefas_caso')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      setTarefas(prev => [newTarefa, ...prev]);
      setTotal(prev => prev + 1);

      return newTarefa;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar tarefa'));
      return null;
    }
  }, [supabase]);

  const atualizar = useCallback(async (id: number, data: TarefaUpdate): Promise<Tarefa | null> => {
    try {
      const { data: updatedTarefa, error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...updatedTarefa } : t));

      return updatedTarefa;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar tarefa'));
      return null;
    }
  }, [supabase]);

  const deletar = useCallback(async (id: number): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('tarefas_caso')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTarefas(prev => prev.filter(t => t.id !== id));
      setTotal(prev => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao deletar tarefa'));
      return false;
    }
  }, [supabase]);

  const iniciar = useCallback(async (id: number): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ 
          status: 'em_andamento',
          iniciada_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefas(prev => prev.map(t => 
        t.id === id 
          ? { ...t, status: 'em_andamento' as const, iniciada_em: new Date().toISOString() } 
          : t
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao iniciar tarefa'));
      return false;
    }
  }, [supabase]);

  const concluir = useCallback(async (id: number): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ 
          status: 'concluida',
          concluida_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefas(prev => prev.map(t => 
        t.id === id 
          ? { ...t, status: 'concluida' as const, concluida_em: new Date().toISOString() } 
          : t
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao concluir tarefa'));
      return false;
    }
  }, [supabase]);

  const cancelar = useCallback(async (id: number): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ 
          status: 'cancelada',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefas(prev => prev.map(t => 
        t.id === id 
          ? { ...t, status: 'cancelada' as const } 
          : t
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao cancelar tarefa'));
      return false;
    }
  }, [supabase]);

  const atribuir = useCallback(async (id: number, usuarioId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ 
          atribuida_a: usuarioId,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefas(prev => prev.map(t => 
        t.id === id 
          ? { ...t, atribuida_a: usuarioId } 
          : t
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atribuir tarefa'));
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchTarefas();
  }, [fetchTarefas]);

  return {
    tarefas,
    loading,
    error,
    total,
    refetch: fetchTarefas,
    criar,
    atualizar,
    deletar,
    iniciar,
    concluir,
    cancelar,
    atribuir,
  };
}

// ============================================================================
// useTarefa - Tarefa individual
// ============================================================================

interface UseTarefaReturn {
  tarefa: TarefaComRelacionamentos | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  atualizar: (data: TarefaUpdate) => Promise<boolean>;
  iniciar: () => Promise<boolean>;
  concluir: () => Promise<boolean>;
  cancelar: () => Promise<boolean>;
}

export function useTarefa(id: number): UseTarefaReturn {
  const [tarefa, setTarefa] = useState<TarefaComRelacionamentos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchTarefa = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tarefas_caso')
        .select('*, caso:casos(*), prazo:prazos(*)')
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setTarefa(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar tarefa'));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const atualizar = useCallback(async (data: TarefaUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefa(prev => prev ? { ...prev, ...data } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar tarefa'));
      return false;
    }
  }, [id, supabase]);

  const iniciar = useCallback(async (): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ 
          status: 'em_andamento',
          iniciada_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefa(prev => prev ? { 
        ...prev, 
        status: 'em_andamento' as const, 
        iniciada_em: new Date().toISOString() 
      } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao iniciar tarefa'));
      return false;
    }
  }, [id, supabase]);

  const concluir = useCallback(async (): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ 
          status: 'concluida',
          concluida_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefa(prev => prev ? { 
        ...prev, 
        status: 'concluida' as const, 
        concluida_em: new Date().toISOString() 
      } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao concluir tarefa'));
      return false;
    }
  }, [id, supabase]);

  const cancelar = useCallback(async (): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tarefas_caso')
        .update({ 
          status: 'cancelada',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTarefa(prev => prev ? { ...prev, status: 'cancelada' as const } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao cancelar tarefa'));
      return false;
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchTarefa();
  }, [fetchTarefa]);

  return {
    tarefa,
    loading,
    error,
    refetch: fetchTarefa,
    atualizar,
    iniciar,
    concluir,
    cancelar,
  };
}

// ============================================================================
// useTarefasCounters - Contadores de tarefas
// ============================================================================

interface TarefasCounters {
  aberta: number;
  em_andamento: number;
  aguardando: number;
  concluida: number;
  cancelada: number;
  total: number;
  atrasadas: number;
  hoje: number;
}

export function useTarefasCounters(options: { 
  organizacaoId?: string; 
  casoId?: number;
  atribuidaA?: string;
} = {}): {
  counters: TarefasCounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<TarefasCounters>({
    aberta: 0,
    em_andamento: 0,
    aguardando: 0,
    concluida: 0,
    cancelada: 0,
    total: 0,
    atrasadas: 0,
    hoje: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        let query = supabase
          .from('tarefas_caso')
          .select('status, data_limite', { count: 'exact' });

        if (options.organizacaoId) {
          query = query.eq('organizacao_id', options.organizacaoId);
        }

        if (options.casoId) {
          query = query.eq('caso_id', options.casoId);
        }

        if (options.atribuidaA) {
          query = query.eq('atribuida_a', options.atribuidaA);
        }

        const { data, count } = await query;

        if (data) {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const hojeStr = hoje.toISOString().split('T')[0];

          const counts = data.reduce((acc, tarefa) => {
            // Contagem por status
            acc[tarefa.status as keyof Pick<TarefasCounters, 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'>] = 
              (acc[tarefa.status as keyof Pick<TarefasCounters, 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'>] || 0) + 1;

            // Tarefas para hoje (não concluídas/canceladas)
            if (tarefa.data_limite === hojeStr && 
                tarefa.status !== 'concluida' && 
                tarefa.status !== 'cancelada') {
              acc.hoje = (acc.hoje || 0) + 1;
            }

            // Tarefas atrasadas (não concluídas/canceladas com data limite passada)
            if (tarefa.data_limite && 
                tarefa.data_limite < hojeStr && 
                tarefa.status !== 'concluida' && 
                tarefa.status !== 'cancelada') {
              acc.atrasadas = (acc.atrasadas || 0) + 1;
            }

            return acc;
          }, {} as Partial<TarefasCounters>);

          setCounters({
            aberta: counts.aberta || 0,
            em_andamento: counts.em_andamento || 0,
            aguardando: counts.aguardando || 0,
            concluida: counts.concluida || 0,
            cancelada: counts.cancelada || 0,
            total: count || 0,
            atrasadas: counts.atrasadas || 0,
            hoje: counts.hoje || 0,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar contadores de tarefas:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounters();
  }, [options.organizacaoId, options.casoId, options.atribuidaA, supabase]);

  return { counters, loading };
}

// ============================================================================
// useMinhasTarefas - Tarefas do usuário logado
// ============================================================================

interface UseMinhasTarefasReturn {
  tarefas: TarefaComRelacionamentos[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  counters: TarefasCounters;
}

export function useMinhasTarefas(usuarioId: string, organizacaoId?: string): UseMinhasTarefasReturn {
  const { tarefas, loading, error, refetch } = useTarefas({
    atribuidaA: usuarioId,
    organizacaoId,
    status: ['aberta', 'em_andamento', 'aguardando'],
    incluirRelacionamentos: true,
    ordenarPor: 'data_limite',
    ordem: 'asc',
  });

  const { counters } = useTarefasCounters({
    organizacaoId,
    atribuidaA: usuarioId,
  });

  return {
    tarefas,
    loading,
    error,
    refetch,
    counters,
  };
}
