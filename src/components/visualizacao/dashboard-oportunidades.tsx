'use client'

import { useState, useMemo } from 'react'
import { 
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Scale,
  Target,
  Calendar,
  ChevronRight,
  Sparkles,
  CheckCircle,
  XCircle,
  Timer,
  BarChart3,
  Activity,
  Info
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface SinalOportunidade {
  id: string
  organizacao_id: string
  caso_id: number
  caso_titulo?: string
  tipo_sinal: TipoSinal
  titulo: string
  descricao?: string
  acao_recomendada?: string
  timing_recomendado?: string
  confianca: number
  impacto_potencial: 'baixo' | 'medio' | 'alto' | 'critico'
  detectado_em: string
  expira_em?: string
  expirado: boolean
  acao_tomada: boolean
  acao_tomada_em?: string
  resultado_acao?: string
  id_execucao_ia?: string
}

export type TipoSinal = 
  | 'pressao_financeira'
  | 'pressao_prazo'
  | 'lacuna_prova'
  | 'precedente_favoravel'
  | 'fraqueza_oponente'
  | 'janela_acordo'
  | 'oportunidade_urgencia'
  | 'momento_estrategico'

export interface AnaliseTimingCaso {
  caso_id: number
  caso_titulo: string
  pontuacao_geral: number  // -10 a +10
  janela_atual: 'favoravel' | 'neutra' | 'desfavoravel'
  fatores_positivos: string[]
  fatores_negativos: string[]
  recomendacao: string
  confianca: number
  atualizado_em: string
}

interface DashboardOportunidadesProps {
  sinais: SinalOportunidade[]
  analisesTiming?: AnaliseTimingCaso[]
  onSinalClick?: (sinal: SinalOportunidade) => void
  onAcionarSinal?: (sinalId: string) => void
  onDescartarSinal?: (sinalId: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const TIPOS_SINAL_CONFIG: Record<TipoSinal, {
  label: string
  descricao: string
  cor: string
  corBg: string
  icone: React.ElementType
}> = {
  pressao_financeira: {
    label: 'Pressão Financeira',
    descricao: 'Adversário sob pressão financeira',
    cor: 'text-emerald-400',
    corBg: 'bg-emerald-500/20 border-emerald-500/50',
    icone: DollarSign
  },
  pressao_prazo: {
    label: 'Pressão de Prazo',
    descricao: 'Prazo crítico afetando adversário',
    cor: 'text-amber-400',
    corBg: 'bg-amber-500/20 border-amber-500/50',
    icone: Clock
  },
  lacuna_prova: {
    label: 'Lacuna Probatória',
    descricao: 'Gap de evidência identificado',
    cor: 'text-red-400',
    corBg: 'bg-red-500/20 border-red-500/50',
    icone: AlertTriangle
  },
  precedente_favoravel: {
    label: 'Precedente Favorável',
    descricao: 'Jurisprudência favorável recente',
    cor: 'text-blue-400',
    corBg: 'bg-blue-500/20 border-blue-500/50',
    icone: Scale
  },
  fraqueza_oponente: {
    label: 'Fraqueza do Oponente',
    descricao: 'Ponto fraco na estratégia adversária',
    cor: 'text-purple-400',
    corBg: 'bg-purple-500/20 border-purple-500/50',
    icone: Target
  },
  janela_acordo: {
    label: 'Janela de Acordo',
    descricao: 'Momento propício para negociação',
    cor: 'text-cyan-400',
    corBg: 'bg-cyan-500/20 border-cyan-500/50',
    icone: Zap
  },
  oportunidade_urgencia: {
    label: 'Oportunidade de Urgência',
    descricao: 'Momento ideal para tutela de urgência',
    cor: 'text-orange-400',
    corBg: 'bg-orange-500/20 border-orange-500/50',
    icone: Timer
  },
  momento_estrategico: {
    label: 'Momento Estratégico',
    descricao: 'Oportunidade estratégica genérica',
    cor: 'text-pink-400',
    corBg: 'bg-pink-500/20 border-pink-500/50',
    icone: Sparkles
  }
}

const IMPACTO_CONFIG = {
  baixo: { label: 'Baixo', cor: 'text-slate-400', corBg: 'bg-slate-500/20', valor: 1 },
  medio: { label: 'Médio', cor: 'text-blue-400', corBg: 'bg-blue-500/20', valor: 2 },
  alto: { label: 'Alto', cor: 'text-amber-400', corBg: 'bg-amber-500/20', valor: 3 },
  critico: { label: 'Crítico', cor: 'text-red-400', corBg: 'bg-red-500/20', valor: 4 }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function calcularTempoRestante(expiraEm?: string): { texto: string; urgente: boolean } {
  if (!expiraEm) return { texto: 'Sem prazo', urgente: false }
  
  const agora = new Date()
  const expiracao = new Date(expiraEm)
  const diff = expiracao.getTime() - agora.getTime()
  
  if (diff <= 0) return { texto: 'Expirado', urgente: true }
  
  const horas = Math.floor(diff / (1000 * 60 * 60))
  const dias = Math.floor(horas / 24)
  
  if (dias > 0) return { texto: `${dias}d restantes`, urgente: dias <= 1 }
  if (horas > 0) return { texto: `${horas}h restantes`, urgente: true }
  
  const minutos = Math.floor(diff / (1000 * 60))
  return { texto: `${minutos}min restantes`, urgente: true }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardOportunidades({
  sinais,
  analisesTiming = [],
  onSinalClick,
  onAcionarSinal,
  onDescartarSinal
}: DashboardOportunidadesProps) {
  // Estado
  const [filtroTipo, setFiltroTipo] = useState<TipoSinal | 'todos'>('todos')
  const [filtroImpacto, setFiltroImpacto] = useState<string>('todos')
  const [abaAtiva, setAbaAtiva] = useState<'sinais' | 'timing'>('sinais')
  
  // Filtrar sinais
  const sinaisFiltrados = useMemo(() => {
    return sinais
      .filter(sinal => !sinal.expirado && !sinal.acao_tomada)
      .filter(sinal => filtroTipo === 'todos' || sinal.tipo_sinal === filtroTipo)
      .filter(sinal => filtroImpacto === 'todos' || sinal.impacto_potencial === filtroImpacto)
      .sort((a, b) => {
        // Ordenar por impacto (maior primeiro) e depois por confiança
        const impactoA = IMPACTO_CONFIG[a.impacto_potencial].valor
        const impactoB = IMPACTO_CONFIG[b.impacto_potencial].valor
        if (impactoB !== impactoA) return impactoB - impactoA
        return b.confianca - a.confianca
      })
  }, [sinais, filtroTipo, filtroImpacto])
  
  // Sinais críticos (alto/crítico impacto)
  const sinaisCriticos = useMemo(() => {
    return sinaisFiltrados.filter(s => 
      s.impacto_potencial === 'alto' || s.impacto_potencial === 'critico'
    )
  }, [sinaisFiltrados])
  
  // Estatísticas
  const estatisticas = useMemo(() => {
    const ativos = sinais.filter(s => !s.expirado && !s.acao_tomada)
    const acionados = sinais.filter(s => s.acao_tomada)
    const expirados = sinais.filter(s => s.expirado)
    
    // Contagem por tipo
    const porTipo = ativos.reduce((acc, s) => {
      acc[s.tipo_sinal] = (acc[s.tipo_sinal] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: ativos.length,
      criticos: ativos.filter(s => s.impacto_potencial === 'critico').length,
      acionados: acionados.length,
      expirados: expirados.length,
      porTipo
    }
  }, [sinais])
  
  // Renderizar card de sinal
  const renderSinal = (sinal: SinalOportunidade) => {
    const tipoConfig = TIPOS_SINAL_CONFIG[sinal.tipo_sinal]
    const impactoConfig = IMPACTO_CONFIG[sinal.impacto_potencial]
    const TipoIcone = tipoConfig.icone
    const { texto: tempoRestante, urgente } = calcularTempoRestante(sinal.expira_em)
    
    return (
      <div
        key={sinal.id}
        onClick={() => onSinalClick?.(sinal)}
        className={`
          relative p-4 rounded-lg border cursor-pointer transition-all
          ${tipoConfig.corBg}
          hover:scale-[1.01]
        `}
      >
        {/* Badge de impacto */}
        <div className={`
          absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium
          ${impactoConfig.corBg} ${impactoConfig.cor}
        `}>
          {impactoConfig.label}
        </div>
        
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-slate-900/50`}>
            <TipoIcone className={`w-5 h-5 ${tipoConfig.cor}`} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-slate-200">{sinal.titulo}</h4>
            <p className="text-xs text-slate-400">{sinal.caso_titulo || `Caso #${sinal.caso_id}`}</p>
          </div>
        </div>
        
        {/* Descrição */}
        {sinal.descricao && (
          <p className="text-xs text-slate-300 mb-3 line-clamp-2">{sinal.descricao}</p>
        )}
        
        {/* Ação recomendada */}
        {sinal.acao_recomendada && (
          <div className="bg-slate-900/50 rounded-lg p-2 mb-3">
            <p className="text-xs text-slate-400 mb-1">Ação recomendada:</p>
            <p className="text-xs text-amber-300">{sinal.acao_recomendada}</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Confiança */}
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <BarChart3 className="w-3 h-3" />
              <span>{Math.round(sinal.confianca * 100)}%</span>
            </div>
            
            {/* Tempo restante */}
            {sinal.expira_em && (
              <div className={`flex items-center gap-1 text-xs ${urgente ? 'text-red-400' : 'text-slate-500'}`}>
                <Timer className="w-3 h-3" />
                <span>{tempoRestante}</span>
              </div>
            )}
          </div>
          
          {/* Ações */}
          <div className="flex items-center gap-2">
            {onDescartarSinal && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDescartarSinal(sinal.id)
                }}
                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                title="Descartar"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {onAcionarSinal && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAcionarSinal(sinal.id)
                }}
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs hover:bg-amber-500/30 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Acionar
              </button>
            )}
          </div>
        </div>
        
        {/* Badge de IA */}
        {sinal.id_execucao_ia && (
          <div className="absolute bottom-2 left-2" title="Detectado por IA">
            <Sparkles className="w-3 h-3 text-pink-400" />
          </div>
        )}
      </div>
    )
  }
  
  // Renderizar análise de timing
  const renderAnaliseTiming = (analise: AnaliseTimingCaso) => {
    const corPontuacao = analise.pontuacao_geral >= 2 
      ? 'text-emerald-400' 
      : analise.pontuacao_geral <= -2 
        ? 'text-red-400' 
        : 'text-amber-400'
    
    const corJanela = analise.janela_atual === 'favoravel'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
      : analise.janela_atual === 'desfavoravel'
        ? 'bg-red-500/20 text-red-400 border-red-500/50'
        : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
    
    return (
      <div
        key={analise.caso_id}
        className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium text-slate-200">{analise.caso_titulo}</h4>
            <p className="text-xs text-slate-500">Caso #{analise.caso_id}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs border ${corJanela}`}>
            {analise.janela_atual === 'favoravel' ? 'Favorável' :
             analise.janela_atual === 'desfavoravel' ? 'Desfavorável' : 'Neutra'}
          </div>
        </div>
        
        {/* Medidor de pontuação */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">Pontuação de Timing</span>
            <span className={`text-lg font-bold ${corPontuacao}`}>
              {analise.pontuacao_geral > 0 ? '+' : ''}{analise.pontuacao_geral.toFixed(1)}
            </span>
          </div>
          <div className="relative h-2 bg-slate-700 rounded-full">
            <div 
              className="absolute top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
              style={{ width: '100%' }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
              style={{ 
                left: `${((analise.pontuacao_geral + 10) / 20) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>-10</span>
            <span>0</span>
            <span>+10</span>
          </div>
        </div>
        
        {/* Fatores */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Positivos */}
          <div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 mb-2">
              <TrendingUp className="w-3 h-3" />
              <span>Fatores Positivos</span>
            </div>
            <ul className="space-y-1">
              {analise.fatores_positivos.map((fator, i) => (
                <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  <span>{fator}</span>
                </li>
              ))}
              {analise.fatores_positivos.length === 0 && (
                <li className="text-xs text-slate-600">Nenhum identificado</li>
              )}
            </ul>
          </div>
          
          {/* Negativos */}
          <div>
            <div className="flex items-center gap-1 text-xs text-red-400 mb-2">
              <TrendingDown className="w-3 h-3" />
              <span>Fatores Negativos</span>
            </div>
            <ul className="space-y-1">
              {analise.fatores_negativos.map((fator, i) => (
                <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span>{fator}</span>
                </li>
              ))}
              {analise.fatores_negativos.length === 0 && (
                <li className="text-xs text-slate-600">Nenhum identificado</li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Recomendação */}
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
            <Info className="w-3 h-3" />
            <span>Recomendação</span>
          </div>
          <p className="text-xs text-slate-300">{analise.recomendacao}</p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>Confiança: {Math.round(analise.confianca * 100)}%</span>
          <span>Atualizado: {new Date(analise.atualizado_em).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    )
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Zap className="w-4 h-4" />
            <span>Oportunidades</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{estatisticas.total}</p>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Críticas</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{estatisticas.criticos}</p>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            <span>Acionadas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{estatisticas.acionados}</p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <XCircle className="w-4 h-4" />
            <span>Expiradas</span>
          </div>
          <p className="text-2xl font-bold text-slate-400">{estatisticas.expirados}</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700">
        <button
          onClick={() => setAbaAtiva('sinais')}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm transition-colors border-b-2 -mb-px
            ${abaAtiva === 'sinais'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-300'
            }
          `}
        >
          <Zap className="w-4 h-4" />
          sinais de oportunidade
          {estatisticas.total > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
              {estatisticas.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setAbaAtiva('timing')}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm transition-colors border-b-2 -mb-px
            ${abaAtiva === 'timing'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-300'
            }
          `}
        >
          <Activity className="w-4 h-4" />
          análise de timing
          {analisesTiming.length > 0 && (
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
              {analisesTiming.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Conteúdo das abas */}
      {abaAtiva === 'sinais' && (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tipo:</span>
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value as TipoSinal | 'todos')}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="todos">Todos</option>
                {(Object.keys(TIPOS_SINAL_CONFIG) as TipoSinal[]).map(tipo => (
                  <option key={tipo} value={tipo}>
                    {TIPOS_SINAL_CONFIG[tipo].label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Impacto:</span>
              <select
                value={filtroImpacto}
                onChange={e => setFiltroImpacto(e.target.value)}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="todos">Todos</option>
                <option value="critico">Crítico</option>
                <option value="alto">Alto</option>
                <option value="medio">Médio</option>
                <option value="baixo">Baixo</option>
              </select>
            </div>
          </div>
          
          {/* Grid de sinais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sinaisFiltrados.map(renderSinal)}
          </div>
          
          {sinaisFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma oportunidade ativa</p>
              <p className="text-sm text-slate-500">
                Os sinais de oportunidade aparecerão aqui quando detectados
              </p>
            </div>
          )}
        </>
      )}
      
      {abaAtiva === 'timing' && (
        <>
          {/* Grid de análises de timing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analisesTiming.map(renderAnaliseTiming)}
          </div>
          
          {analisesTiming.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma análise de timing disponível</p>
              <p className="text-sm text-slate-500">
                As análises de timing dos casos aparecerão aqui
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Legenda de tipos de sinal */}
      {abaAtiva === 'sinais' && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <h4 className="text-xs text-slate-400 mb-3">Tipos de Sinal</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(TIPOS_SINAL_CONFIG) as [TipoSinal, typeof TIPOS_SINAL_CONFIG.pressao_financeira][]).map(([tipo, config]) => {
              const Icone = config.icone
              const count = estatisticas.porTipo[tipo] || 0
              
              return (
                <div key={tipo} className="flex items-center gap-2 text-xs">
                  <Icone className={`w-4 h-4 ${config.cor}`} />
                  <span className="text-slate-400">{config.label}</span>
                  {count > 0 && (
                    <span className="text-slate-500">({count})</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardOportunidades
