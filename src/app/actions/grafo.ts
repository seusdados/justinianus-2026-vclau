'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types';

type NoGrafoInsert = Database['public']['Tables']['nos_grafo_evidencias']['Insert'];
type NoGrafoUpdate = Database['public']['Tables']['nos_grafo_evidencias']['Update'];
type ArestaGrafoInsert = Database['public']['Tables']['arestas_grafo_evidencias']['Insert'];

// ============================================================================
// TIPOS DE NÓ E RELAÇÃO
// ============================================================================

export const TIPOS_NO = {
  fato: { cor: '#3B82F6', icone: 'circle' },
  prova: { cor: '#10B981', icone: 'file-text' },
  alegacao: { cor: '#8B5CF6', icone: 'message-square' },
  pedido: { cor: '#F59E0B', icone: 'target' },
  base_legal: { cor: '#6366F1', icone: 'book' },
  risco: { cor: '#EF4444', icone: 'alert-triangle' },
} as const;

export const TIPOS_RELACAO = {
  suportado_por: { cor: '#10B981', label: 'suportado por' },
  depende_de: { cor: '#3B82F6', label: 'depende de' },
  fundamentado_por: { cor: '#6366F1', label: 'fundamentado por' },
  enfraquecido_por: { cor: '#EF4444', label: 'enfraquecido por' },
  contradiz: { cor: '#F59E0B', label: 'contradiz' },
  corrobora: { cor: '#8B5CF6', label: 'corrobora' },
} as const;

// ============================================================================
// Criar Nó do Grafo
// ============================================================================

interface CriarNoParams {
  organizacaoId: string;
  casoId: number;
  tipoNo: keyof typeof TIPOS_NO;
  titulo: string;
  conteudo?: string;
  referencias?: Record<string, unknown>;
  forca?: number;
  geradoPorIA?: boolean;
  idExecucaoIA?: string;
  confiancaIA?: number;
  criadoPor?: string;
}

export async function criarNo(params: CriarNoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const noData: NoGrafoInsert = {
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      tipo_no: params.tipoNo,
      titulo: params.titulo,
      conteudo: params.conteudo,
      referencias: params.referencias as any,
      forca: params.forca ?? 0.5,
      gerado_por_ia: params.geradoPorIA ?? false,
      id_execucao_ia: params.idExecucaoIA,
      confianca_ia: params.confiancaIA,
      criado_por: params.criadoPor,
    };

    const { data: no, error } = await (supabase as any)
      .from('nos_grafo_evidencias')
      .insert(noData)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'no_grafo_criado',
      categoria_evento: 'grafo',
      tipo_ator: params.geradoPorIA ? 'agente' : 'usuario',
      id_usuario_ator: params.criadoPor,
      tipo_agente_ator: params.geradoPorIA ? 'mapeador_evidencias' : undefined,
      tipo_entidade: 'no_grafo',
      id_entidade: no.id,
      dados_depois: no,
      id_execucao_ia: params.idExecucaoIA,
    });

    revalidatePath(`/app/casos/${params.casoId}`);
    revalidatePath('/app/analise');

    return { success: true, data: no };
  } catch (error) {
    console.error('Erro ao criar nó:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar nó',
    };
  }
}

// ============================================================================
// Criar Múltiplos Nós em Lote
// ============================================================================

interface CriarNosEmLoteParams {
  organizacaoId: string;
  casoId: number;
  nos: Array<{
    tipoNo: keyof typeof TIPOS_NO;
    titulo: string;
    conteudo?: string;
    referencias?: Record<string, unknown>;
    forca?: number;
  }>;
  geradoPorIA?: boolean;
  idExecucaoIA?: string;
  criadoPor?: string;
}

