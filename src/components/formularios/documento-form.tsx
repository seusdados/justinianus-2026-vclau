'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadDocumento, atualizarDocumento } from '@/app/actions'
import type { Documento } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const TIPOS_DOCUMENTO = [
  { valor: 'peticao', rotulo: 'petição', icone: '📄', descricao: 'petições iniciais, contestações, recursos' },
  { valor: 'contrato', rotulo: 'contrato', icone: '📝', descricao: 'contratos, aditivos, distratos' },
  { valor: 'procuracao', rotulo: 'procuração', icone: '🔐', descricao: 'procurações e substabelecimentos' },
  { valor: 'decisao', rotulo: 'decisão', icone: '⚖️', descricao: 'sentenças, acórdãos, despachos' },
  { valor: 'prova', rotulo: 'prova', icone: '🔍', descricao: 'documentos probatórios, laudos, perícias' },
  { valor: 'comunicacao', rotulo: 'comunicação', icone: '💬', descricao: 'e-mails, notificações, ofícios' },
  { valor: 'identidade', rotulo: 'identidade', icone: '🪪', descricao: 'documentos pessoais, comprovantes' },
  { valor: 'financeiro', rotulo: 'financeiro', icone: '💰', descricao: 'recibos, notas fiscais, extratos' },
  { valor: 'outro', rotulo: 'outro', icone: '📎', descricao: 'outros documentos' },
] as const

const NIVEIS_VISIBILIDADE = [
  { valor: 'interno', rotulo: 'interno', icone: '🔒', descricao: 'apenas equipe do escritório' },
  { valor: 'cliente', rotulo: 'cliente', icone: '👤', descricao: 'visível para o cliente no portal' },
  { valor: 'convidado', rotulo: 'convidado', icone: '👥', descricao: 'visível para convidados externos' },
] as const

const EXTENSOES_PERMITIDAS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.txt', '.rtf', '.odt', '.ods', '.odp'
]

const TAMANHO_MAXIMO_MB = 50

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface DocumentoFormProps {
  casoId?: number
  leadId?: string
  documentoExistente?: Documento
  onSucesso?: (documento: Documento) => void
  onCancelar?: () => void
}

interface ArquivoSelecionado {
  arquivo: File
  preview?: string
  progresso: number
  erro?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 bytes'
  const k = 1024
  const tamanhos = ['bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i]
}

function obterIconeArquivo(nomeArquivo: string): string {
  const extensao = nomeArquivo.split('.').pop()?.toLowerCase()
  switch (extensao) {
    case 'pdf': return '📕'
    case 'doc':
    case 'docx': return '📘'
    case 'xls':
    case 'xlsx': return '📗'
    case 'ppt':
    case 'pptx': return '📙'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp': return '🖼️'
    default: return '📄'
  }
}

function validarArquivo(arquivo: File): string | null {
  // Verificar extensão
  const extensao = '.' + arquivo.name.split('.').pop()?.toLowerCase()
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    return `extensão ${extensao} não permitida`
  }
  
  // Verificar tamanho
  const tamanhoMB = arquivo.size / (1024 * 1024)
  if (tamanhoMB > TAMANHO_MAXIMO_MB) {
    return `tamanho ${tamanhoMB.toFixed(1)}MB excede limite de ${TAMANHO_MAXIMO_MB}MB`
  }
  
