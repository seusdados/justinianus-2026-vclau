'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types';

type DocumentoInsert = Database['public']['Tables']['documentos']['Insert'];
type DocumentoUpdate = Database['public']['Tables']['documentos']['Update'];

// ============================================================================
// TIPOS DE DOCUMENTO
// ============================================================================

export const TIPOS_DOCUMENTO = [
  'contrato',
  'peticao',
  'decisao',
  'sentenca',
  'acordao',
  'prova',
  'procuracao',
  'parecer',
  'recurso',
  'memorial',
  'laudo',
  'ata',
  'notificacao',
  'certidao',
  'documento_pessoal',
  'comprovante',
  'outro',
] as const;

// ============================================================================
// Upload de Documento
// ============================================================================

interface UploadDocumentoParams {
  organizacaoId: string;
  titulo: string;
  descricao?: string;
  tipoDocumento?: string;
  arquivo: File;
  casoId?: number;
  leadId?: string;
  visibilidade?: 'interno' | 'cliente' | 'convidado';
  criadoPor?: string;
}

export async function uploadDocumento(params: UploadDocumentoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Validar que tem casoId OU leadId
    if (!params.casoId && !params.leadId) {
      throw new Error('Documento precisa estar vinculado a um caso ou lead');
    }

    // Gerar caminho único no storage
    const timestamp = Date.now();
    const nomeArquivoSanitizado = params.arquivo.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    const caminhoStorage = `${params.organizacaoId}/${params.casoId || params.leadId}/${timestamp}_${nomeArquivoSanitizado}`;

    // Upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(caminhoStorage, params.arquivo, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Criar registro do documento
    const documentoData: DocumentoInsert = {
      organizacao_id: params.organizacaoId,
      caso_id: params.casoId,
      lead_id: params.leadId,
      titulo: params.titulo,
      descricao: params.descricao,
      tipo_documento: params.tipoDocumento,
      caminho_storage: uploadData.path,
      nome_arquivo: params.arquivo.name,
      tamanho_arquivo: params.arquivo.size,
      tipo_mime: params.arquivo.type,
      visibilidade: params.visibilidade || 'interno',
      criado_por: params.criadoPor,
      ocr_processado: false,
      contem_dados_pessoais: false,
    };

    const { data: documento, error: docError } = await (supabase as any)
      .from('documentos')
      .insert(documentoData)
      .select()
      .single();

    if (docError) throw docError;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: params.organizacaoId,
      evento: 'documento_enviado',
      categoria_evento: 'documento',
      tipo_ator: 'usuario',
      id_usuario_ator: params.criadoPor,
      tipo_entidade: 'documento',
      id_entidade: documento.id,
      dados_depois: documento,
    });

    // Emitir evento para processamento (OCR, extração, etc.)
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: params.organizacaoId,
      nome_evento: 'documento_enviado',
      tipo_entidade: 'documento',
      id_entidade: documento.id,
      payload: {
        documento_id: documento.id,
        tipo_mime: params.arquivo.type,
        requer_ocr: params.arquivo.type === 'application/pdf' || params.arquivo.type.startsWith('image/'),
      },
      usuario_ator_id: params.criadoPor,
    });

    revalidatePath('/app/analise');
    if (params.casoId) revalidatePath(`/app/casos/${params.casoId}`);
    if (params.leadId) revalidatePath(`/app/captacao/${params.leadId}`);

    return { success: true, data: documento };
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer upload',
    };
  }
}

// ============================================================================
// Atualizar Documento
// ============================================================================

export async function atualizarDocumento(
  id: string,
  data: DocumentoUpdate,
  usuarioId?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: docAnterior } = await (supabase as any)
      .from('documentos')
      .select('*')
      .eq('id', id)
      .single();

    const { data: documento, error } = await (supabase as any)
      .from('documentos')
      .update({ ...data, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    if (docAnterior) {
      await (supabase as any).from('logs_auditoria').insert({
        organizacao_id: documento.organizacao_id,
        evento: 'documento_atualizado',
        categoria_evento: 'documento',
        tipo_ator: 'usuario',
        id_usuario_ator: usuarioId,
        tipo_entidade: 'documento',
        id_entidade: id,
        dados_antes: docAnterior,
        dados_depois: documento,
      });
    }

    revalidatePath('/app/analise');

    return { success: true, data: documento };
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar documento',
    };
  }
}

// ============================================================================
// Deletar Documento
// ============================================================================

