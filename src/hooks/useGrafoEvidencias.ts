'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type NoGrafo = Database['public']['Tables']['nos_grafo_evidencias']['Row'];
type NoGrafoInsert = Database['public']['Tables']['nos_grafo_evidencias']['Insert'];
type NoGrafoUpdate = Database['public']['Tables']['nos_grafo_evidencias']['Update'];
type ArestaGrafo = Database['public']['Tables']['arestas_grafo_evidencias']['Row'];
type ArestaGrafoInsert = Database['public']['Tables']['arestas_grafo_evidencias']['Insert'];

// ============================================================================
// Tipos do Grafo de Evidências
// ============================================================================

export const TIPOS_NO = [
  { value: 'fato', label: 'Fato', cor: '#3B82F6' },           // blue
  { value: 'prova', label: 'Prova', cor: '#22C55E' },         // green
  { value: 'alegacao', label: 'Alegação', cor: '#A855F7' },   // purple
  { value: 'pedido', label: 'Pedido', cor: '#F59E0B' },       // amber
  { value: 'base_legal', label: 'Base Legal', cor: '#6366F1' }, // indigo
  { value: 'risco', label: 'Risco', cor: '#EF4444' },         // red
] as const;

export const TIPOS_RELACAO = [
  { value: 'suportado_por', label: 'Suportado por', direcao: 'reversa' },
  { value: 'depende_de', label: 'Depende de', direcao: 'normal' },
  { value: 'fundamentado_por', label: 'Fundamentado por', direcao: 'reversa' },
  { value: 'enfraquecido_por', label: 'Enfraquecido por', direcao: 'reversa' },
  { value: 'contradiz', label: 'Contradiz', direcao: 'bidirecional' },
  { value: 'corrobora', label: 'Corrobora', direcao: 'bidirecional' },
] as const;

export type TipoNo = typeof TIPOS_NO[number]['value'];
export type TipoRelacao = typeof TIPOS_RELACAO[number]['value'];

interface NoComArestas extends NoGrafo {
  arestas_saida?: ArestaGrafo[];
  arestas_entrada?: ArestaGrafo[];
}

interface GrafoCompleto {
  nos: NoGrafo[];
  arestas: ArestaGrafo[];
}

// ============================================================================
// useGrafoEvidencias - Grafo completo de um caso
// ============================================================================

interface UseGrafoEvidenciasReturn {
  grafo: GrafoCompleto;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // Operações em nós
  criarNo: (data: NoGrafoInsert) => Promise<NoGrafo | null>;
  atualizarNo: (id: string, data: NoGrafoUpdate) => Promise<NoGrafo | null>;
  deletarNo: (id: string) => Promise<boolean>;
  // Operações em arestas
  criarAresta: (data: ArestaGrafoInsert) => Promise<ArestaGrafo | null>;
  deletarAresta: (id: string) => Promise<boolean>;
  // Operações em lote
  criarNosEmLote: (nos: NoGrafoInsert[]) => Promise<NoGrafo[]>;
  criarArestasEmLote: (arestas: ArestaGrafoInsert[]) => Promise<ArestaGrafo[]>;
}

