'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type Prazo = Database['public']['Tables']['prazos']['Row'];
type PrazoInsert = Database['public']['Tables']['prazos']['Insert'];
type PrazoUpdate = Database['public']['Tables']['prazos']['Update'];
type Caso = Database['public']['Tables']['casos']['Row'];

interface PrazoComCaso extends Prazo {
  caso?: Caso;
}

// ============================================================================
// usePrazos - Lista de prazos com filtros
// ============================================================================

interface UsePrazosOptions {
  organizacaoId?: string;
  casoId?: number;
  status?: Prazo['status'] | Prazo['status'][];
  prioridade?: Prazo['prioridade'] | Prazo['prioridade'][];
  salaGuerraAtiva?: boolean;
  proximosDias?: number; // Buscar prazos dos próximos N dias
  atribuidoA?: string;
  limite?: number;
  ordenarPor?: keyof Prazo;
  ordem?: 'asc' | 'desc';
  incluirCaso?: boolean;
}

interface UsePrazosReturn {
  prazos: PrazoComCaso[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  criar: (data: PrazoInsert) => Promise<Prazo | null>;
  atualizar: (id: string, data: PrazoUpdate) => Promise<Prazo | null>;
  deletar: (id: string) => Promise<boolean>;
  marcarConcluido: (id: string) => Promise<boolean>;
  ativarSalaGuerra: (id: string) => Promise<boolean>;
}

export function usePrazos(options: UsePrazosOptions = {}): UsePrazosReturn {
  const [prazos, setPrazos] = useState<PrazoComCaso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchPrazos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const selectQuery = options.incluirCaso
        ? '*, caso:casos(*)'
        : '*';

      let query = supabase
        .from('prazos')
        .select(selectQuery, { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.casoId) {
        query = query.eq('caso_id', options.casoId);
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

      if (options.salaGuerraAtiva !== undefined) {
        query = query.eq('sala_guerra_ativada', options.salaGuerraAtiva);
      }

      if (options.proximosDias) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + options.proximosDias);
        query = query.lte('data_ajustada', dataLimite.toISOString().split('T')[0]);
        query = query.gte('data_ajustada', new Date().toISOString().split('T')[0]);
      }

      if (options.atribuidoA) {
        query = query.eq('atribuido_a', options.atribuidoA);
      }

      if (options.limite) {
        query = query.limit(options.limite);
      }

      if (options.ordenarPor) {
        query = query.order(options.ordenarPor, { 
          ascending: options.ordem === 'asc' 
        });
      } else {
        // Ordenar por data ajustada (mais próximos primeiro)
        query = query.order('data_ajustada', { ascending: true });
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setPrazos(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar prazos'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const criar = useCallback(async (data: PrazoInsert): Promise<Prazo | null> => {
    try {
      const { data: newPrazo, error: insertError } = await supabase
        .from('prazos')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      setPrazos(prev => [...prev, newPrazo].sort((a, b) => 
        new Date(a.data_ajustada).getTime() - new Date(b.data_ajustada).getTime()
      ));
      setTotal(prev => prev + 1);

      return newPrazo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar prazo'));
      return null;
    }
  }, [supabase]);

  const atualizar = useCallback(async (id: string, data: PrazoUpdate): Promise<Prazo | null> => {
    try {
      const { data: updatedPrazo, error: updateError } = await supabase
        .from('prazos')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setPrazos(prev => prev.map(p => p.id === id ? { ...p, ...updatedPrazo } : p));

      return updatedPrazo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar prazo'));
      return null;
    }
  }, [supabase]);

  const deletar = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('prazos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPrazos(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao deletar prazo'));
      return false;
    }
  }, [supabase]);

  const marcarConcluido = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('prazos')
        .update({ 
          status: 'concluido',
          concluido_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setPrazos(prev => prev.map(p => 
        p.id === id 
          ? { ...p, status: 'concluido' as const, concluido_em: new Date().toISOString() } 
          : p
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao marcar prazo como concluído'));
      return false;
    }
  }, [supabase]);

  const ativarSalaGuerra = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('prazos')
        .update({ 
          sala_guerra_ativada: true,
          sala_guerra_ativada_em: new Date().toISOString(),
          prioridade: 'critica',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setPrazos(prev => prev.map(p => 
        p.id === id 
          ? { 
              ...p, 
              sala_guerra_ativada: true, 
              sala_guerra_ativada_em: new Date().toISOString(),
              prioridade: 'critica' as const
            } 
          : p
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao ativar sala de guerra'));
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    fetchPrazos();
  }, [fetchPrazos]);

  return {
    prazos,
    loading,
    error,
    total,
    refetch: fetchPrazos,
    criar,
    atualizar,
    deletar,
    marcarConcluido,
    ativarSalaGuerra,
  };
}

// ============================================================================
// usePrazo - Prazo individual
// ============================================================================

interface UsePrazoReturn {
  prazo: PrazoComCaso | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  atualizar: (data: PrazoUpdate) => Promise<boolean>;
  marcarConcluido: () => Promise<boolean>;
  ativarSalaGuerra: () => Promise<boolean>;
}

export function usePrazo(id: string): UsePrazoReturn {
  const [prazo, setPrazo] = useState<PrazoComCaso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchPrazo = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('prazos')
        .select('*, caso:casos(*)')
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setPrazo(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar prazo'));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const atualizar = useCallback(async (data: PrazoUpdate): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('prazos')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      setPrazo(prev => prev ? { ...prev, ...data } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar prazo'));
      return false;
    }
  }, [id, supabase]);

  const marcarConcluido = useCallback(async (): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('prazos')
        .update({ 
          status: 'concluido',
          concluido_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setPrazo(prev => prev ? { 
        ...prev, 
        status: 'concluido' as const, 
        concluido_em: new Date().toISOString() 
      } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao marcar prazo como concluído'));
      return false;
    }
  }, [id, supabase]);

  const ativarSalaGuerra = useCallback(async (): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('prazos')
        .update({ 
          sala_guerra_ativada: true,
          sala_guerra_ativada_em: new Date().toISOString(),
          prioridade: 'critica',
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setPrazo(prev => prev ? { 
        ...prev, 
        sala_guerra_ativada: true, 
        sala_guerra_ativada_em: new Date().toISOString(),
        prioridade: 'critica' as const
      } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao ativar sala de guerra'));
      return false;
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchPrazo();
  }, [fetchPrazo]);

  return {
    prazo,
    loading,
    error,
    refetch: fetchPrazo,
    atualizar,
    marcarConcluido,
    ativarSalaGuerra,
  };
}

// ============================================================================
// usePrazosCounters - Contadores de prazos
// ============================================================================

interface PrazosCounters {
  pendente: number;
  em_andamento: number;
  minuta_pronta: number;
  concluido: number;
  perdido: number;
  total: number;
  salaGuerraAtiva: number;
  proximosTresDias: number;
  proximaSemana: number;
  vencidos: number;
}

export function usePrazosCounters(organizacaoId?: string): {
  counters: PrazosCounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<PrazosCounters>({
    pendente: 0,
    em_andamento: 0,
    minuta_pronta: 0,
    concluido: 0,
    perdido: 0,
    total: 0,
    salaGuerraAtiva: 0,
    proximosTresDias: 0,
    proximaSemana: 0,
    vencidos: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        let query = supabase
          .from('prazos')
          .select('status, prioridade, sala_guerra_ativada, data_ajustada', { count: 'exact' });

        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        const { data, count } = await query;

        if (data) {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          
          const tresDias = new Date(hoje);
          tresDias.setDate(tresDias.getDate() + 3);
          
          const umaSemana = new Date(hoje);
          umaSemana.setDate(umaSemana.getDate() + 7);

          const counts = data.reduce((acc, prazo) => {
            // Contagem por status
            acc[prazo.status as keyof Pick<PrazosCounters, 'pendente' | 'em_andamento' | 'minuta_pronta' | 'concluido' | 'perdido'>] = 
              (acc[prazo.status as keyof Pick<PrazosCounters, 'pendente' | 'em_andamento' | 'minuta_pronta' | 'concluido' | 'perdido'>] || 0) + 1;

            // Sala de guerra ativa
            if (prazo.sala_guerra_ativada) {
              acc.salaGuerraAtiva = (acc.salaGuerraAtiva || 0) + 1;
            }

            // Análise de datas (apenas para não concluídos)
            if (prazo.status !== 'concluido' && prazo.status !== 'perdido') {
              const dataPrazo = new Date(prazo.data_ajustada);
              dataPrazo.setHours(0, 0, 0, 0);

              if (dataPrazo < hoje) {
                acc.vencidos = (acc.vencidos || 0) + 1;
              } else if (dataPrazo <= tresDias) {
                acc.proximosTresDias = (acc.proximosTresDias || 0) + 1;
              } else if (dataPrazo <= umaSemana) {
                acc.proximaSemana = (acc.proximaSemana || 0) + 1;
              }
            }

            return acc;
          }, {} as Partial<PrazosCounters>);

          setCounters({
            pendente: counts.pendente || 0,
            em_andamento: counts.em_andamento || 0,
            minuta_pronta: counts.minuta_pronta || 0,
            concluido: counts.concluido || 0,
            perdido: counts.perdido || 0,
            total: count || 0,
            salaGuerraAtiva: counts.salaGuerraAtiva || 0,
            proximosTresDias: counts.proximosTresDias || 0,
            proximaSemana: counts.proximaSemana || 0,
            vencidos: counts.vencidos || 0,
          });
        }
      } catch (err) {
        console.error('Erro ao buscar contadores de prazos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounters();
  }, [organizacaoId, supabase]);

  return { counters, loading };
}

// ============================================================================
// useSalaGuerra - Prazos críticos (Sala de Guerra)
// ============================================================================

interface UseSalaGuerraReturn {
  prazos: PrazoComCaso[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSalaGuerra(organizacaoId?: string): UseSalaGuerraReturn {
  const [prazos, setPrazos] = useState<PrazoComCaso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchSalaGuerra = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const tresDias = new Date();
      tresDias.setDate(tresDias.getDate() + 3);

      let query = supabase
        .from('prazos')
        .select('*, caso:casos(*)')
        .in('status', ['pendente', 'em_andamento', 'minuta_pronta'])
        .or(`sala_guerra_ativada.eq.true,data_ajustada.lte.${tresDias.toISOString().split('T')[0]}`)
        .order('data_ajustada', { ascending: true });

      if (organizacaoId) {
        query = query.eq('organizacao_id', organizacaoId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setPrazos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar sala de guerra'));
    } finally {
      setLoading(false);
    }
  }, [organizacaoId, supabase]);

  useEffect(() => {
    fetchSalaGuerra();
  }, [fetchSalaGuerra]);

  return {
    prazos,
    loading,
    error,
    refetch: fetchSalaGuerra,
  };
}

// ============================================================================
// Utilitários de prazo
// ============================================================================

export function calcularDiasRestantes(dataAjustada: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataAjustada);
  data.setHours(0, 0, 0, 0);
  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCorPrazo(diasRestantes: number): 'success' | 'warning' | 'danger' | 'critical' {
  if (diasRestantes < 0) return 'critical'; // Vencido
  if (diasRestantes <= 1) return 'critical'; // D-0 ou D-1
  if (diasRestantes <= 3) return 'danger';   // D-3
  if (diasRestantes <= 7) return 'warning';  // D-7
  return 'success';
}

export function getAlertaPrazo(diasRestantes: number): string {
  if (diasRestantes < 0) return `Vencido há ${Math.abs(diasRestantes)} dia(s)`;
  if (diasRestantes === 0) return 'Vence hoje!';
  if (diasRestantes === 1) return 'Vence amanhã!';
  if (diasRestantes <= 3) return `Vence em ${diasRestantes} dias`;
  if (diasRestantes <= 7) return `Vence em ${diasRestantes} dias`;
  return `Vence em ${diasRestantes} dias`;
}