export async function criarNosEmLote(params: CriarNosEmLoteParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const nosData: any[] = params.nos.map((no) => ({
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      tipo_no: no.tipoNo,
      titulo: no.titulo,
      conteudo: no.conteudo,
      referencias: no.referencias,
      forca: no.forca ?? 0.5,
      gerado_por_ia: params.geradoPorIA ?? false,
      id_execucao_ia: params.idExecucaoIA,
      criado_por: params.criadoPor,
    }));

    const { data: nos, error } = await (supabase as any)
      .from('nos_grafo_evidencias')
      .insert(nosData)
      .select();

    if (error) throw error;

    // Registrar auditoria para o lote
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'nos_grafo_criados_lote',
      categoria_evento: 'grafo',
      tipo_ator: params.geradoPorIA ? 'agente' : 'usuario',
      id_usuario_ator: params.criadoPor,
      tipo_entidade: 'caso',
      id_entidade: params.casoId.toString(),
      dados_depois: { quantidade: nos.length, nos_ids: nos.map((n: any) => n.id) },
      id_execucao_ia: params.idExecucaoIA,
    });

    revalidatePath(`/app/casos/${params.casoId}`);
    revalidatePath('/app/analise');

    return { success: true, data: nos };
  } catch (error) {
    console.error('Erro ao criar nós em lote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar nós em lote',
    };
  }
}

// ============================================================================
// Atualizar Nó
// ============================================================================

export async function atualizarNo(
  id: string,
  data: NoGrafoUpdate,
  usuarioId?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: noAnterior } = await (supabase as any)
      .from('nos_grafo_evidencias')
      .select('*')
      .eq('id', id)
      .single();

    const { data: no, error } = await (supabase as any)
      .from('nos_grafo_evidencias')
      .update({ ...data, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    if (noAnterior) {
      await (supabase as any).from('logs_auditoria').insert({
        organizacao_id: no.organizacao_id,
        evento: 'no_grafo_atualizado',
        categoria_evento: 'grafo',
        tipo_ator: 'usuario',
        id_usuario_ator: usuarioId,
        tipo_entidade: 'no_grafo',
        id_entidade: id,
        dados_antes: noAnterior,
        dados_depois: no,
      });
    }

    revalidatePath(`/app/casos/${no.caso_id}`);

    return { success: true, data: no };
  } catch (error) {
    console.error('Erro ao atualizar nó:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar nó',
    };
  }
}

// ============================================================================
// Deletar Nó
// ============================================================================

export async function deletarNo(id: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: no, error: fetchError } = await (supabase as any)
      .from('nos_grafo_evidencias')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Deletar arestas conectadas primeiro (cascade já faz isso, mas registramos)
    await (supabase as any)
      .from('arestas_grafo_evidencias')
      .delete()
      .or(`no_origem.eq.${id},no_destino.eq.${id}`);

    // Deletar nó
    const { error: deleteError } = await (supabase as any)
      .from('nos_grafo_evidencias')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: no.organizacao_id,
      evento: 'no_grafo_deletado',
      categoria_evento: 'grafo',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'no_grafo',
      id_entidade: id,
      dados_antes: no,
    });

    revalidatePath(`/app/casos/${no.caso_id}`);

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar nó:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar nó',
    };
  }
}

// ============================================================================
// Criar Aresta (Relação)
// ============================================================================

interface CriarArestaParams {
  organizacaoId: string;
  casoId: number;
  noOrigem: string;
  noDestino: string;
  relacao: keyof typeof TIPOS_RELACAO;
  peso?: number;
  notas?: string;
  geradoPorIA?: boolean;
  criadoPor?: string;
}

export async function criarAresta(params: CriarArestaParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const arestaData: ArestaGrafoInsert = {
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      no_origem: params.noOrigem,
      no_destino: params.noDestino,
      relacao: params.relacao,
      peso: params.peso ?? 0.5,
      notas: params.notas,
      gerado_por_ia: params.geradoPorIA ?? false,
    };

    const { data: aresta, error } = await (supabase as any)
      .from('arestas_grafo_evidencias')
      .insert(arestaData)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'aresta_grafo_criada',
      categoria_evento: 'grafo',
      tipo_ator: params.geradoPorIA ? 'agente' : 'usuario',
      id_usuario_ator: params.criadoPor,
      tipo_entidade: 'aresta_grafo',
      id_entidade: aresta.id,
      dados_depois: aresta,
    });

    revalidatePath(`/app/casos/${params.casoId}`);

    return { success: true, data: aresta };
  } catch (error) {
    console.error('Erro ao criar aresta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar aresta',
    };
  }
}

// ============================================================================
// Criar Múltiplas Arestas em Lote
// ============================================================================

interface CriarArestasEmLoteParams {
  organizacaoId: string;
  casoId: number;
  arestas: Array<{
    noOrigem: string;
    noDestino: string;
    relacao: keyof typeof TIPOS_RELACAO;
    peso?: number;
  }>;
  geradoPorIA?: boolean;
  idExecucaoIA?: string;
  criadoPor?: string;
}

