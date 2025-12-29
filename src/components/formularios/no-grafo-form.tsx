'use client'

import { useState, useEffect } from 'react'
import { 
  Circle, 
  FileText, 
  MessageSquare, 
  Target, 
  Scale, 
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  Gauge,
  Save,
  ChevronDown
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface NoGrafo {
  id?: string
  organizacao_id?: string
  caso_id: number
  tipo_no: TipoNo
  titulo: string
  conteudo?: string
  referencias?: ReferenciaNo[]
  forca: number
  gerado_por_ia?: boolean
  id_execucao_ia?: string
  confianca_ia?: number
  criado_por?: string
  criado_em?: string
  atualizado_em?: string
}

export type TipoNo = 'fato' | 'prova' | 'alegacao' | 'pedido' | 'base_legal' | 'risco'

export interface ReferenciaNo {
  documento_id: string
  documento_titulo?: string
  pagina?: number
  trecho?: string
  timestamp?: string
}

interface Documento {
  id: string
  titulo: string
  tipo_documento?: string
}

interface NoGrafoFormProps {
  casoId: number
  no?: NoGrafo
  documentos?: Documento[]
  onSucesso?: (no: NoGrafo) => void
  onCancelar?: () => void
  tipoInicial?: TipoNo
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const TIPOS_NO: Record<TipoNo, { 
  label: string
  descricao: string
  cor: string
  corBg: string
  icone: React.ElementType
  exemplos: string[]
}> = {
  fato: {
    label: 'Fato',
    descricao: 'Alegação fática relevante para o caso',
    cor: 'text-blue-400',
    corBg: 'bg-blue-500/20 border-blue-500/50',
    icone: Circle,
    exemplos: [
      'Autor trabalhou de 2018 a 2023',
      'Contrato foi assinado em 15/03/2022',
      'Acidente ocorreu no local de trabalho'
    ]
  },
  prova: {
    label: 'Prova',
    descricao: 'Documento, testemunho ou evidência',
    cor: 'text-emerald-400',
    corBg: 'bg-emerald-500/20 border-emerald-500/50',
    icone: FileText,
    exemplos: [
      'CTPS digitalizada (fl. 23-45)',
      'Testemunho de João Silva',
      'Contrato de trabalho original'
    ]
  },
  alegacao: {
    label: 'Alegação',
    descricao: 'Tese ou argumento jurídico',
    cor: 'text-purple-400',
    corBg: 'bg-purple-500/20 border-purple-500/50',
    icone: MessageSquare,
    exemplos: [
      'Vínculo empregatício caracterizado',
      'Rescisão foi irregular',
      'Dano moral configurado'
    ]
  },
  pedido: {
    label: 'Pedido',
    descricao: 'Pedido ou pretensão',
    cor: 'text-amber-400',
    corBg: 'bg-amber-500/20 border-amber-500/50',
    icone: Target,
    exemplos: [
      'Pagamento de horas extras',
      'Indenização por danos morais',
      'Reconhecimento de vínculo'
    ]
  },
  base_legal: {
    label: 'Base Legal',
    descricao: 'Fundamento legal ou jurisprudência',
    cor: 'text-indigo-400',
    corBg: 'bg-indigo-500/20 border-indigo-500/50',
    icone: Scale,
    exemplos: [
      'Art. 7º, XIII, CF/88',
      'Súmula 338, TST',
      'CLT, Art. 483, d'
    ]
  },
  risco: {
    label: 'Risco',
    descricao: 'Fraqueza ou risco identificado',
    cor: 'text-red-400',
    corBg: 'bg-red-500/20 border-red-500/50',
    icone: AlertTriangle,
    exemplos: [
      'Testemunha contraditória',
      'Documento sem autenticação',
      'Prazo prescricional próximo'
    ]
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function NoGrafoForm({
  casoId,
  no,
  documentos = [],
  onSucesso,
  onCancelar,
  tipoInicial = 'fato'
}: NoGrafoFormProps) {
  // Estado do formulário
  const [formData, setFormData] = useState<Partial<NoGrafo>>({
    caso_id: casoId,
    tipo_no: tipoInicial,
    titulo: '',
    conteudo: '',
    referencias: [],
    forca: 0.5
  })
  
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [mostrarReferencias, setMostrarReferencias] = useState(false)
  const [novaReferencia, setNovaReferencia] = useState<Partial<ReferenciaNo>>({})
  
  const ehEdicao = !!no?.id
  
  // Carregar dados do nó se em modo edição
  useEffect(() => {
    if (no) {
      setFormData({
        ...no
      })
      if (no.referencias && no.referencias.length > 0) {
        setMostrarReferencias(true)
      }
    }
  }, [no])
  
  // Handlers
  const handleChange = (campo: keyof NoGrafo, valor: unknown) => {
    setFormData(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) {
      setErros(prev => {
        const novos = { ...prev }
        delete novos[campo]
        return novos
      })
    }
  }
  
  const handleAddReferencia = () => {
    if (!novaReferencia.documento_id) return
    
    const doc = documentos.find(d => d.id === novaReferencia.documento_id)
    const referencia: ReferenciaNo = {
      documento_id: novaReferencia.documento_id,
      documento_titulo: doc?.titulo,
      pagina: novaReferencia.pagina,
      trecho: novaReferencia.trecho
    }
    
    setFormData(prev => ({
      ...prev,
      referencias: [...(prev.referencias || []), referencia]
    }))
    
    setNovaReferencia({})
  }
  
  const handleRemoveReferencia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referencias: prev.referencias?.filter((_, i) => i !== index) || []
    }))
  }
  
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {}
    
    if (!formData.titulo?.trim()) {
      novosErros.titulo = 'Título é obrigatório'
    } else if (formData.titulo.length < 3) {
      novosErros.titulo = 'Título deve ter pelo menos 3 caracteres'
    }
    
    if (!formData.tipo_no) {
      novosErros.tipo_no = 'Tipo de nó é obrigatório'
    }
    
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarFormulario()) return
    
    setEnviando(true)
    
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const noSalvo: NoGrafo = {
        id: no?.id || crypto.randomUUID(),
        organizacao_id: no?.organizacao_id || 'org-123',
        caso_id: casoId,
        tipo_no: formData.tipo_no as TipoNo,
        titulo: formData.titulo!,
        conteudo: formData.conteudo,
        referencias: formData.referencias,
        forca: formData.forca || 0.5,
        gerado_por_ia: no?.gerado_por_ia || false,
        id_execucao_ia: no?.id_execucao_ia,
        confianca_ia: no?.confianca_ia,
        criado_por: no?.criado_por || 'user-123',
        criado_em: no?.criado_em || new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }
      
      onSucesso?.(noSalvo)
    } catch (erro) {
      console.error('Erro ao salvar nó:', erro)
      setErros({ geral: 'Erro ao salvar nó. Tente novamente.' })
    } finally {
      setEnviando(false)
    }
  }
  
  const tipoConfig = TIPOS_NO[formData.tipo_no as TipoNo] || TIPOS_NO.fato
  const TipoIcone = tipoConfig.icone
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erro geral */}
      {erros.geral && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{erros.geral}</p>
        </div>
      )}
      
      {/* Badge de IA se gerado por IA */}
      {no?.gerado_por_ia && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Gerado por IA</span>
          {no.confianca_ia && (
            <span className="ml-auto text-amber-400">
              {Math.round(no.confianca_ia * 100)}% confiança
            </span>
          )}
        </div>
      )}
      
      {/* Tipo de Nó */}
      <div className="space-y-3">
        <label className="block text-sm font-normal text-slate-300">
          tipo de elemento *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(Object.keys(TIPOS_NO) as TipoNo[]).map(tipo => {
            const config = TIPOS_NO[tipo]
            const Icone = config.icone
            const selecionado = formData.tipo_no === tipo
            
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => handleChange('tipo_no', tipo)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border
                  transition-all text-center
                  ${selecionado
                    ? `${config.corBg} ${config.cor}`
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }
                `}
              >
                <Icone className="w-5 h-5" />
                <span className="text-sm font-medium">{config.label}</span>
              </button>
            )
          })}
        </div>
        
        {/* Descrição e exemplos do tipo selecionado */}
        <div className={`p-4 rounded-lg border ${tipoConfig.corBg} ${tipoConfig.cor}`}>
          <div className="flex items-start gap-3">
            <TipoIcone className="w-5 h-5 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm">{tipoConfig.descricao}</p>
              <div className="space-y-1">
                <p className="text-xs opacity-75">Exemplos:</p>
                <ul className="text-xs opacity-75 list-disc list-inside">
                  {tipoConfig.exemplos.map((exemplo, i) => (
                    <li key={i}>{exemplo}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Título */}
      <div className="space-y-2">
        <label className="block text-sm font-normal text-slate-300">
          título *
        </label>
        <input
          type="text"
          value={formData.titulo || ''}
          onChange={e => handleChange('titulo', e.target.value)}
          placeholder={`Ex: ${tipoConfig.exemplos[0]}`}
          className={`
            w-full px-4 py-3 bg-slate-900 border rounded-lg
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
            transition-colors
            ${erros.titulo ? 'border-red-500' : 'border-slate-700'}
          `}
        />
        {erros.titulo && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {erros.titulo}
          </p>
        )}
      </div>
      
      {/* Conteúdo */}
      <div className="space-y-2">
        <label className="block text-sm font-normal text-slate-300">
          conteúdo / detalhes
        </label>
        <textarea
          value={formData.conteudo || ''}
          onChange={e => handleChange('conteudo', e.target.value)}
          placeholder="Detalhes, citações, fundamentos..."
          rows={4}
          className="
            w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
            resize-none transition-colors
          "
        />
      </div>
      
      {/* Força do elemento */}
      <div className="space-y-3">
        <label className="flex items-center justify-between text-sm font-normal text-slate-300">
          <span className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            força do elemento
          </span>
          <span className={`
            font-medium
            ${(formData.forca || 0.5) >= 0.7 ? 'text-emerald-400' : 
              (formData.forca || 0.5) >= 0.4 ? 'text-amber-400' : 'text-red-400'}
          `}>
            {Math.round((formData.forca || 0.5) * 100)}%
          </span>
        </label>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-red-400">Fraco</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={formData.forca || 0.5}
            onChange={e => handleChange('forca', parseFloat(e.target.value))}
            className="
              flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-amber-500
              [&::-webkit-slider-thumb]:cursor-pointer
            "
          />
          <span className="text-xs text-emerald-400">Forte</span>
        </div>
        
        <p className="text-xs text-slate-500">
          {(formData.forca || 0.5) >= 0.7 
            ? 'Elemento bem fundamentado e robusto'
            : (formData.forca || 0.5) >= 0.4 
              ? 'Elemento com fundamentação razoável'
              : 'Elemento frágil ou inconclusivo'}
        </p>
      </div>
      
      {/* Referências a documentos */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setMostrarReferencias(!mostrarReferencias)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          <span>referências a documentos</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${mostrarReferencias ? 'rotate-180' : ''}`} />
          {formData.referencias && formData.referencias.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
              {formData.referencias.length}
            </span>
          )}
        </button>
        
        {mostrarReferencias && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
            {/* Lista de referências */}
            {formData.referencias && formData.referencias.length > 0 && (
              <div className="space-y-2">
                {formData.referencias.map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-900 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-300">
                          {ref.documento_titulo || ref.documento_id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ref.pagina ? `Página ${ref.pagina}` : ''}
                          {ref.trecho ? ` - "${ref.trecho.substring(0, 50)}..."` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReferencia(index)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Adicionar nova referência */}
            <div className="space-y-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-400">Adicionar referência:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={novaReferencia.documento_id || ''}
                  onChange={e => setNovaReferencia(prev => ({ ...prev, documento_id: e.target.value }))}
                  className="
                    w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                    text-slate-100 text-sm
                    focus:outline-none focus:ring-2 focus:ring-amber-500/50
                  "
                >
                  <option value="">Selecione um documento...</option>
                  {documentos.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.titulo}
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  placeholder="Página (opcional)"
                  value={novaReferencia.pagina || ''}
                  onChange={e => setNovaReferencia(prev => ({ ...prev, pagina: parseInt(e.target.value) || undefined }))}
                  className="
                    w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                    text-slate-100 text-sm
                    focus:outline-none focus:ring-2 focus:ring-amber-500/50
                  "
                />
              </div>
              
              <input
                type="text"
                placeholder="Trecho relevante (opcional)"
                value={novaReferencia.trecho || ''}
                onChange={e => setNovaReferencia(prev => ({ ...prev, trecho: e.target.value }))}
                className="
                  w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg
                  text-slate-100 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-500/50
                "
              />
              
              <button
                type="button"
                onClick={handleAddReferencia}
                disabled={!novaReferencia.documento_id}
                className="
                  w-full px-4 py-2 bg-slate-700 text-slate-300 rounded-lg
                  hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors text-sm
                "
              >
                + adicionar referência
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="
            px-4 py-2 text-slate-400 hover:text-slate-300
            transition-colors disabled:opacity-50
          "
        >
          cancelar
        </button>
        
        <button
          type="submit"
          disabled={enviando}
          className="
            flex items-center gap-2 px-6 py-2 bg-amber-500 text-slate-900
            rounded-lg font-medium hover:bg-amber-400
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {enviando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{ehEdicao ? 'atualizar elemento' : 'adicionar ao grafo'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default NoGrafoForm
