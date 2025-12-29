'use client'

import { useState, useMemo } from 'react'
import {
  Brain,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  PieChart,
  RefreshCw,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Scale,
  Search,
  Users,
  MessageSquare
} from 'lucide-react'

// tipos de agentes do sistema
type TipoAgente =
  | 'processador_docs'
  | 'extrator_entidades'
  | 'avaliador_risco'
  | 'perfilador_juiz'
  | 'gerador_minutas'
  | 'analisador_timing'
  | 'detector_fraquezas'
  | 'copiloto_atendimento'
  | 'copiloto_audiencia'
  | 'resumidor_reuniao'

// estatísticas de um agente
interface EstatisticasAgente {
  tipoAgente: TipoAgente
  nomeExibicao: string
  descricao: string
  // métricas gerais
  totalExecucoes: number
  execucoesUltimos7Dias: number
  execucoesUltimos30Dias: number
  // performance
  tempoMedioMs: number
  tempoMedianoMs: number
  tempoP95Ms: number
  // qualidade
  confiancaMedia: number
  fundamentacaoMedia: number
  consistenciaMedia: number
  // feedback humano
  feedbackAceito: number
  feedbackModificado: number
  feedbackRejeitado: number
  // tendência (vs período anterior)
  tendenciaExecucoes: number  // percentual
  tendenciaConfianca: number
  tendenciaAceite: number
  // erros
  totalErros: number
  taxaErro: number
}

// execução individual para drill-down
interface ExecucaoAgente {
  id: string
  tipoAgente: TipoAgente
  tipoEntidadeGatilho: string
  idEntidadeGatilho: string
  status: 'concluido' | 'falhou' | 'cancelado'
  duracaoMs: number
  confianca: number
  feedbackHumano?: 'aceito' | 'modificado' | 'rejeitado'
  criadoEm: Date
  finalizadoEm?: Date
  mensagemErro?: string
}

// estatísticas globais
interface EstatisticasGlobais {
  totalExecucoes: number
  totalSugestoes: number
  taxaAceiteSemEdicao: number
  taxaAceiteComEdicao: number
  taxaRejeicao: number
  tempoMedioResposta: number
  execucoesPorHora: { hora: number; quantidade: number }[]
  execucoesPorDia: { data: string; quantidade: number }[]
  distribuicaoPorAgente: { tipo: TipoAgente; quantidade: number }[]
}

interface MetricasIAProps {
  estatisticasGlobais: EstatisticasGlobais
  estatisticasPorAgente: EstatisticasAgente[]
  execucoesRecentes?: ExecucaoAgente[]
  periodoSelecionado?: '7d' | '30d' | '90d'
  onPeriodoChange?: (periodo: '7d' | '30d' | '90d') => void
  onAgenteClick?: (tipoAgente: TipoAgente) => void
  onExecucaoClick?: (id: string) => void
  onRefresh?: () => void
  loading?: boolean
}

// configuração de agentes
const configAgentes: Record<TipoAgente, { icone: typeof Brain; cor: string; categoria: string }> = {
  processador_docs: { icone: FileText, cor: 'text-blue-400', categoria: 'operacional' },
  extrator_entidades: { icone: Search, cor: 'text-cyan-400', categoria: 'operacional' },
  avaliador_risco: { icone: AlertTriangle, cor: 'text-amber-400', categoria: 'operacional' },
  perfilador_juiz: { icone: Scale, cor: 'text-purple-400', categoria: 'estrategico' },
  gerador_minutas: { icone: FileText, cor: 'text-emerald-400', categoria: 'operacional' },
  analisador_timing: { icone: Clock, cor: 'text-indigo-400', categoria: 'estrategico' },
  detector_fraquezas: { icone: Eye, cor: 'text-red-400', categoria: 'estrategico' },
  copiloto_atendimento: { icone: MessageSquare, cor: 'text-pink-400', categoria: 'relacional' },
  copiloto_audiencia: { icone: Users, cor: 'text-orange-400', categoria: 'relacional' },
  resumidor_reuniao: { icone: FileText, cor: 'text-teal-400', categoria: 'relacional' }
}