export function useGrafoEvidencias(casoId: number): UseGrafoEvidenciasReturn {
  const [nos, setNos] = useState<NoGrafo[]>([]);
  const [arestas, setArestas] = useState<ArestaGrafo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchGrafo = useCallback(async () => {
    if (!casoId) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar nós
      const { data: nosData, error: nosError } = await supabase
        .from('nos_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId)
        .order('criado_em', { ascending: true });

      if (nosError) throw nosError;

      // Buscar arestas
      const { data: arestasData, error: arestasError } = await supabase
        .from('arestas_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId);

      if (arestasError) throw arestasError;

      setNos(nosData || []);
      setArestas(arestasData || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar grafo'));
    } finally {
      setLoading(false);
    }
  }, [casoId, supabase]);

  // --- Operações em Nós ---

  const criarNo = useCallback(async (data: NoGrafoInsert): Promise<NoGrafo | null> => {
    try {
      const { data: newNo, error: insertError } = await supabase
        .from('nos_grafo_evidencias')
        .insert({ ...data, caso_id: casoId })
        .select()
        .single();

      if (insertError) throw insertError;

      setNos(prev => [...prev, newNo]);
      return newNo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar nó'));
      return null;
    }
  }, [supabase, casoId]);

  const atualizarNo = useCallback(async (id: string, data: NoGrafoUpdate): Promise<NoGrafo | null> => {
    try {
      const { data: updatedNo, error: updateError } = await supabase
        .from('nos_grafo_evidencias')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setNos(prev => prev.map(n => n.id === id ? updatedNo : n));
      return updatedNo;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar nó'));
      return null;
    }
  }, [supabase]);

  const deletarNo = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Deletar nó (arestas são deletadas em cascata)
      const { error: deleteError } = await supabase
        .from('nos_grafo_evidencias')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setNos(prev => prev.filter(n => n.id !== id));
      // Remove arestas conectadas
      setArestas(prev => prev.filter(a => a.no_origem !== id && a.no_destino !== id));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao deletar nó'));
      return false;
    }
  }, [supabase]);

  // --- Operações em Arestas ---

  const criarAresta = useCallback(async (data: ArestaGrafoInsert): Promise<ArestaGrafo | null> => {
    try {
      const { data: newAresta, error: insertError } = await supabase
        .from('arestas_grafo_evidencias')
        .insert({ ...data, caso_id: casoId })
        .select()
        .single();

      if (insertError) throw insertError;

      setArestas(prev => [...prev, newAresta]);
      return newAresta;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar aresta'));
      return null;
    }
  }, [supabase, casoId]);

  const deletarAresta = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('arestas_grafo_evidencias')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setArestas(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao deletar aresta'));
      return false;
    }
  }, [supabase]);

  // --- Operações em Lote ---

  const criarNosEmLote = useCallback(async (nosData: NoGrafoInsert[]): Promise<NoGrafo[]> => {
    try {
      const { data: newNos, error: insertError } = await supabase
        .from('nos_grafo_evidencias')
        .insert(nosData.map(n => ({ ...n, caso_id: casoId })))
        .select();

      if (insertError) throw insertError;

      setNos(prev => [...prev, ...(newNos || [])]);
      return newNos || [];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar nós em lote'));
      return [];
    }
  }, [supabase, casoId]);

  const criarArestasEmLote = useCallback(async (arestasData: ArestaGrafoInsert[]): Promise<ArestaGrafo[]> => {
    try {
      const { data: newArestas, error: insertError } = await supabase
        .from('arestas_grafo_evidencias')
        .insert(arestasData.map(a => ({ ...a, caso_id: casoId })))
        .select();

      if (insertError) throw insertError;

      setArestas(prev => [...prev, ...(newArestas || [])]);
      return newArestas || [];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar arestas em lote'));
      return [];
    }
  }, [supabase, casoId]);

  useEffect(() => {
    fetchGrafo();
  }, [fetchGrafo]);

  return {
    grafo: { nos, arestas },
    loading,
    error,
    refetch: fetchGrafo,
    criarNo,
    atualizarNo,
    deletarNo,
    criarAresta,
    deletarAresta,
    criarNosEmLote,
    criarArestasEmLote,
  };
}

// ============================================================================
// useNoGrafo - Nó individual com arestas
// ============================================================================

export function useNoGrafo(id: string): {
  no: NoComArestas | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [no, setNo] = useState<NoComArestas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchNo = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar nó
      const { data: noData, error: noError } = await supabase
        .from('nos_grafo_evidencias')
        .select('*')
        .eq('id', id)
        .single();

      if (noError) throw noError;

      // Buscar arestas de saída (onde este nó é origem)
      const { data: arestasSaida } = await supabase
        .from('arestas_grafo_evidencias')
        .select('*')
        .eq('no_origem', id);

      // Buscar arestas de entrada (onde este nó é destino)
      const { data: arestasEntrada } = await supabase
        .from('arestas_grafo_evidencias')
        .select('*')
        .eq('no_destino', id);

      setNo({
        ...noData,
        arestas_saida: arestasSaida || [],
        arestas_entrada: arestasEntrada || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar nó'));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchNo();
  }, [fetchNo]);

  return {
    no,
    loading,
    error,
    refetch: fetchNo,
  };
}

// ============================================================================
// useGrafoStats - Estatísticas do grafo
// ============================================================================

interface GrafoStats {
  totalNos: number;
  totalArestas: number;
  nosPorTipo: Record<TipoNo, number>;
  forcaMedia: number;
  nosFortes: number; // força >= 0.7
  nosFracos: number; // força <= 0.3
  geradosPorIA: number;
}

