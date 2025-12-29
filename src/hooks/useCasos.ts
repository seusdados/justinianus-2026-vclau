'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type Caso = Database['public']['Tables']['casos']['Row'];
type CasoInsert = Database['public']['Tables']['casos']['Insert'];
type CasoUpdate = Database['public']['Tables']['casos']['Update'];
type Cliente = Database['public']['Tables']['clientes']['Row'];
type Prazo = Database['public']['Tables']['prazos']['Row'];
type Tarefa = Database['public']['Tables']['tarefas_caso']['Row'];
type Documento = Database['public']['Tables']['documentos']['Row'];

interface CasoComRelacionamentos extends Caso {
  cliente?: Cliente;
  prazos?: Prazo[];
  tarefas?: Tarefa[];
  documentos?: Documento[];
}

interface UseCasosOptions {
  organizacaoId?: string;
  clienteId?: number;
  status?: Caso['status_caso'] | Caso['status_caso'][];
  tipoCaso?: Caso['tipo_caso'];
  responsavelId?: string;
  limite?: number;
  ordenarPor?: keyof Caso;
  ordem?: 'asc' | 'desc';
  incluirRelacionamentos?: boolean;
}

interface UseCasosReturn {
  casos: CasoComRelacionamentos[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  criar: (data: CasoInsert) => Promise<Caso | null>;
  atualizar: (id: number, data: CasoUpdate) => Promise<Caso | null>;
  deletar: (id: number) => Promise<boolean>;
}

export function useCasos(options: UseCasosOptions = {}): UseCasosReturn {
  const [casos, setCasos] = useState<CasoComRelacionamentos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchCasos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Monta a query base
      const selectQuery = options.incluirRelacionamentos
        ? `
          *,
          cliente:clientes(*),
          prazos(*),
          tarefas:tarefas_caso(*),
          documentos(*)
        `
        : '*';

      let query = supabase
        .from('casos')
        .select(selectQuery, { count: 'exact' });

      // Aplica filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.clienteId) {
        query = query.eq('cliente_id', options.clienteId);
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status_caso', options.status);
        } else {
          query = query.eq('status_caso', options.status);
        }
      }

      if (options.tipoCaso) {
        query = query.eq('tipo_caso', options.tipoCaso);
      }

      if (options.responsavelId) {
        query = query.eq('usuario_responsavel_id', options.responsavelId);
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

      setCasos(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar casos'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const criar = useCallback(async (data: CasoInsert): Promise<Caso | null> => {
    try {
      const { data: newCaso, error: insertError } = await supabase
        .from('casos')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      setCasos(prev => [newCaso, ...prev]);
      setTotal(prev => prev + 1);

      return newCaso;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar caso'));
      return null;
    }
  }, [supabase]);

  const atualizar = useCallback(async (id: number, data: CasoUpdate): Promise<Caso | null> => {
    try {
      const { data: updatedCaso, error: updateError } = await supabase
        .from('casos')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCasos(prev => prev.map(c => c.id === id ? { ...c, ...updatedCaso } : c));

      return updatedCaso;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar caso'));
      return null;
    }
  }, [supabase]);

  const deletar = useCallback(async (id: number): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('casos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCasos(prev => prev.filter(c => c.id !== id));
      setTotal(prev => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao deletar caso'));
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  return {
    casos,
    loading,
    error,
    total,
    refetch: fetchCasos,
    criar,
    atualizar,
    deletar,
  };
}

// Hook para buscar um caso específico com todos os relacionamentos
interface UseCasoReturn {
  caso: CasoComRelacionamentos | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  atualizarFase: (fase: Caso['fase_atual']) => Promise<boolean>;
  atualizarStatus: (status: Caso['status_caso']) => Promise<boolean>;
}

export function useCaso(id: number): UseCasoReturn {
  const [caso, setCaso] = useState<CasoComRelacionamentos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchCaso = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('casos')
        .select(`
          *,
          cliente:clientes(*),
          prazos(*),
          tarefas:tarefas_caso(*),
          documentos(*)
        `)
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setCaso(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar caso'));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const atualizarFase = useCallback(async (fase: Caso['fase_atual']): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('casos')
        .update({ fase_atual: fase, atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      setCaso(prev => prev ? { ...prev, fase_atual: fase } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar fase'));
      return false;
    }
  }, [id, supabase]);

  const atualizarStatus = useCallback(async (status: Caso['status_caso']): Promise<boolean> => {
    try {
      const updateData: CasoUpdate = { 
        status_caso: status, 
        atualizado_em: new Date().toISOString() 
      };

      if (status === 'encerrado') {
        updateData.encerrado_em = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('casos')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      setCaso(prev => prev ? { ...prev, status_caso: status } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar status'));
      return false;
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchCaso();
  }, [fetchCaso]);

  return {
    caso,
    loading,
    error,
    refetch: fetchCaso,
    atualizarFase,
    atualizarStatus,
  };
}

// Hook para contadores de casos por status
interface CasosCounters {
  ativo: number;
  suspenso: number;
  em_execucao: number;
  encerrado: number;
  total: number;
  valorTotal: number;
}

export function useCasosCounters(organizacaoId?: string): {
  counters: CasosCounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<CasosCounters>({
    ativo: 0,
    suspenso: 0,
    em_execucao: 0,
    encerrado: 0,
    total: 0,
    valorTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        let query = supabase
          .from('casos')
          .select('status_caso, valor_causa', { count: 'exact' });

        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        const { data, count } = await query;

        if (data) {
          const counts = data.reduce((acc, caso) => {
            acc[caso.status_caso as keyof Omit<CasosCounters, 'total' | 'valorTotal'>] = 
              (acc[caso.status_caso as keyof Omit<CasosCounters, 'total' | 'valorTotal'>] || 0) + 1;
            acc.valorTotal = (acc.valorTotal || 0) + (caso.valor_causa || 0);
            return acc;
          }, {} as Partial<CasosCounters>);

          setCounters({
            ativo: counts.ativo || 0,
            suspenso: counts.suspenso || 0,
            em_execucao: counts.em_execucao || 0,
            encerrado: counts.encerrado || 0,
            total: count || 0,
            valorTotal: counts.valorTotal || 0,
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

// Hook para casos por fase (para o fluxo)
interface CasosPorFase {
  captacao: number;
  qualificacao: number;
  analise: number;
  acao: number;
  registro: number;
}

export function useCasosPorFase(organizacaoId?: string): {
  porFase: CasosPorFase;
  loading: boolean;
} {
  const [porFase, setPorFase] = useState<CasosPorFase>({
    captacao: 0,
    qualificacao: 0,
    analise: 0,
    acao: 0,
    registro: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchPorFase() {
      setLoading(true);

      try {
        let query = supabase
          .from('casos')
          .select('fase_atual')
          .eq('status_caso', 'ativo');

        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        const { data } = await query;

        if (data) {
          const counts = data.reduce((acc, caso) => {
            if (caso.fase_atual) {
              acc[caso.fase_atual as keyof CasosPorFase] = 
                (acc[caso.fase_atual as keyof CasosPorFase] || 0) + 1;
            }
            return acc;
          }, {} as Partial<CasosPorFase>);

          setPorFase({
            captacao: counts.captacao || 0,
            qualificacao: counts.qualificacao || 0,
            analise: counts.analise || 0,
            acao: counts.acao || 0,
            registro: counts.registro || 0,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar casos por fase:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPorFase();
  }, [organizacaoId, supabase]);

  return { porFase, loading };
}