export async function criarArestasEmLote(params: CriarArestasEmLoteParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const arestasData: ArestaGrafoInsert[] = params.arestas.map((aresta) => ({
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      no_origem: aresta.noOrigem,
      no_destino: aresta.noDestino,
      relacao: aresta.relacao,
      peso: aresta.peso ?? 0.5,
      gerado_por_ia: params.geradoPorIA ?? false,
    }));

    const { data: arestas, error } = await (supabase as any)
      .from('arestas_grafo_evidencias')
      .insert(arestasData)
      .select();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'arestas_grafo_criadas_lote',
      categoria_evento: 'grafo',
      tipo_ator: params.geradoPorIA ? 'agente' : 'usuario',
      id_usuario_ator: params.criadoPor,
      tipo_entidade: 'caso',
      id_entidade: params.casoId.toString(),
      dados_depois: { quantidade: arestas.length },
      id_execucao_ia: params.idExecucaoIA,
    });

    revalidatePath(`/app/casos/${params.casoId}`);

    return { success: true, data: arestas };
  } catch (error) {
    console.error('Erro ao criar arestas em lote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar arestas',
    };
  }
}

// ============================================================================
// Deletar Aresta
// ============================================================================

export async function deletarAresta(id: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: aresta, error: fetchError } = await (supabase as any)
      .from('arestas_grafo_evidencias')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error: deleteError } = await (supabase as any)
      .from('arestas_grafo_evidencias')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: aresta.organizacao_id,
      evento: 'aresta_grafo_deletada',
      categoria_evento: 'grafo',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'aresta_grafo',
      id_entidade: id,
      dados_antes: aresta,
    });

    revalidatePath(`/app/casos/${aresta.caso_id}`);

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar aresta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar aresta',
    };
  }
}

// ============================================================================
// Recalcular Força dos Nós
// ============================================================================

export async function recalcularForcas(casoId: number) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar todos os nós e arestas do caso
    const [{ data: nos }, { data: arestas }] = await Promise.all([
      supabase
        .from('nos_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId),
      supabase
        .from('arestas_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId),
    ]);

    if (!nos || !arestas) throw new Error('Erro ao buscar grafo');

    const nosTyped = nos as any[];
    const arestasTyped = arestas as any[];

    // Calcular força baseada nas conexões
    const forcasPorNo: Record<string, number> = {};

    for (const no of nosTyped) {
      let forcaBase = no.forca || 0.5;

      // Arestas que chegam (suporte)
      const suportes = arestasTyped.filter(
        (a) => a.no_destino === no.id && a.relacao === 'suportado_por'
      );
      const corroboracoes = arestasTyped.filter(
        (a) =>
          (a.no_destino === no.id || a.no_origem === no.id) &&
          a.relacao === 'corrobora'
      );
      const enfraquecimentos = arestasTyped.filter(
        (a) => a.no_destino === no.id && a.relacao === 'enfraquecido_por'
      );
      const contradicoes = arestasTyped.filter(
        (a) =>
          (a.no_destino === no.id || a.no_origem === no.id) &&
          a.relacao === 'contradiz'
      );

      // Ajustar força
      for (const suporte of suportes) {
        forcaBase += (suporte.peso || 0.5) * 0.1;
      }
      for (const corroboracao of corroboracoes) {
        forcaBase += (corroboracao.peso || 0.5) * 0.05;
      }
      for (const enfraquecimento of enfraquecimentos) {
        forcaBase -= (enfraquecimento.peso || 0.5) * 0.15;
      }
      for (const contradicao of contradicoes) {
        forcaBase -= (contradicao.peso || 0.5) * 0.1;
      }

      // Limitar entre 0 e 1
      forcasPorNo[no.id] = Math.max(0, Math.min(1, forcaBase));
    }

    // Atualizar forças no banco
    for (const [noId, novaForca] of Object.entries(forcasPorNo)) {
      await (supabase as any)
        .from('nos_grafo_evidencias')
        .update({ forca: novaForca, atualizado_em: new Date().toISOString() })
        .eq('id', noId);
    }

    revalidatePath(`/app/casos/${casoId}`);

    return { success: true, data: forcasPorNo };
  } catch (error) {
    console.error('Erro ao recalcular forças:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao recalcular forças',
    };
  }
}