export function useGrafoStats(casoId: number): {
  stats: GrafoStats;
  loading: boolean;
} {
  const [stats, setStats] = useState<GrafoStats>({
    totalNos: 0,
    totalArestas: 0,
    nosPorTipo: {
      fato: 0,
      prova: 0,
      alegacao: 0,
      pedido: 0,
      base_legal: 0,
      risco: 0,
    },
    forcaMedia: 0,
    nosFortes: 0,
    nosFracos: 0,
    geradosPorIA: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchStats() {
      if (!casoId) return;

      setLoading(true);

      try {
        // Buscar nós
        const { data: nosData } = await supabase
          .from('nos_grafo_evidencias')
          .select('tipo_no, forca, gerado_por_ia')
          .eq('caso_id', casoId);

        // Buscar contagem de arestas
        const { count: totalArestas } = await supabase
          .from('arestas_grafo_evidencias')
          .select('*', { count: 'exact', head: true })
          .eq('caso_id', casoId);

        if (nosData) {
          const result: GrafoStats = {
            totalNos: nosData.length,
            totalArestas: totalArestas || 0,
            nosPorTipo: {
              fato: 0,
              prova: 0,
              alegacao: 0,
              pedido: 0,
              base_legal: 0,
              risco: 0,
            },
            forcaMedia: 0,
            nosFortes: 0,
            nosFracos: 0,
            geradosPorIA: 0,
          };

          let somaForca = 0;

          nosData.forEach(no => {
            // Contagem por tipo
            result.nosPorTipo[no.tipo_no as TipoNo]++;

            // Força
            const forca = no.forca || 0.5;
            somaForca += forca;
            if (forca >= 0.7) result.nosFortes++;
            if (forca <= 0.3) result.nosFracos++;

            // Gerados por IA
            if (no.gerado_por_ia) result.geradosPorIA++;
          });

          result.forcaMedia = nosData.length > 0 ? somaForca / nosData.length : 0;

          setStats(result);
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [casoId, supabase]);

  return { stats, loading };
}

// ============================================================================
// Utilitários para o grafo
// ============================================================================

/**
 * Converte o grafo para formato compatível com bibliotecas de visualização (D3, Cytoscape, etc.)
 */
export function converterParaVisualizacao(grafo: GrafoCompleto): {
  nodes: Array<{ id: string; label: string; type: string; color: string; strength: number }>;
  edges: Array<{ id: string; source: string; target: string; label: string; weight: number }>;
} {
  const nodes = grafo.nos.map(no => ({
    id: no.id,
    label: no.titulo,
    type: no.tipo_no,
    color: TIPOS_NO.find(t => t.value === no.tipo_no)?.cor || '#666666',
    strength: no.forca || 0.5,
  }));

  const edges = grafo.arestas.map(aresta => ({
    id: aresta.id,
    source: aresta.no_origem,
    target: aresta.no_destino,
    label: aresta.relacao,
    weight: aresta.peso || 0.5,
  }));

  return { nodes, edges };
}

/**
 * Encontra o caminho mais forte entre dois nós
 */
export function encontrarCaminhoMaisForte(
  grafo: GrafoCompleto,
  origemId: string,
  destinoId: string
): string[] {
  // Implementação simplificada usando BFS ponderado
  const visitados = new Set<string>();
  const fila: Array<{ noId: string; caminho: string[]; pesoTotal: number }> = [
    { noId: origemId, caminho: [origemId], pesoTotal: 1 }
  ];

  let melhorCaminho: string[] = [];
  let melhorPeso = 0;

  while (fila.length > 0) {
    const { noId, caminho, pesoTotal } = fila.shift()!;

    if (noId === destinoId && pesoTotal > melhorPeso) {
      melhorCaminho = caminho;
      melhorPeso = pesoTotal;
      continue;
    }

    if (visitados.has(noId)) continue;
    visitados.add(noId);

    // Encontrar arestas que partem deste nó
    const arestasDoNo = grafo.arestas.filter(a => a.no_origem === noId);

    for (const aresta of arestasDoNo) {
      if (!caminho.includes(aresta.no_destino)) {
        fila.push({
          noId: aresta.no_destino,
          caminho: [...caminho, aresta.no_destino],
          pesoTotal: pesoTotal * (aresta.peso || 0.5),
        });
      }
    }
  }

  return melhorCaminho;
}
