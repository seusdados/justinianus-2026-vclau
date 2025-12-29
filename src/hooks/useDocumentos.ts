'use client';
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types';

type Documento = Database['public']['Tables']['documentos']['Row'];
type DocumentoInsert = Database['public']['Tables']['documentos']['Insert'];
type DocumentoUpdate = Database['public']['Tables']['documentos']['Update'];

// ============================================================================
// useDocumentos - Lista de documentos com filtros
// ============================================================================

interface UseDocumentosOptions {
  organizacaoId?: string;
  casoId?: number;
  leadId?: string;
  tipoDocumento?: string;
  visibilidade?: Documento['visibilidade'] | Documento['visibilidade'][];
  ocrProcessado?: boolean;
  contemDadosPessoais?: boolean;
  limite?: number;
  ordenarPor?: keyof Documento;
  ordem?: 'asc' | 'desc';
}

interface UseDocumentosReturn {
  documentos: Documento[];
  loading: boolean;
  error: Error | null;
  total: number;
  refetch: () => Promise<void>;
  criar: (data: DocumentoInsert) => Promise<Documento | null>;
  atualizar: (id: string, data: DocumentoUpdate) => Promise<Documento | null>;
  deletar: (id: string) => Promise<boolean>;
  uploadArquivo: (arquivo: File, dados: Partial<DocumentoInsert>) => Promise<Documento | null>;
}