  return null
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function DocumentoForm({
  casoId,
  leadId,
  documentoExistente,
  onSucesso,
  onCancelar
}: DocumentoFormProps) {
  const modoEdicao = !!documentoExistente
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  
  // Estado do formulário
  const [titulo, setTitulo] = useState(documentoExistente?.titulo || '')
  const [descricao, setDescricao] = useState(documentoExistente?.descricao || '')
  const [tipoDocumento, setTipoDocumento] = useState(documentoExistente?.tipo_documento || '')
  const [visibilidade, setVisibilidade] = useState<'interno' | 'cliente' | 'convidado'>(
    (documentoExistente?.visibilidade as 'interno' | 'cliente' | 'convidado') || 'interno'
  )
  
  // Estado LGPD
  const [contemDadosPessoais, setContemDadosPessoais] = useState(documentoExistente?.contem_dados_pessoais || false)
  const [solicitarAnonimizacao, setSolicitarAnonimizacao] = useState(false)
  
  // Estado de arquivo
  const [arquivoSelecionado, setArquivoSelecionado] = useState<ArquivoSelecionado | null>(null)
  const [arrastando, setArrastando] = useState(false)
  
  // Estado de UI
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS DE ARQUIVO
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleArquivoSelecionado = useCallback((arquivo: File) => {
    const erroValidacao = validarArquivo(arquivo)
    
    if (erroValidacao) {
      setArquivoSelecionado({
        arquivo,
        progresso: 0,
        erro: erroValidacao
      })
      return
    }
    
    // Gerar preview se for imagem
    let preview: string | undefined
    if (arquivo.type.startsWith('image/')) {
      preview = URL.createObjectURL(arquivo)
    }
    
    // Auto-preencher título se vazio
    if (!titulo) {
      const nomeBase = arquivo.name.split('.').slice(0, -1).join('.')
      setTitulo(nomeBase.replace(/[-_]/g, ' '))
    }
    
    setArquivoSelecionado({
      arquivo,
      preview,
      progresso: 0
    })
    setErro(null)
  }, [titulo])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files
    if (arquivos && arquivos.length > 0) {
      handleArquivoSelecionado(arquivos[0])
    }
  }
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    
    const arquivos = e.dataTransfer.files
    if (arquivos && arquivos.length > 0) {
      handleArquivoSelecionado(arquivos[0])
    }
  }, [handleArquivoSelecionado])
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastando(true)
  }
  
  const handleDragLeave = () => {
    setArrastando(false)
  }
  
  const removerArquivo = () => {
    if (arquivoSelecionado?.preview) {
      URL.revokeObjectURL(arquivoSelecionado.preview)
    }
    setArquivoSelecionado(null)
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = ''
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    
    // Validações
    if (!titulo.trim()) {
      setErro('título é obrigatório')
      return
    }
    
    if (!modoEdicao && !arquivoSelecionado) {
      setErro('selecione um arquivo')
      return
    }
    
    if (arquivoSelecionado?.erro) {
      setErro('arquivo inválido')
      return
    }
    
    if (!casoId && !leadId) {
      setErro('documento deve estar vinculado a um caso ou lead')
      return
    }
    
    setEnviando(true)
    
    try {
      if (modoEdicao && documentoExistente) {
        // Modo edição - atualizar metadados
        const resultado = await atualizarDocumento(documentoExistente.id, {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          tipo_documento: tipoDocumento || undefined,
          visibilidade,
          contem_dados_pessoais: contemDadosPessoais,
          // Se solicitou anonimização, marcar para processamento
          ...(solicitarAnonimizacao && !documentoExistente.dados_pessoais_anonimizados ? {
            dados_pessoais_anonimizados: false // Será processado por agente
          } : {})
        })
        
        if (resultado.success && resultado.data) {
          onSucesso?.(resultado.data)
        } else {
          setErro(resultado.error || 'erro ao atualizar documento')
        }
      } else if (arquivoSelecionado) {
        // Modo criação - upload
        // Simular progresso
        const intervalo = setInterval(() => {
          setArquivoSelecionado(prev => 
            prev ? { ...prev, progresso: Math.min(prev.progresso + 10, 90) } : null
          )
        }, 200)
        
        const resultado = await uploadDocumento({
          organizacaoId: '', // TODO: obter da sessão
          casoId,
          leadId,
          arquivo: arquivoSelecionado.arquivo,
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          tipoDocumento: tipoDocumento || undefined,
          visibilidade,
        })
        
        clearInterval(intervalo)
        
        if (resultado.success && resultado.data) {
          setArquivoSelecionado(prev => prev ? { ...prev, progresso: 100 } : null)
          onSucesso?.(resultado.data)
        } else {
          setErro(resultado.error || 'erro ao enviar documento')
        }
      }
    } catch (err) {
      setErro('erro ao processar documento')
      console.error(err)
    } finally {
      setEnviando(false)
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-light text-zinc-100">
          {modoEdicao ? 'editar documento' : 'enviar documento'}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          {modoEdicao 
            ? 'atualize os metadados do documento'
            : 'arraste ou selecione um arquivo para upload'
          }
        </p>
      </div>
      
      {/* Área de Upload (apenas no modo criação) */}
      {!modoEdicao && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputArquivoRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${arrastando 
              ? 'border-amber-500 bg-amber-500/10' 
              : arquivoSelecionado?.erro
                ? 'border-red-500/50 bg-red-500/5'
                : arquivoSelecionado
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
            }
          `}
        >
          <input
            ref={inputArquivoRef}
            type="file"
            onChange={handleInputChange}
            accept={EXTENSOES_PERMITIDAS.join(',')}
            className="hidden"
          />
          
          {arquivoSelecionado ? (
            <div className="space-y-4">
              {/* Preview ou ícone */}
              <div className="flex justify-center">
                {arquivoSelecionado.preview ? (
                  <img 
                    src={arquivoSelecionado.preview} 
                    alt="preview" 
                    className="max-h-32 rounded-lg"
                  />
                ) : (
                  <span className="text-5xl">
                    {obterIconeArquivo(arquivoSelecionado.arquivo.name)}
                  </span>
                )}
              </div>
              
              {/* Info do arquivo */}
              <div>
                <p className="text-zinc-200 font-medium">
                  {arquivoSelecionado.arquivo.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {formatarTamanhoArquivo(arquivoSelecionado.arquivo.size)}
                </p>
              </div>
              
              {/* Erro ou Progresso */}
              {arquivoSelecionado.erro ? (
                <p className="text-sm text-red-400">
                  ⚠️ {arquivoSelecionado.erro}
                </p>
              ) : arquivoSelecionado.progresso > 0 ? (
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${arquivoSelecionado.progresso}%` }}
                  />
                </div>
              ) : null}
              
              {/* Botão remover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removerArquivo()
                }}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                remover arquivo
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-4xl">📁</span>
              <p className="text-zinc-300">
                arraste um arquivo aqui ou clique para selecionar
              </p>
              <p className="text-sm text-zinc-500">
                PDF, Word, Excel, PowerPoint, imagens • máx {TAMANHO_MAXIMO_MB}MB
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Documento existente (modo edição) */}
      {modoEdicao && documentoExistente && (
        <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {obterIconeArquivo(documentoExistente.nome_arquivo || '')}
            </span>
            <div>
              <p className="text-zinc-200 font-medium">
                {documentoExistente.nome_arquivo}
              </p>
              <p className="text-sm text-zinc-500">
                {formatarTamanhoArquivo(documentoExistente.tamanho_arquivo || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Campos do formulário */}
      <div className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            título *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="nome do documento"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 placeholder:text-zinc-600
              focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
          />
        </div>
        
        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="descrição ou observações sobre o documento..."
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 placeholder:text-zinc-600 resize-none
              focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25"
          />
        </div>
        
        {/* Tipo de documento */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            tipo de documento
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS_DOCUMENTO.map((tipo) => (
              <button
                key={tipo.valor}
                type="button"
                onClick={() => setTipoDocumento(tipo.valor)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${tipoDocumento === tipo.valor
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                  }
                `}
              >
                <span className="text-lg">{tipo.icone}</span>
                <p className="text-sm text-zinc-200 mt-1">{tipo.rotulo}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Visibilidade */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            visibilidade
          </label>
          <div className="grid grid-cols-3 gap-2">
            {NIVEIS_VISIBILIDADE.map((nivel) => (
              <button
                key={nivel.valor}
                type="button"
                onClick={() => setVisibilidade(nivel.valor)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${visibilidade === nivel.valor
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                  }
                `}
              >
                <span className="text-lg">{nivel.icone}</span>
                <p className="text-sm text-zinc-200 mt-1">{nivel.rotulo}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{nivel.descricao}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Seção LGPD */}
        <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <span>🛡️</span>
            <span className="text-sm font-medium">proteção de dados (LGPD)</span>
          </div>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={contemDadosPessoais}
              onChange={(e) => setContemDadosPessoais(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 
                text-amber-500 focus:ring-amber-500/25"
            />
            <div>
              <p className="text-zinc-200 text-sm">documento contém dados pessoais</p>
              <p className="text-xs text-zinc-500">
                CPF, RG, endereço, dados de saúde, financeiros ou outros dados sensíveis
              </p>
            </div>
          </label>
          
          {contemDadosPessoais && (
            <label className="flex items-start gap-3 cursor-pointer pl-7">
              <input
                type="checkbox"
                checked={solicitarAnonimizacao}
                onChange={(e) => setSolicitarAnonimizacao(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 
                  text-amber-500 focus:ring-amber-500/25"
              />
              <div>
                <p className="text-zinc-200 text-sm">solicitar anonimização automática</p>
                <p className="text-xs text-zinc-500">
                  IA irá identificar e mascarar dados pessoais automaticamente
                </p>
              </div>
            </label>
          )}
        </div>
      </div>
      
      {/* Erro */}
      {erro && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">⚠️ {erro}</p>
        </div>
      )}
      
      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="px-6 py-2.5 text-zinc-400 hover:text-zinc-200 
              transition-colors disabled:opacity-50"
          >
            cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={enviando || (!modoEdicao && (!arquivoSelecionado || !!arquivoSelecionado.erro))}
          className="px-6 py-2.5 bg-amber-500 text-zinc-900 font-medium rounded-lg
            hover:bg-amber-400 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2"
        >
          {enviando ? (
            <>
              <span className="animate-spin">⏳</span>
              {modoEdicao ? 'salvando...' : 'enviando...'}
            </>
          ) : (
            <>
              {modoEdicao ? '💾 salvar' : '📤 enviar documento'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
