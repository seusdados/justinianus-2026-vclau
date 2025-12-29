'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowRight,
  Link as LinkIcon, 
  X,
  Loader2,
  AlertCircle,
  Save,
  Circle,
  FileText,
  MessageSquare,
  Target,
  Scale,
  AlertTriangle,
  Zap,
  Ban
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface ArestaGrafo {
  id?: string
  organizacao_id?: string
  caso_id: number
  no_origem: string
  no_destino: string
  relacao: TipoRelacao
  peso: number
  notas?: string
  gerado_por_ia?: boolean
  criado_em?: string
}

export type TipoRelacao = 
  | 'suportado_por' 
  | 'depende_de' 
  | 'fundamentado_por' 
  | 'enfraquecido_por' 
  | 'contradiz' 
  | 'corrobora'

export type TipoNo = 'fato' | 'prova' | 'alegacao' | 'pedido' | 'base_legal' | 'risco'

export interface NoGrafo {
  id: string
  tipo_no: TipoNo
  titulo: string
  forca?: number
}

interface ArestaGrafoFormProps {
  casoId: number
  aresta?: ArestaGrafo
  nos: NoGrafo[]
  onSucesso?: (aresta: ArestaGrafo) => void
  onCancelar?: () => void
  noOrigemInicial?: string
  noDestinoInicial?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const TIPOS_NO_CONFIG: Record<TipoNo, { 
  label: string
  cor: string
  corBg: string
  icone: React.ElementType 
}> = {
  fato: { label: 'Fato', cor: 'text-blue-400', corBg: 'bg-blue-500/20', icone: Circle },
  prova: { label: 'Prova', cor: 'text-emerald-400', corBg: 'bg-emerald-500/20', icone: FileText },
  alegacao: { label: 'Alegação', cor: 'text-purple-400', corBg: 'bg-purple-500/20', icone: MessageSquare },
  pedido: { label: 'Pedido', cor: 'text-amber-400', corBg: 'bg-amber-500/20', icone: Target },
  base_legal: { label: 'Base Legal', cor: 'text-indigo-400', corBg: 'bg-indigo-500/20', icone: Scale },
  risco: { label: 'Risco', cor: 'text-red-400', corBg: 'bg-red-500/20', icone: AlertTriangle }
}

const TIPOS_RELACAO: Record<TipoRelacao, {
  label: string
  descricao: string
  cor: string
  corBg: string
  icone: React.ElementType
  tiposOrigemValidos: TipoNo[]
  tiposDestinoValidos: TipoNo[]
}> = {
  suportado_por: {
    label: 'Suportado por',
    descricao: 'O nó de origem é suportado/comprovado pelo nó de destino',
    cor: 'text-emerald-400',
    corBg: 'bg-emerald-500/20 border-emerald-500/50',
    icone: Zap,
    tiposOrigemValidos: ['fato', 'alegacao', 'pedido'],
    tiposDestinoValidos: ['prova', 'base_legal', 'fato']
  },
  depende_de: {
    label: 'Depende de',
    descricao: 'O nó de origem depende do nó de destino para ser válido',
    cor: 'text-amber-400',
    corBg: 'bg-amber-500/20 border-amber-500/50',
    icone: LinkIcon,
    tiposOrigemValidos: ['pedido', 'alegacao'],
    tiposDestinoValidos: ['fato', 'alegacao', 'base_legal']
  },
  fundamentado_por: {
    label: 'Fundamentado por',
    descricao: 'O nó de origem é fundamentado juridicamente pelo nó de destino',
    cor: 'text-indigo-400',
    corBg: 'bg-indigo-500/20 border-indigo-500/50',
    icone: Scale,
    tiposOrigemValidos: ['pedido', 'alegacao'],
    tiposDestinoValidos: ['base_legal']
  },
  enfraquecido_por: {
    label: 'Enfraquecido por',
    descricao: 'O nó de origem é enfraquecido/prejudicado pelo nó de destino',
    cor: 'text-red-400',
    corBg: 'bg-red-500/20 border-red-500/50',
    icone: AlertTriangle,
    tiposOrigemValidos: ['fato', 'alegacao', 'pedido', 'prova'],
    tiposDestinoValidos: ['risco', 'prova']
  },
  contradiz: {
    label: 'Contradiz',
    descricao: 'Os nós se contradizem mutuamente',
    cor: 'text-red-400',
    corBg: 'bg-red-500/20 border-red-500/50',
    icone: Ban,
    tiposOrigemValidos: ['prova', 'fato'],
    tiposDestinoValidos: ['prova', 'fato']
  },
  corrobora: {
    label: 'Corrobora',
    descricao: 'Os nós se reforçam mutuamente',
    cor: 'text-emerald-400',
    corBg: 'bg-emerald-500/20 border-emerald-500/50',
    icone: Zap,
    tiposOrigemValidos: ['prova', 'fato'],
    tiposDestinoValidos: ['prova', 'fato']
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function ArestaGrafoForm({
  casoId,
  aresta,
  nos,
  onSucesso,
  onCancelar,
  noOrigemInicial,
  noDestinoInicial
}: ArestaGrafoFormProps) {
  // Estado do formulário
  const [formData, setFormData] = useState<Partial<ArestaGrafo>>({
    caso_id: casoId,
    no_origem: noOrigemInicial || '',
    no_destino: noDestinoInicial || '',
    relacao: 'suportado_por',
    peso: 0.5,
    notas: ''
  })
  
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  
  const ehEdicao = !!aresta?.id
  
  // Carregar dados da aresta se em modo edição
  useEffect(() => {
    if (aresta) {
      setFormData({
        ...aresta
      })
    }
  }, [aresta])
  
  // Nós selecionados
  const noOrigem = nos.find(n => n.id === formData.no_origem)
  const noDestino = nos.find(n => n.id === formData.no_destino)
  
  // Relações válidas baseadas nos tipos de nós selecionados
  const relacoesValidas = Object.entries(TIPOS_RELACAO).filter(([, config]) => {
    if (!noOrigem || !noDestino) return true
    return config.tiposOrigemValidos.includes(noOrigem.tipo_no) &&
           config.tiposDestinoValidos.includes(noDestino.tipo_no)
  })
  
  // Handlers
  const handleChange = (campo: keyof ArestaGrafo, valor: unknown) => {
    setFormData(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) {
      setErros(prev => {
        const novos = { ...prev }
        delete novos[campo]
        return novos
      })
    }
    
    // Resetar relação se mudar nós e a relação atual não for mais válida
    if (campo === 'no_origem' || campo === 'no_destino') {
      const novoOrigem = campo === 'no_origem' ? nos.find(n => n.id === valor) : noOrigem
      const novoDestino = campo === 'no_destino' ? nos.find(n => n.id === valor) : noDestino
      
      if (novoOrigem && novoDestino && formData.relacao) {
        const relacaoConfig = TIPOS_RELACAO[formData.relacao as TipoRelacao]
        if (!relacaoConfig.tiposOrigemValidos.includes(novoOrigem.tipo_no) ||
            !relacaoConfig.tiposDestinoValidos.includes(novoDestino.tipo_no)) {
          setFormData(prev => ({ ...prev, relacao: '' as TipoRelacao }))
        }
      }
    }
  }
  
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {}
    
    if (!formData.no_origem) {
      novosErros.no_origem = 'Nó de origem é obrigatório'
    }
    
    if (!formData.no_destino) {
      novosErros.no_destino = 'Nó de destino é obrigatório'
    }
    
    if (formData.no_origem === formData.no_destino) {
      novosErros.no_destino = 'Origem e destino devem ser diferentes'
    }
    
    if (!formData.relacao) {
      novosErros.relacao = 'Tipo de relação é obrigatório'
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
      
      const arestaSalva: ArestaGrafo = {
        id: aresta?.id || crypto.randomUUID(),
        organizacao_id: aresta?.organizacao_id || 'org-123',
        caso_id: casoId,
        no_origem: formData.no_origem!,
        no_destino: formData.no_destino!,
        relacao: formData.relacao as TipoRelacao,
        peso: formData.peso || 0.5,
        notas: formData.notas,
        gerado_por_ia: aresta?.gerado_por_ia || false,
        criado_em: aresta?.criado_em || new Date().toISOString()
      }
      
      onSucesso?.(arestaSalva)
    } catch (erro) {
      console.error('Erro ao salvar aresta:', erro)
      setErros({ geral: 'Erro ao salvar relação. Tente novamente.' })
    } finally {
      setEnviando(false)
    }
  }
  
  // Componente para renderizar um nó
  const renderNo = (no: NoGrafo | undefined, placeholder: string) => {
    if (!no) {
      return (
        <div className="flex items-center gap-2 text-slate-500">
          <Circle className="w-4 h-4" />
          <span className="text-sm">{placeholder}</span>
        </div>
      )
    }
    
    const config = TIPOS_NO_CONFIG[no.tipo_no]
    const Icone = config.icone
    
    return (
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${config.corBg}`}>
          <Icone className={`w-4 h-4 ${config.cor}`} />
        </div>
        <div>
          <p className="text-sm text-slate-200 line-clamp-1">{no.titulo}</p>
          <p className={`text-xs ${config.cor}`}>{config.label}</p>
        </div>
      </div>
    )
  }
  
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
      
      {/* Preview Visual da Relação */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Nó Origem */}
          <div className="flex-1 p-4 bg-slate-900 rounded-lg">
            {renderNo(noOrigem, 'Selecione origem')}
          </div>
          
          {/* Seta com tipo de relação */}
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className={`w-6 h-6 ${
              formData.relacao 
                ? TIPOS_RELACAO[formData.relacao as TipoRelacao]?.cor || 'text-slate-500'
                : 'text-slate-500'
            }`} />
            {formData.relacao && (
              <span className={`text-xs ${TIPOS_RELACAO[formData.relacao as TipoRelacao]?.cor}`}>
                {TIPOS_RELACAO[formData.relacao as TipoRelacao]?.label}
              </span>
            )}
          </div>
          
          {/* Nó Destino */}
          <div className="flex-1 p-4 bg-slate-900 rounded-lg">
            {renderNo(noDestino, 'Selecione destino')}
          </div>
        </div>
      </div>
      
      {/* Seleção de Nós */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nó Origem */}
        <div className="space-y-2">
          <label className="block text-sm font-normal text-slate-300">
            nó de origem *
          </label>
          <select
            value={formData.no_origem || ''}
            onChange={e => handleChange('no_origem', e.target.value)}
            className={`
              w-full px-4 py-3 bg-slate-900 border rounded-lg
              text-slate-100 appearance-none
              focus:outline-none focus:ring-2 focus:ring-amber-500/50
              ${erros.no_origem ? 'border-red-500' : 'border-slate-700'}
            `}
          >
            <option value="">Selecione o nó de origem...</option>
            {nos
              .filter(n => n.id !== formData.no_destino)
              .map(no => {
                const config = TIPOS_NO_CONFIG[no.tipo_no]
                return (
                  <option key={no.id} value={no.id}>
                    [{config.label}] {no.titulo}
                  </option>
                )
              })}
          </select>
          {erros.no_origem && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {erros.no_origem}
            </p>
          )}
        </div>
        
        {/* Nó Destino */}
        <div className="space-y-2">
          <label className="block text-sm font-normal text-slate-300">
            nó de destino *
          </label>
          <select
            value={formData.no_destino || ''}
            onChange={e => handleChange('no_destino', e.target.value)}
            className={`
              w-full px-4 py-3 bg-slate-900 border rounded-lg
              text-slate-100 appearance-none
              focus:outline-none focus:ring-2 focus:ring-amber-500/50
              ${erros.no_destino ? 'border-red-500' : 'border-slate-700'}
            `}
          >
            <option value="">Selecione o nó de destino...</option>
            {nos
              .filter(n => n.id !== formData.no_origem)
              .map(no => {
                const config = TIPOS_NO_CONFIG[no.tipo_no]
                return (
                  <option key={no.id} value={no.id}>
                    [{config.label}] {no.titulo}
                  </option>
                )
              })}
          </select>
          {erros.no_destino && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {erros.no_destino}
            </p>
          )}
        </div>
      </div>
      
      {/* Tipo de Relação */}
      <div className="space-y-3">
        <label className="block text-sm font-normal text-slate-300">
          tipo de relação *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {relacoesValidas.map(([tipo, config]) => {
            const Icone = config.icone
            const selecionado = formData.relacao === tipo
            
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => handleChange('relacao', tipo)}
                className={`
                  flex items-center gap-2 p-3 rounded-lg border text-left
                  transition-all
                  ${selecionado
                    ? `${config.corBg} ${config.cor}`
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }
                `}
              >
                <Icone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{config.label}</span>
              </button>
            )
          })}
        </div>
        
        {erros.relacao && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {erros.relacao}
          </p>
        )}
        
        {/* Descrição da relação selecionada */}
        {formData.relacao && (
          <p className="text-xs text-slate-500">
            {TIPOS_RELACAO[formData.relacao as TipoRelacao]?.descricao}
          </p>
        )}
        
        {/* Aviso se poucas relações válidas */}
        {relacoesValidas.length < 3 && noOrigem && noDestino && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-300">
              ⚠️ Poucas relações disponíveis para estes tipos de nós. 
              Considere se a combinação origem/destino está correta.
            </p>
          </div>
        )}
      </div>
      
      {/* Peso da Relação */}
      <div className="space-y-3">
        <label className="flex items-center justify-between text-sm font-normal text-slate-300">
          <span>força da relação</span>
          <span className={`
            font-medium
            ${(formData.peso || 0.5) >= 0.7 ? 'text-emerald-400' : 
              (formData.peso || 0.5) >= 0.4 ? 'text-amber-400' : 'text-slate-400'}
          `}>
            {Math.round((formData.peso || 0.5) * 100)}%
          </span>
        </label>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">Fraca</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={formData.peso || 0.5}
            onChange={e => handleChange('peso', parseFloat(e.target.value))}
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
      </div>
      
      {/* Notas */}
      <div className="space-y-2">
        <label className="block text-sm font-normal text-slate-300">
          notas (opcional)
        </label>
        <textarea
          value={formData.notas || ''}
          onChange={e => handleChange('notas', e.target.value)}
          placeholder="Observações sobre esta relação..."
          rows={2}
          className="
            w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-amber-500/50
            resize-none transition-colors
          "
        />
      </div>
      
      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="
            flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-300
            transition-colors disabled:opacity-50
          "
        >
          <X className="w-4 h-4" />
          <span>cancelar</span>
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
              <span>{ehEdicao ? 'atualizar relação' : 'criar relação'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default ArestaGrafoForm