export function useDocumentos(options: UseDocumentosOptions = {}): UseDocumentosReturn {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseClient();

  const fetchDocumentos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('documentos')
        .select('*', { count: 'exact' });

      // Filtros
      if (options.organizacaoId) {
        query = query.eq('organizacao_id', options.organizacaoId);
      }

      if (options.casoId) {
        query = query.eq('caso_id', options.casoId);
      }

      if (options.leadId) {
        query = query.eq('lead_id', options.leadId);
      }

      if (options.tipoDocumento) {
        query = query.eq('tipo_documento', options.tipoDocumento);
      }

      if (options.visibilidade) {
        if (Array.isArray(options.visibilidade)) {
          query = query.in('visibilidade', options.visibilidade);
        } else {
          query = query.eq('visibilidade', options.visibilidade);
        }
      }

      if (options.ocrProcessado !== undefined) {
        query = query.eq('ocr_processado', options.ocrProcessado);
      }

      if (options.contemDadosPessoais !== undefined) {
        query = query.eq('contem_dados_pessoais', options.contemDadosPessoais);
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

      setDocumentos(data || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar documentos'));
    } finally {
      setLoading(false);
    }
  }, [supabase, options]);

  const criar = useCallback(async (data: DocumentoInsert): Promise<Documento | null> => {
    try {
      const { data: newDoc, error: insertError } = await supabase
        .from('documentos')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      setDocumentos(prev => [newDoc, ...prev]);
      setTotal(prev => prev + 1);

      return newDoc;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao criar documento'));
      return null;
    }
  }, [supabase]);

  const atualizar = useCallback(async (id: string, data: DocumentoUpdate): Promise<Documento | null> => {
    try {
      const { data: updatedDoc, error: updateError } = await supabase
        .from('documentos')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setDocumentos(prev => prev.map(d => d.id === id ? updatedDoc : d));

      return updatedDoc;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar documento'));
      return null;
    }
  }, [supabase]);

  const deletar = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Primeiro busca o documento para pegar o caminho do storage
      const doc = documentos.find(d => d.id === id);
      
      if (doc?.caminho_storage) {
        // Remove do storage
        await supabase.storage
          .from('documentos')
          .remove([doc.caminho_storage]);
      }

      // Remove do banco
      const { error: deleteError } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDocumentos(prev => prev.filter(d => d.id !== id));
      setTotal(prev => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao deletar documento'));
      return false;
    }
  }, [supabase, documentos]);

  const uploadArquivo = useCallback(async (
    arquivo: File,
    dados: Partial<DocumentoInsert>
  ): Promise<Documento | null> => {
    try {
      // Gera um nome único para o arquivo
      const timestamp = Date.now();
      const nomeArquivo = `${timestamp}-${arquivo.name}`;
      const caminho = `${dados.organizacao_id}/${dados.caso_id || dados.lead_id}/${nomeArquivo}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(caminho, arquivo);

      if (uploadError) throw uploadError;

      // Cria o registro no banco
      const documentoData: DocumentoInsert = {
        organizacao_id: dados.organizacao_id!,
        caso_id: dados.caso_id,
        lead_id: dados.lead_id,
        titulo: dados.titulo || arquivo.name,
        descricao: dados.descricao,
        tipo_documento: dados.tipo_documento,
        caminho_storage: caminho,
        nome_arquivo: arquivo.name,
        tamanho_arquivo: arquivo.size,
        tipo_mime: arquivo.type,
        visibilidade: dados.visibilidade || 'interno',
        criado_por: dados.criado_por,
      };

      return await criar(documentoData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao fazer upload'));
      return null;
    }
  }, [supabase, criar]);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  return {
    documentos,
    loading,
    error,
    total,
    refetch: fetchDocumentos,
    criar,
    atualizar,
    deletar,
    uploadArquivo,
  };
}

// ============================================================================
// useDocumento - Documento individual
// ============================================================================

interface UseDocumentoReturn {
  documento: Documento | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  obterUrl: () => Promise<string | null>;
}

export function useDocumento(id: string): UseDocumentoReturn {
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = getSupabaseClient();

  const fetchDocumento = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('documentos')
        .select('*')
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setDocumento(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar documento'));
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  const obterUrl = useCallback(async (): Promise<string | null> => {
    if (!documento?.caminho_storage) return null;

    try {
      const { data } = await supabase.storage
        .from('documentos')
        .createSignedUrl(documento.caminho_storage, 3600); // 1 hora

      return data?.signedUrl || null;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao obter URL'));
      return null;
    }
  }, [documento, supabase]);

  useEffect(() => {
    fetchDocumento();
  }, [fetchDocumento]);

  return {
    documento,
    loading,
    error,
    refetch: fetchDocumento,
    obterUrl,
  };
}

// ============================================================================
// useDocumentosCounters - Contadores por tipo/visibilidade
// ============================================================================

interface DocumentosCounters {
  total: number;
  porVisibilidade: {
    interno: number;
    cliente: number;
    convidado: number;
  };
  pendentesOCR: number;
  comDadosPessoais: number;
}

export function useDocumentosCounters(
  organizacaoId?: string,
  casoId?: number
): {
  counters: DocumentosCounters;
  loading: boolean;
} {
  const [counters, setCounters] = useState<DocumentosCounters>({
    total: 0,
    porVisibilidade: {
      interno: 0,
      cliente: 0,
      convidado: 0,
    },
    pendentesOCR: 0,
    comDadosPessoais: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    async function fetchCounters() {
      setLoading(true);

      try {
        let query = supabase
          .from('documentos')
          .select('visibilidade, ocr_processado, contem_dados_pessoais', { count: 'exact' });

        if (organizacaoId) {
          query = query.eq('organizacao_id', organizacaoId);
        }

        if (casoId) {
          query = query.eq('caso_id', casoId);
        }

        const { data, count } = await query;

        if (data) {
          const result: DocumentosCounters = {
            total: count || 0,
            porVisibilidade: {
              interno: 0,
              cliente: 0,
              convidado: 0,
            },
            pendentesOCR: 0,
            comDadosPessoais: 0,
          };

          data.forEach(doc => {
            // Contagem por visibilidade
            if (doc.visibilidade === 'interno') result.porVisibilidade.interno++;
            else if (doc.visibilidade === 'cliente') result.porVisibilidade.cliente++;
            else if (doc.visibilidade === 'convidado') result.porVisibilidade.convidado++;

            // Pendentes OCR
            if (!doc.ocr_processado) result.pendentesOCR++;

            // Com dados pessoais
            if (doc.contem_dados_pessoais) result.comDadosPessoais++;
          });

          setCounters(result);
        }
      } catch (err) {
        console.error('Erro ao buscar contadores:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounters();
  }, [organizacaoId, casoId, supabase]);

  return { counters, loading };
}

// ============================================================================
// Tipos de documento padrão
// ============================================================================

export const TIPOS_DOCUMENTO = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'peticao', label: 'Petição' },
  { value: 'decisao', label: 'Decisão' },
  { value: 'sentenca', label: 'Sentença' },
  { value: 'acordao', label: 'Acórdão' },
  { value: 'prova', label: 'Prova' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'parecer', label: 'Parecer' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'memorial', label: 'Memorial' },
  { value: 'laudo', label: 'Laudo' },
  { value: 'ata', label: 'Ata' },
  { value: 'notificacao', label: 'Notificação' },
  { value: 'certidao', label: 'Certidão' },
  { value: 'documento_pessoal', label: 'Documento Pessoal' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'outro', label: 'Outro' },
] as const;

export type TipoDocumento = typeof TIPOS_DOCUMENTO[number]['value'];