export async function deletarDocumento(id: string, usuarioId?: string) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar documento para obter caminho do storage
    const { data: documento, error: fetchError } = await (supabase as any)
      .from('documentos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Remover do storage
    if (documento.caminho_storage) {
      const { error: storageError } = await supabase.storage
        .from('documentos')
        .remove([documento.caminho_storage]);

      if (storageError) {
        console.warn('Erro ao remover arquivo do storage:', storageError);
      }
    }

    // Deletar registro
    const { error: deleteError } = await (supabase as any)
      .from('documentos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: documento.organizacao_id,
      evento: 'documento_deletado',
      categoria_evento: 'documento',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'documento',
      id_entidade: id,
      dados_antes: documento,
    });

    revalidatePath('/app/analise');

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar documento',
    };
  }
}

// ============================================================================
// Processar OCR
// ============================================================================

interface ProcessarOCRParams {
  documentoId: string;
  textoOCR: string;
  usuarioId?: string;
  idExecucaoIA?: string;
}

export async function registrarOCR(params: ProcessarOCRParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: documento, error } = await (supabase as any)
      .from('documentos')
      .update({
        ocr_processado: true,
        texto_ocr: params.textoOCR,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.documentoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: documento.organizacao_id,
      evento: 'ocr_processado',
      categoria_evento: 'documento',
      tipo_ator: params.idExecucaoIA ? 'agente' : 'sistema',
      tipo_agente_ator: params.idExecucaoIA ? 'processador_docs' : undefined,
      tipo_entidade: 'documento',
      id_entidade: params.documentoId,
      id_execucao_ia: params.idExecucaoIA,
    });

    return { success: true, data: documento };
  } catch (error) {
    console.error('Erro ao registrar OCR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar OCR',
    };
  }
}

// ============================================================================
// Detectar Dados Pessoais (LGPD)
// ============================================================================

interface DetectarDadosPessoaisParams {
  documentoId: string;
  contemDadosPessoais: boolean;
  mapaAnonimizacao?: Record<string, unknown>;
  idExecucaoIA?: string;
}

export async function registrarDadosPessoais(params: DetectarDadosPessoaisParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: documento, error } = await (supabase as any)
      .from('documentos')
      .update({
        contem_dados_pessoais: params.contemDadosPessoais,
        mapa_anonimizacao: params.mapaAnonimizacao,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.documentoId)
      .select()
      .single();

    if (error) throw error;

    // Se contém dados pessoais, emitir evento para anonimização
    if (params.contemDadosPessoais) {
      await (supabase as any).from('eventos_dominio').insert({
        organizacao_id: documento.organizacao_id,
        nome_evento: 'dados_pessoais_detectados',
        tipo_entidade: 'documento',
        id_entidade: params.documentoId,
        payload: {
          documento_id: params.documentoId,
          mapa_anonimizacao: params.mapaAnonimizacao,
        },
      });
    }

    return { success: true, data: documento };
  } catch (error) {
    console.error('Erro ao registrar dados pessoais:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar dados pessoais',
    };
  }
}

// ============================================================================
// Anonimizar Documento
// ============================================================================

interface AnonimizarDocumentoParams {
  documentoId: string;
  textoAnonimizado: string;
  mapaAnonimizacao: Record<string, string>;
  idExecucaoIA?: string;
}

export async function anonimizarDocumento(params: AnonimizarDocumentoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: documento, error } = await (supabase as any)
      .from('documentos')
      .update({
        texto_ocr: params.textoAnonimizado,
        dados_pessoais_anonimizados: true,
        mapa_anonimizacao: params.mapaAnonimizacao,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.documentoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: documento.organizacao_id,
      evento: 'documento_anonimizado',
      categoria_evento: 'lgpd',
      tipo_ator: 'agente',
      tipo_agente_ator: 'risco_lgpd',
      tipo_entidade: 'documento',
      id_entidade: params.documentoId,
      id_execucao_ia: params.idExecucaoIA,
    });

    return { success: true, data: documento };
  } catch (error) {
    console.error('Erro ao anonimizar documento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao anonimizar documento',
    };
  }
}

// ============================================================================
// Registrar Análise IA do Documento
// ============================================================================

interface RegistrarAnaliseIAParams {
  documentoId: string;
  resumoIA: string;
  entidadesIA: Record<string, unknown>;
  classificacaoIA: Record<string, unknown>;
  idExecucaoIA: string;
}