// ============================================================================
// Analisar Grafo (gerar insights)
// ============================================================================

interface AnaliseGrafo {
  totalNos: number;
  nosPorTipo: Record<string, number>;
  totalArestas: number;
  forcaMedia: number;
  nosFortes: Array<{ id: string; titulo: string; forca: number }>;
  nosFracos: Array<{ id: string; titulo: string; forca: number }>;
  lacunas: string[];
  recomendacoes: string[];
}

export async function analisarGrafo(casoId: number): Promise<{
  success: boolean;
  data?: AnaliseGrafo;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();

  try {
    const [{ data: nos }, { data: arestas }] = await Promise.all([
      supabase
        .from('nos_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId),
      supabase
        .from('arestas_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId),
    ]);

    if (!nos) throw new Error('Erro ao buscar nós');

    const nosTyped = nos as any[];
    const arestasTyped = (arestas || []) as any[];

    // Estatísticas básicas
    const nosPorTipo: Record<string, number> = {};
    let somaForcas = 0;

    for (const no of nosTyped) {
      nosPorTipo[no.tipo_no] = (nosPorTipo[no.tipo_no] || 0) + 1;
      somaForcas += no.forca || 0.5;
    }

    const forcaMedia = nosTyped.length > 0 ? somaForcas / nosTyped.length : 0;

    // Nós fortes e fracos
    const nosOrdenados = [...nosTyped].sort(
      (a, b) => (b.forca || 0.5) - (a.forca || 0.5)
    );

    const nosFortes = nosOrdenados.slice(0, 5).map((n) => ({
      id: n.id,
      titulo: n.titulo,
      forca: n.forca || 0.5,
    }));

    const nosFracos = nosOrdenados
      .slice(-5)
      .reverse()
      .map((n) => ({
        id: n.id,
        titulo: n.titulo,
        forca: n.forca || 0.5,
      }));

    // Detectar lacunas
    const lacunas: string[] = [];
    const recomendacoes: string[] = [];

    // Pedidos sem fundamento legal
    const pedidos = nosTyped.filter((n) => n.tipo_no === 'pedido');
    for (const pedido of pedidos) {
      const temFundamento = arestasTyped.some(
        (a) =>
          a.no_origem === pedido.id && a.relacao === 'fundamentado_por'
      );
      if (!temFundamento) {
        lacunas.push(`Pedido "${pedido.titulo}" sem fundamento legal vinculado`);
        recomendacoes.push(`Adicionar base legal para o pedido "${pedido.titulo}"`);
      }
    }

    // Fatos sem prova
    const fatos = nosTyped.filter((n) => n.tipo_no === 'fato');
    for (const fato of fatos) {
      const temProva = arestasTyped.some(
        (a) => a.no_destino === fato.id && a.relacao === 'suportado_por'
      );
      if (!temProva) {
        lacunas.push(`Fato "${fato.titulo}" sem prova vinculada`);
        recomendacoes.push(`Buscar evidência para o fato "${fato.titulo}"`);
      }
    }

    // Riscos não mitigados
    const riscos = nosTyped.filter((n) => n.tipo_no === 'risco' && (n.forca || 0.5) > 0.6);
    for (const risco of riscos) {
      recomendacoes.push(`Alto risco detectado: "${risco.titulo}" - avaliar estratégia de mitigação`);
    }

    const analise: AnaliseGrafo = {
      totalNos: nosTyped.length,
      nosPorTipo,
      totalArestas: arestasTyped.length,
      forcaMedia,
      nosFortes,
      nosFracos,
      lacunas,
      recomendacoes,
    };

    return { success: true, data: analise };
  } catch (error) {
    console.error('Erro ao analisar grafo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao analisar grafo',
    };
  }
}

// ============================================================================
// Construir Grafo Automaticamente (chamado por IA)
// ============================================================================

interface ConstruirGrafoParams {
  casoId: number;
  organizacaoId: string;
  nos: Array<{
    tipoNo: keyof typeof TIPOS_NO;
    titulo: string;
    conteudo?: string;
    referencias?: Record<string, unknown>;
    forca?: number;
    idTemporario: string; // Para mapear arestas
  }>;
  arestas: Array<{
    origemIdTemporario: string;
    destinoIdTemporario: string;
    relacao: keyof typeof TIPOS_RELACAO;
    peso?: number;
  }>;
  idExecucaoIA: string;
}

export async function construirGrafoAutomaticamente(params: ConstruirGrafoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Mapa de IDs temporários para IDs reais
    const mapaIds: Record<string, string> = {};

    // Inserir nós
    for (const no of params.nos) {
      const { data: noInserido, error } = await (supabase as any)
        .from('nos_grafo_evidencias')
        .insert({
          organizacao_id: params.organizacaoId,
          caso_id: params.casoId,
          tipo_no: no.tipoNo,
          titulo: no.titulo,
          conteudo: no.conteudo,
          referencias: no.referencias,
          forca: no.forca ?? 0.5,
          gerado_por_ia: true,
          id_execucao_ia: params.idExecucaoIA,
        })
        .select()
        .single();

      if (error) throw error;
      mapaIds[no.idTemporario] = noInserido.id;
    }

    // Inserir arestas
    const arestasParaInserir: ArestaGrafoInsert[] = params.arestas.map((aresta) => ({
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      no_origem: mapaIds[aresta.origemIdTemporario],
      no_destino: mapaIds[aresta.destinoIdTemporario],
      relacao: aresta.relacao,
      peso: aresta.peso ?? 0.5,
      gerado_por_ia: true,
    }));

    const { data: arestas, error: arestaError } = await (supabase as any)
      .from('arestas_grafo_evidencias')
      .insert(arestasParaInserir)
      .select();

    if (arestaError) throw arestaError;

    // Recalcular forças
    await recalcularForcas(params.casoId);

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'grafo_construido_ia',
      categoria_evento: 'grafo',
      tipo_ator: 'agente',
      tipo_agente_ator: 'mapeador_evidencias',
      tipo_entidade: 'caso',
      id_entidade: params.casoId.toString(),
      dados_depois: {
        nos_criados: params.nos.length,
        arestas_criadas: arestas.length,
      },
      id_execucao_ia: params.idExecucaoIA,
    });

    // Emitir evento
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: params.organizacaoId,
      nome_evento: 'grafo_construido',
      tipo_entidade: 'caso',
      id_entidade: params.casoId.toString(),
      payload: {
        nos_criados: params.nos.length,
        arestas_criadas: arestas.length,
        id_execucao_ia: params.idExecucaoIA,
      },
    });

    revalidatePath(`/app/casos/${params.casoId}`);
    revalidatePath('/app/analise');

    return {
      success: true,
      data: {
        nosCriados: params.nos.length,
        arestasCriadas: arestas.length,
        mapaIds,
      },
    };
  } catch (error) {
    console.error('Erro ao construir grafo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao construir grafo',
    };
  }
}