export function MetricasIA({
  estatisticasGlobais,
  estatisticasPorAgente,
  execucoesRecentes = [],
  periodoSelecionado = '30d',
  onPeriodoChange,
  onAgenteClick,
  onExecucaoClick,
  onRefresh,
  loading = false
}: MetricasIAProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'operacional' | 'estrategico' | 'relacional'>('todos')
  const [ordenacao, setOrdenacao] = useState<'execucoes' | 'confianca' | 'aceite'>('execucoes')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('desc')
  const [agenteExpandido, setAgenteExpandido] = useState<TipoAgente | null>(null)
  const [mostrarExecucoes, setMostrarExecucoes] = useState(false)

  // filtrar e ordenar agentes
  const agentesFiltrados = useMemo(() => {
    let filtrados = estatisticasPorAgente.filter(agente => {
      if (filtroCategoria === 'todos') return true
      const config = configAgentes[agente.tipoAgente]
      return config.categoria === filtroCategoria
    })

    filtrados.sort((a, b) => {
      let valorA: number
      let valorB: number

      switch (ordenacao) {
        case 'execucoes':
          valorA = a.totalExecucoes
          valorB = b.totalExecucoes
          break
        case 'confianca':
          valorA = a.confiancaMedia
          valorB = b.confiancaMedia
          break
        case 'aceite':
          valorA = a.feedbackAceito / (a.feedbackAceito + a.feedbackModificado + a.feedbackRejeitado) || 0
          valorB = b.feedbackAceito / (b.feedbackAceito + b.feedbackModificado + b.feedbackRejeitado) || 0
          break
        default:
          valorA = 0
          valorB = 0
      }

      return direcaoOrdenacao === 'desc' ? valorB - valorA : valorA - valorB
    })

    return filtrados
  }, [estatisticasPorAgente, filtroCategoria, ordenacao, direcaoOrdenacao])

  // formatadores
  const formatarTempo = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  const formatarPercentual = (valor: number): string => {
    return `${(valor * 100).toFixed(1)}%`
  }

  const formatarTendencia = (valor: number): { texto: string; cor: string; icone: typeof TrendingUp } => {
    const absValor = Math.abs(valor)
    const texto = `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`
    
    if (valor > 5) return { texto, cor: 'text-emerald-400', icone: TrendingUp }
    if (valor < -5) return { texto, cor: 'text-red-400', icone: TrendingDown }
    return { texto, cor: 'text-zinc-400', icone: Activity }
  }

  const formatarData = (data: Date): string => {
    const agora = new Date()
    const diff = agora.getTime() - data.getTime()
    
    if (diff < 60000) return 'agora'
    if (diff < 3600000) return `há ${Math.floor(diff / 60000)}min`
    if (diff < 86400000) return `há ${Math.floor(diff / 3600000)}h`
    return `há ${Math.floor(diff / 86400000)}d`
  }

  // calcular taxa de aceite
  const calcularTaxaAceite = (agente: EstatisticasAgente): number => {
    const total = agente.feedbackAceito + agente.feedbackModificado + agente.feedbackRejeitado
    if (total === 0) return 0
    return agente.feedbackAceito / total
  }

  const toggleOrdenacao = (campo: typeof ordenacao) => {
    if (ordenacao === campo) {
      setDirecaoOrdenacao(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setOrdenacao(campo)
      setDirecaoOrdenacao('desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-normal text-lg text-zinc-100">métricas de ia</h2>
            <p className="text-sm text-zinc-500">performance e feedback dos agentes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* seletor de período */}
          <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map(periodo => (
              <button
                key={periodo}
                onClick={() => onPeriodoChange?.(periodo)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  periodoSelecionado === periodo
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {periodo}
              </button>
            ))}
          </div>

          {/* refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 
                       hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* estatísticas globais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* total de execuções */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-zinc-500">execuções</span>
          </div>
          <p className="text-2xl font-normal text-zinc-100">
            {estatisticasGlobais.totalExecucoes.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {estatisticasGlobais.totalSugestoes.toLocaleString()} sugestões geradas
          </p>
        </div>

        {/* taxa de aceite */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-zinc-500">aceite direto</span>
          </div>
          <p className="text-2xl font-normal text-emerald-400">
            {formatarPercentual(estatisticasGlobais.taxaAceiteSemEdicao)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            +{formatarPercentual(estatisticasGlobais.taxaAceiteComEdicao)} com edição
          </p>
        </div>

        {/* taxa de rejeição */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsDown className="w-4 h-4 text-red-400" />
            <span className="text-sm text-zinc-500">rejeição</span>
          </div>
          <p className="text-2xl font-normal text-red-400">
            {formatarPercentual(estatisticasGlobais.taxaRejeicao)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            sugestões rejeitadas
          </p>
        </div>

        {/* tempo médio */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-zinc-500">tempo médio</span>
          </div>
          <p className="text-2xl font-normal text-zinc-100">
            {formatarTempo(estatisticasGlobais.tempoMedioResposta)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            por execução
          </p>
        </div>
      </div>

      {/* gráfico de execuções por dia (mini bar chart) */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-zinc-400">execuções por dia</span>
          </div>
        </div>
        
        <div className="flex items-end gap-1 h-24">
          {estatisticasGlobais.execucoesPorDia.slice(-14).map((dia, idx) => {
            const maxQtd = Math.max(...estatisticasGlobais.execucoesPorDia.map(d => d.quantidade))
            const altura = maxQtd > 0 ? (dia.quantidade / maxQtd) * 100 : 0
            
            return (
              <div
                key={idx}
                className="flex-1 group relative"
              >
                <div
                  className="w-full bg-purple-500/30 hover:bg-purple-500/50 rounded-t transition-colors"
                  style={{ height: `${Math.max(altura, 4)}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                              bg-zinc-800 rounded text-xs text-zinc-300 opacity-0 
                              group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {dia.quantidade} execuções
                  <br />
                  <span className="text-zinc-500">{dia.data}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* filtros e ordenação */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
            {(['todos', 'operacional', 'estrategico', 'relacional'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filtroCategoria === cat
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>ordenar por:</span>
          {(['execucoes', 'confianca', 'aceite'] as const).map(campo => (
            <button
              key={campo}
              onClick={() => toggleOrdenacao(campo)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                ordenacao === campo ? 'text-purple-400' : 'hover:text-zinc-300'
              }`}
            >
              {campo}
              {ordenacao === campo && (
                direcaoOrdenacao === 'desc'
                  ? <ChevronDown className="w-3 h-3" />
                  : <ChevronUp className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* lista de agentes */}
      <div className="space-y-3">
        {agentesFiltrados.map(agente => {
          const config = configAgentes[agente.tipoAgente]
          const Icone = config.icone
          const taxaAceite = calcularTaxaAceite(agente)
          const tendExec = formatarTendencia(agente.tendenciaExecucoes)
          const tendConf = formatarTendencia(agente.tendenciaConfianca)
          const tendAceite = formatarTendencia(agente.tendenciaAceite)
          const expandido = agenteExpandido === agente.tipoAgente
          const totalFeedback = agente.feedbackAceito + agente.feedbackModificado + agente.feedbackRejeitado

          return (
            <div
              key={agente.tipoAgente}
              className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden"
            >
              {/* header do agente */}
              <div
                className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                onClick={() => setAgenteExpandido(expandido ? null : agente.tipoAgente)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center`}>
                      <Icone className={`w-5 h-5 ${config.cor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-normal text-zinc-100">{agente.nomeExibicao}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          config.categoria === 'operacional'
                            ? 'bg-blue-500/20 text-blue-300'
                            : config.categoria === 'estrategico'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-pink-500/20 text-pink-300'
                        }`}>
                          {config.categoria}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">{agente.descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* métricas resumidas */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-normal text-zinc-100">
                          {agente.totalExecucoes.toLocaleString()}
                        </p>
                        <div className={`flex items-center gap-1 text-xs ${tendExec.cor}`}>
                          <tendExec.icone className="w-3 h-3" />
                          {tendExec.texto}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-normal text-zinc-100">
                          {formatarPercentual(agente.confiancaMedia)}
                        </p>
                        <div className={`flex items-center gap-1 text-xs ${tendConf.cor}`}>
                          confiança
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-normal ${
                          taxaAceite >= 0.7 ? 'text-emerald-400' :
                          taxaAceite >= 0.5 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {formatarPercentual(taxaAceite)}
                        </p>
                        <div className={`flex items-center gap-1 text-xs ${tendAceite.cor}`}>
                          aceite
                        </div>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-zinc-500 transition-transform ${
                        expandido ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* detalhes expandidos */}
              {expandido && (
                <div className="border-t border-zinc-800/50 p-4 space-y-4">
                  {/* grid de métricas detalhadas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* execuções */}
                    <div className="bg-zinc-800/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-1">últimos 7 dias</p>
                      <p className="text-xl font-normal text-zinc-100">
                        {agente.execucoesUltimos7Dias.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-zinc-800/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-1">últimos 30 dias</p>
                      <p className="text-xl font-normal text-zinc-100">
                        {agente.execucoesUltimos30Dias.toLocaleString()}
                      </p>
                    </div>

                    {/* tempo */}
                    <div className="bg-zinc-800/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-1">tempo médio</p>
                      <p className="text-xl font-normal text-zinc-100">
                        {formatarTempo(agente.tempoMedioMs)}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        p50: {formatarTempo(agente.tempoMedianoMs)} | p95: {formatarTempo(agente.tempoP95Ms)}
                      </p>
                    </div>

                    {/* erros */}
                    <div className="bg-zinc-800/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-1">taxa de erro</p>
                      <p className={`text-xl font-normal ${
                        agente.taxaErro < 0.01 ? 'text-emerald-400' :
                        agente.taxaErro < 0.05 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {formatarPercentual(agente.taxaErro)}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {agente.totalErros} erros total
                      </p>
                    </div>
                  </div>

                  {/* métricas de qualidade */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-800/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-2">confiança média</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${agente.confiancaMedia * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-300">
                          {formatarPercentual(agente.confiancaMedia)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-2">fundamentação</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${agente.fundamentacaoMedia * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-300">
                          {formatarPercentual(agente.fundamentacaoMedia)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-800/30 rounded-lg p-3">
                      <p className="text-xs text-zinc-500 mb-2">consistência</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${agente.consistenciaMedia * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-300">
                          {formatarPercentual(agente.consistenciaMedia)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* feedback humano */}
                  <div className="bg-zinc-800/30 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-3">feedback humano ({totalFeedback} avaliações)</p>
                    
                    {totalFeedback > 0 ? (
                      <div className="space-y-2">
                        {/* barra de distribuição */}
                        <div className="h-4 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 transition-all"
                            style={{ width: `${(agente.feedbackAceito / totalFeedback) * 100}%` }}
                          />
                          <div
                            className="bg-amber-500 transition-all"
                            style={{ width: `${(agente.feedbackModificado / totalFeedback) * 100}%` }}
                          />
                          <div
                            className="bg-red-500 transition-all"
                            style={{ width: `${(agente.feedbackRejeitado / totalFeedback) * 100}%` }}
                          />
                        </div>

                        {/* legenda */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-zinc-400">aceito:</span>
                            <span className="text-zinc-200">{agente.feedbackAceito}</span>
                            <span className="text-zinc-500">
                              ({formatarPercentual(agente.feedbackAceito / totalFeedback)})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-amber-400" />
                            <span className="text-zinc-400">modificado:</span>
                            <span className="text-zinc-200">{agente.feedbackModificado}</span>
                            <span className="text-zinc-500">
                              ({formatarPercentual(agente.feedbackModificado / totalFeedback)})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-zinc-400">rejeitado:</span>
                            <span className="text-zinc-200">{agente.feedbackRejeitado}</span>
                            <span className="text-zinc-500">
                              ({formatarPercentual(agente.feedbackRejeitado / totalFeedback)})
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm">nenhum feedback registrado</p>
                    )}
                  </div>

                  {/* ações */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => onAgenteClick?.(agente.tipoAgente)}
                      className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg 
                               hover:bg-purple-500/30 transition-colors text-sm"
                    >
                      ver todas as execuções
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {agentesFiltrados.length === 0 && (
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-8 text-center">
            <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">nenhum agente encontrado com os filtros aplicados</p>
          </div>
        )}
      </div>

      {/* execuções recentes (opcional) */}
      {execucoesRecentes.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <button
            onClick={() => setMostrarExecucoes(!mostrarExecucoes)}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-zinc-300">execuções recentes</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-500">
                {execucoesRecentes.length}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform ${
                mostrarExecucoes ? 'rotate-180' : ''
              }`}
            />
          </button>

          {mostrarExecucoes && (
            <div className="border-t border-zinc-800/50">
              {execucoesRecentes.slice(0, 10).map(exec => {
                const config = configAgentes[exec.tipoAgente]
                const Icone = config.icone

                return (
                  <div
                    key={exec.id}
                    onClick={() => onExecucaoClick?.(exec.id)}
                    className="p-4 border-b border-zinc-800/30 last:border-b-0 
                             hover:bg-zinc-800/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Icone className={`w-4 h-4 ${config.cor}`} />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-200">{exec.tipoAgente}</p>
                          <p className="text-xs text-zinc-500">
                            {exec.tipoEntidadeGatilho}:{exec.idEntidadeGatilho.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* status */}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          exec.status === 'concluido'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : exec.status === 'falhou'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}>
                          {exec.status}
                        </span>

                        {/* feedback */}
                        {exec.feedbackHumano && (
                          <span className={`text-xs ${
                            exec.feedbackHumano === 'aceito'
                              ? 'text-emerald-400'
                              : exec.feedbackHumano === 'modificado'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}>
                            {exec.feedbackHumano}
                          </span>
                        )}

                        {/* duração */}
                        <span className="text-xs text-zinc-500">
                          {formatarTempo(exec.duracaoMs)}
                        </span>

                        {/* tempo */}
                        <span className="text-xs text-zinc-600">
                          {formatarData(exec.criadoEm)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