export async function registrarAnaliseIA(params: RegistrarAnaliseIAParams) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: documento, error } = await (supabase as any)
      .from('documentos')
      .update({
        resumo_ia: params.resumoIA,
        entidades_ia: params.entidadesIA,
        classificacao_ia: params.classificacaoIA,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', params.documentoId)
      .select()
      .single();

    if (error) throw error;

    // Emitir evento de documento analisado
    await (supabase as any).from('eventos_dominio').insert({
      organizacao_id: documento.organizacao_id,
      nome_evento: 'documento_analisado',
      tipo_entidade: 'documento',
      id_entidade: params.documentoId,
      payload: {
        resumo: params.resumoIA,
        entidades: params.entidadesIA,
        classificacao: params.classificacaoIA,
      },
    });

    return { success: true, data: documento };
  } catch (error) {
    console.error('Erro ao registrar análise IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar análise IA',
    };
  }
}

// ============================================================================
// Alterar Visibilidade
// ============================================================================

export async function alterarVisibilidade(
  documentoId: string,
  visibilidade: 'interno' | 'cliente' | 'convidado',
  usuarioId?: string
) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: docAnterior } = await (supabase as any)
      .from('documentos')
      .select('*')
      .eq('id', documentoId)
      .single();

    const { data: documento, error } = await (supabase as any)
      .from('documentos')
      .update({
        visibilidade,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', documentoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: documento.organizacao_id,
      evento: 'visibilidade_alterada',
      categoria_evento: 'documento',
      tipo_ator: 'usuario',
      id_usuario_ator: usuarioId,
      tipo_entidade: 'documento',
      id_entidade: documentoId,
      dados_antes: { visibilidade: docAnterior?.visibilidade },
      dados_depois: { visibilidade },
    });

    revalidatePath('/app/analise');

    return { success: true, data: documento };
  } catch (error) {
    console.error('Erro ao alterar visibilidade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao alterar visibilidade',
    };
  }
}

// ============================================================================
// Obter URL Assinada para Download
// ============================================================================

export async function obterUrlDownload(documentoId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: documento, error: fetchError } = await (supabase as any)
      .from('documentos')
      .select('caminho_storage, nome_arquivo')
      .eq('id', documentoId)
      .single();

    if (fetchError) throw fetchError;

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documentos')
      .createSignedUrl(documento.caminho_storage, 3600); // 1 hora

    if (urlError) throw urlError;

    return {
      success: true,
      data: {
        url: signedUrl.signedUrl,
        nomeArquivo: documento.nome_arquivo,
      },
    };
  } catch (error) {
    console.error('Erro ao obter URL de download:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter URL',
    };
  }
}

// ============================================================================
// Copiar Documento para Outro Caso
// ============================================================================

interface CopiarDocumentoParams {
  documentoId: string;
  novoCasoId: number;
  usuarioId?: string;
}

export async function copiarDocumentoParaCaso(params: CopiarDocumentoParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Buscar documento original
    const { data: original, error: fetchError } = await (supabase as any)
      .from('documentos')
      .select('*')
      .eq('id', params.documentoId)
      .single();

    if (fetchError) throw fetchError;

    // Copiar arquivo no storage
    const novoCaminho = original.caminho_storage.replace(
      /^[^/]+\/[^/]+\//,
      `${original.organizacao_id}/${params.novoCasoId}/`
    );

    const { error: copyError } = await supabase.storage
      .from('documentos')
      .copy(original.caminho_storage, novoCaminho);

    if (copyError) throw copyError;

    // Criar novo registro
    const { data: novoDoc, error: insertError } = await (supabase as any)
      .from('documentos')
      .insert({
        ...original,
        id: undefined,
        caso_id: params.novoCasoId,
        lead_id: null,
        caminho_storage: novoCaminho,
        criado_por: params.usuarioId,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Registrar auditoria
    await (supabase as any).from('logs_auditoria').insert({
      organizacao_id: original.organizacao_id,
      evento: 'documento_copiado',
      categoria_evento: 'documento',
      tipo_ator: 'usuario',
      id_usuario_ator: params.usuarioId,
      tipo_entidade: 'documento',
      id_entidade: novoDoc.id,
      dados_depois: {
        documento_original_id: params.documentoId,
        novo_caso_id: params.novoCasoId,
      },
    });

    revalidatePath(`/app/casos/${params.novoCasoId}`);

    return { success: true, data: novoDoc };
  } catch (error) {
    console.error('Erro ao copiar documento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao copiar documento',
    };
  }
}