// ============================================================================
// Exportar Grafo para Visualização
// ============================================================================

export async function exportarGrafoParaVisualizacao(casoId: number) {
  const supabase = await createServerSupabaseClient();

  try {
    const [{ data: nos }, { data: arestas }] = await Promise.all([
      supabase
        .from('nos_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId),
      supabase
        .from('arestas_grafo_evidencias')
        .select('*')
        .eq('caso_id', casoId),
    ]);

    if (!nos || !arestas) throw new Error('Erro ao buscar grafo');

    const nosTyped = nos as any[];
    const arestasTyped = arestas as any[];

    // Formato para D3/Cytoscape
    const nodes = nosTyped.map((no) => ({
      id: no.id,
      label: no.titulo,
      type: no.tipo_no,
      forca: no.forca || 0.5,
      color: TIPOS_NO[no.tipo_no as keyof typeof TIPOS_NO]?.cor || '#999',
      geradoPorIA: no.gerado_por_ia,
    }));

    const edges = arestasTyped.map((aresta) => ({
      id: aresta.id,
      source: aresta.no_origem,
      target: aresta.no_destino,
      label: aresta.relacao,
      weight: aresta.peso || 0.5,
      color: TIPOS_RELACAO[aresta.relacao as keyof typeof TIPOS_RELACAO]?.cor || '#999',
    }));

    return {
      success: true,
      data: { nodes, edges },
    };
  } catch (error) {
    console.error('Erro ao exportar grafo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao exportar grafo',
    };
  }
}
