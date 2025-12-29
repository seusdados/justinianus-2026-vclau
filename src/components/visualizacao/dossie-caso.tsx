'use client'

import { useState } from 'react'
import {
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Scale,
  FileCheck,
  ListTodo,
  Network,
  History,
  Bot,
  Eye,
  Tag,
  MapPin,
  Phone,
  Mail,
  Hash,
  Briefcase,
  TrendingUp,
  Shield,
  Sparkles,
  GripVertical,
  MoreHorizontal
} from 'lucide-react'

// status do caso
type StatusCaso = 
  | 'rascunho'
  | 'em_analise'
  | 'aguardando_documentos'
  | 'em_andamento'
  | 'aguardando_julgamento'
  | 'encerrado_ganho'
  | 'encerrado_perdido'
  | 'encerrado_acordo'
  | 'arquivado'

// prioridade
type Prioridade = 'baixa' | 'media' | 'alta' | 'critica'

// tipo de documento
type TipoDocumento = 
  | 'peticao_inicial'
  | 'contestacao'
  | 'recurso'
  | 'sentenca'
  | 'acordao'
  | 'contrato'
  | 'procuracao'
  | 'comprovante'
  | 'laudo'
  | 'outro'

// status de prazo
type StatusPrazo = 'pendente' | 'em_andamento' | 'concluido' | 'perdido'

// status de tarefa
type StatusTarefa = 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'

// cliente
interface Cliente {
  id: string
  nome: string
  tipo: 'pessoa_fisica' | 'pessoa_juridica'
  documento?: string
  email?: string
  telefone?: string
  endereco?: string
}

// lead original
interface Lead {
  id: string
  nome: string
  canal: string
  data_entrada: string
  pontuacao_qualificacao?: number
}

// documento
interface Documento {
  id: string
  nome: string
  tipo: TipoDocumento
  data_upload: string
  tamanho_bytes: number
  processado_ia: boolean
  resumo_ia?: string
  url_preview?: string
}

// prazo
interface Prazo {
  id: string
  tipo: string
  descricao: string
  data_ajustada: string
  status: StatusPrazo
  prioridade: Prioridade
  responsavel?: string
}

// tarefa
interface Tarefa {
  id: string
  titulo: string
  status: StatusTarefa
  prioridade: Prioridade
  data_limite?: string
  responsavel?: string
}

// evento de auditoria resumido
interface EventoAuditoria {
  id: string
  tipo: string
  descricao: string
  data: string
  ator: string
  tipo_ator: 'usuario' | 'agente' | 'sistema'
}

// execução IA resumida
interface ExecucaoIA {
  id: string
  tipo_agente: string
  data: string
  sugestoes_geradas: number
  sugestoes_aplicadas: number
  confianca: number
}

// nó do grafo resumido
interface NoGrafoResumo {
  id: string
  tipo: string
  titulo: string
  forca: number
}

// caso completo
interface CasoCompleto {
  id: string
  numero_processo?: string
  titulo: string
  descricao?: string
  status: StatusCaso
  prioridade: Prioridade
  area_direito: string
  valor_causa?: number
  data_distribuicao?: string
  comarca?: string
  vara?: string
  juiz?: string
  cliente: Cliente
  lead?: Lead
  responsavel: {
    id: string
    nome: string
    email?: string
  }
  documentos: Documento[]
  prazos: Prazo[]
  tarefas: Tarefa[]
  grafo: {
    total_nos: number
    nos: NoGrafoResumo[]
    total_arestas: number
  }
  auditoria: EventoAuditoria[]
  execucoes_ia: ExecucaoIA[]
  metricas: {
    dias_em_andamento: number
    documentos_processados: number
    prazos_cumpridos: number
    prazos_total: number
    tarefas_concluidas: number
    tarefas_total: number
    execucoes_ia_total: number
    taxa_aceitacao_ia: number
  }
  created_at: string
  updated_at: string
}

interface DossieCasoProps {
  caso: CasoCompleto
  onDocumentoClick?: (documento: Documento) => void
  onPrazoClick?: (prazo: Prazo) => void
  onTarefaClick?: (tarefa: Tarefa) => void
  onGrafoClick?: () => void
  onAuditoriaClick?: () => void
  onExportarPDF?: () => void
  onExportarJSON?: () => void
}

// configurações de status
const STATUS_CONFIG: Record<StatusCaso, { cor: string; label: string }> = {
  rascunho: { cor: 'text-stone-400 bg-stone-900/50', label: 'rascunho' },
  em_analise: { cor: 'text-blue-400 bg-blue-950/50', label: 'em análise' },
  aguardando_documentos: { cor: 'text-amber-400 bg-amber-950/50', label: 'aguardando docs' },
  em_andamento: { cor: 'text-cyan-400 bg-cyan-950/50', label: 'em andamento' },
  aguardando_julgamento: { cor: 'text-purple-400 bg-purple-950/50', label: 'aguardando julgamento' },
  encerrado_ganho: { cor: 'text-green-400 bg-green-950/50', label: 'ganho' },
  encerrado_perdido: { cor: 'text-red-400 bg-red-950/50', label: 'perdido' },
  encerrado_acordo: { cor: 'text-teal-400 bg-teal-950/50', label: 'acordo' },
  arquivado: { cor: 'text-stone-500 bg-stone-900/50', label: 'arquivado' }
}

const PRIORIDADE_CONFIG: Record<Prioridade, { cor: string; label: string }> = {
  baixa: { cor: 'text-stone-400', label: 'baixa' },
  media: { cor: 'text-blue-400', label: 'média' },
  alta: { cor: 'text-amber-400', label: 'alta' },
  critica: { cor: 'text-red-400', label: 'crítica' }
}

const TIPO_DOC_CONFIG: Record<TipoDocumento, string> = {
  peticao_inicial: 'petição inicial',
  contestacao: 'contestação',
  recurso: 'recurso',
  sentenca: 'sentença',
  acordao: 'acórdão',
  contrato: 'contrato',
  procuracao: 'procuração',
  comprovante: 'comprovante',
  laudo: 'laudo',
  outro: 'outro'
}

export function DossieCaso({
  caso,
  onDocumentoClick,
  onPrazoClick,
  onTarefaClick,
  onGrafoClick,
  onAuditoriaClick,
  onExportarPDF,
  onExportarJSON
}: DossieCasoProps) {
  const [secaoExpandida, setSecaoExpandida] = useState<string | null>('info')
  
  // toggle seção
  const toggleSecao = (secao: string) => {
    setSecaoExpandida(secaoExpandida === secao ? null : secao)
  }

  // formatar valor
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // formatar tamanho
  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // formatar data
  const formatarData = (dataStr: string) => {
    return new Date(dataStr).toLocaleDateString('pt-BR')
  }

  // calcular dias restantes
  const calcularDiasRestantes = (dataStr: string) => {
    const data = new Date(dataStr)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    data.setHours(0, 0, 0, 0)
    return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  // seção header
  const SecaoHeader = ({ 
    titulo, 
    icone: Icone, 
    id, 
    badge 
  }: { 
    titulo: string
    icone: typeof FileText
    id: string
    badge?: number 
  }) => (
    <button
      onClick={() => toggleSecao(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-stone-800/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icone className="w-5 h-5 text-stone-400" />
        <span className="text-sm text-stone-200">{titulo}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 text-xs bg-stone-800 text-stone-400 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {secaoExpandida === id ? (
        <ChevronDown className="w-4 h-4 text-stone-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-stone-500" />
      )}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* header principal */}
      <div className="p-6 bg-stone-900/30 rounded-xl border border-stone-800/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-stone-800/50 flex items-center justify-center">
              <Scale className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {caso.numero_processo && (
                  <span className="text-xs text-stone-500 font-mono">
                    {caso.numero_processo}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_CONFIG[caso.status].cor}`}>
                  {STATUS_CONFIG[caso.status].label}
                </span>
                <span className={`text-xs ${PRIORIDADE_CONFIG[caso.prioridade].cor}`}>
                  {PRIORIDADE_CONFIG[caso.prioridade].label}
                </span>
              </div>
              <h1 className="text-xl text-stone-100">{caso.titulo}</h1>
              {caso.descricao && (
                <p className="text-sm text-stone-500 mt-1 max-w-2xl">
                  {caso.descricao}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportarPDF && (
              <button
                onClick={onExportarPDF}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            )}
            {onExportarJSON && (
              <button
                onClick={onExportarJSON}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            )}
          </div>
        </div>

        {/* métricas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-stone-800/50">
          <div>
            <p className="text-xs text-stone-500">dias em andamento</p>
            <p className="text-lg text-stone-200">{caso.metricas.dias_em_andamento}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">documentos</p>
            <p className="text-lg text-stone-200">
              {caso.metricas.documentos_processados}/{caso.documentos.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">prazos</p>
            <p className="text-lg text-stone-200">
              {caso.metricas.prazos_cumpridos}/{caso.metricas.prazos_total}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">tarefas</p>
            <p className="text-lg text-stone-200">
              {caso.metricas.tarefas_concluidas}/{caso.metricas.tarefas_total}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">execuções IA</p>
            <p className="text-lg text-stone-200">{caso.metricas.execucoes_ia_total}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">aceitação IA</p>
            <p className="text-lg text-stone-200">{caso.metricas.taxa_aceitacao_ia.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* seções colapsáveis */}
      <div className="bg-stone-900/30 rounded-xl border border-stone-800/50 overflow-hidden divide-y divide-stone-800/50">
        
        {/* informações do caso */}
        <div>
          <SecaoHeader titulo="informações do caso" icone={FileText} id="info" />
          {secaoExpandida === 'info' && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-stone-500 mb-1">área do direito</p>
                  <p className="text-sm text-stone-200">{caso.area_direito}</p>
                </div>
                {caso.valor_causa && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">valor da causa</p>
                    <p className="text-sm text-stone-200">{formatarValor(caso.valor_causa)}</p>
                  </div>
                )}
                {caso.data_distribuicao && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">data de distribuição</p>
                    <p className="text-sm text-stone-200">{formatarData(caso.data_distribuicao)}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {caso.comarca && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">comarca</p>
                    <p className="text-sm text-stone-200">{caso.comarca}</p>
                  </div>
                )}
                {caso.vara && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">vara</p>
                    <p className="text-sm text-stone-200">{caso.vara}</p>
                  </div>
                )}
                {caso.juiz && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">juiz</p>
                    <p className="text-sm text-stone-200">{caso.juiz}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* cliente */}
        <div>
          <SecaoHeader titulo="cliente" icone={User} id="cliente" />
          {secaoExpandida === 'cliente' && (
            <div className="px-4 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-stone-800/50 flex items-center justify-center">
                  {caso.cliente.tipo === 'pessoa_juridica' ? (
                    <Building2 className="w-6 h-6 text-stone-400" />
                  ) : (
                    <User className="w-6 h-6 text-stone-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-stone-200">{caso.cliente.nome}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {caso.cliente.documento && (
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Hash className="w-3 h-3" />
                        {caso.cliente.documento}
                      </div>
                    )}
                    {caso.cliente.email && (
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Mail className="w-3 h-3" />
                        {caso.cliente.email}
                      </div>
                    )}
                    {caso.cliente.telefone && (
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Phone className="w-3 h-3" />
                        {caso.cliente.telefone}
                      </div>
                    )}
                  </div>
                  {caso.cliente.endereco && (
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <MapPin className="w-3 h-3" />
                      {caso.cliente.endereco}
                    </div>
                  )}
                </div>
              </div>

              {caso.lead && (
                <div className="mt-4 p-3 bg-stone-800/30 rounded-lg">
                  <p className="text-xs text-stone-500 mb-2">lead de origem</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-300">{caso.lead.nome}</p>
                      <p className="text-xs text-stone-500">
                        via {caso.lead.canal} em {formatarData(caso.lead.data_entrada)}
                      </p>
                    </div>
                    {caso.lead.pontuacao_qualificacao && (
                      <div className="text-right">
                        <p className="text-xs text-stone-500">pontuação</p>
                        <p className="text-sm text-stone-200">
                          {caso.lead.pontuacao_qualificacao}/100
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* responsável */}
        <div>
          <SecaoHeader titulo="responsável" icone={Briefcase} id="responsavel" />
          {secaoExpandida === 'responsavel' && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-800/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-stone-400" />
                </div>
                <div>
                  <p className="text-sm text-stone-200">{caso.responsavel.nome}</p>
                  {caso.responsavel.email && (
                    <p className="text-xs text-stone-500">{caso.responsavel.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* documentos */}
        <div>
          <SecaoHeader 
            titulo="documentos" 
            icone={FileCheck} 
            id="documentos" 
            badge={caso.documentos.length}
          />
          {secaoExpandida === 'documentos' && (
            <div className="px-4 pb-4 space-y-2">
              {caso.documentos.length === 0 ? (
                <p className="text-sm text-stone-500 py-4 text-center">
                  nenhum documento anexado
                </p>
              ) : (
                caso.documentos.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onDocumentoClick?.(doc)}
                    className="w-full flex items-center gap-4 p-3 bg-stone-800/30 hover:bg-stone-800/50 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-8 h-8 text-stone-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-stone-200 truncate">{doc.nome}</p>
                        {doc.processado_ia && (
                          <Sparkles className="w-3 h-3 text-purple-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        <span>{TIPO_DOC_CONFIG[doc.tipo]}</span>
                        <span>{formatarTamanho(doc.tamanho_bytes)}</span>
                        <span>{formatarData(doc.data_upload)}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-600" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* prazos */}
        <div>
          <SecaoHeader 
            titulo="prazos" 
            icone={Calendar} 
            id="prazos" 
            badge={caso.prazos.filter(p => p.status === 'pendente').length}
          />
          {secaoExpandida === 'prazos' && (
            <div className="px-4 pb-4 space-y-2">
              {caso.prazos.length === 0 ? (
                <p className="text-sm text-stone-500 py-4 text-center">
                  nenhum prazo cadastrado
                </p>
              ) : (
                caso.prazos
                  .sort((a, b) => new Date(a.data_ajustada).getTime() - new Date(b.data_ajustada).getTime())
                  .map((prazo) => {
                    const diasRestantes = calcularDiasRestantes(prazo.data_ajustada)
                    const isVencido = diasRestantes < 0 && prazo.status !== 'concluido'
                    const isCritico = diasRestantes <= 3 && diasRestantes >= 0

                    return (
                      <button
                        key={prazo.id}
                        onClick={() => onPrazoClick?.(prazo)}
                        className="w-full flex items-center gap-4 p-3 bg-stone-800/30 hover:bg-stone-800/50 rounded-lg transition-colors text-left"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          prazo.status === 'concluido'
                            ? 'bg-green-950/50'
                            : isVencido
                            ? 'bg-red-950/50'
                            : isCritico
                            ? 'bg-amber-950/50'
                            : 'bg-stone-800/50'
                        }`}>
                          {prazo.status === 'concluido' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : isVencido ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : isCritico ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Calendar className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-200">{prazo.tipo}</p>
                          <p className="text-xs text-stone-500 truncate">{prazo.descricao}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${
                            prazo.status === 'concluido'
                              ? 'text-green-400'
                              : isVencido
                              ? 'text-red-400'
                              : isCritico
                              ? 'text-amber-400'
                              : 'text-stone-300'
                          }`}>
                            {formatarData(prazo.data_ajustada)}
                          </p>
                          <p className={`text-xs ${PRIORIDADE_CONFIG[prazo.prioridade].cor}`}>
                            {PRIORIDADE_CONFIG[prazo.prioridade].label}
                          </p>
                        </div>
                      </button>
                    )
                  })
              )}
            </div>
          )}
        </div>

        {/* tarefas */}
        <div>
          <SecaoHeader 
            titulo="tarefas" 
            icone={ListTodo} 
            id="tarefas" 
            badge={caso.tarefas.filter(t => t.status !== 'concluida' && t.status !== 'cancelada').length}
          />
          {secaoExpandida === 'tarefas' && (
            <div className="px-4 pb-4 space-y-2">
              {caso.tarefas.length === 0 ? (
                <p className="text-sm text-stone-500 py-4 text-center">
                  nenhuma tarefa cadastrada
                </p>
              ) : (
                caso.tarefas.map((tarefa) => {
                  const statusIcons: Record<StatusTarefa, typeof CheckCircle> = {
                    aberta: Clock,
                    em_andamento: TrendingUp,
                    aguardando: Clock,
                    concluida: CheckCircle,
                    cancelada: XCircle
                  }
                  const StatusIcon = statusIcons[tarefa.status]

                  return (
                    <button
                      key={tarefa.id}
                      onClick={() => onTarefaClick?.(tarefa)}
                      className="w-full flex items-center gap-4 p-3 bg-stone-800/30 hover:bg-stone-800/50 rounded-lg transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tarefa.status === 'concluida'
                          ? 'bg-green-950/50'
                          : tarefa.status === 'cancelada'
                          ? 'bg-stone-800/50'
                          : 'bg-stone-800/50'
                      }`}>
                        <StatusIcon className={`w-4 h-4 ${
                          tarefa.status === 'concluida'
                            ? 'text-green-400'
                            : tarefa.status === 'cancelada'
                            ? 'text-stone-600'
                            : 'text-stone-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          tarefa.status === 'concluida'
                            ? 'text-stone-500 line-through'
                            : tarefa.status === 'cancelada'
                            ? 'text-stone-600 line-through'
                            : 'text-stone-200'
                        }`}>
                          {tarefa.titulo}
                        </p>
                        {tarefa.responsavel && (
                          <p className="text-xs text-stone-500">{tarefa.responsavel}</p>
                        )}
                      </div>
                      {tarefa.data_limite && (
                        <span className="text-xs text-stone-500">
                          {formatarData(tarefa.data_limite)}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* grafo de evidências */}
        <div>
          <SecaoHeader 
            titulo="grafo de evidências" 
            icone={Network} 
            id="grafo" 
            badge={caso.grafo.total_nos}
          />
          {secaoExpandida === 'grafo' && (
            <div className="px-4 pb-4">
              <div className="p-4 bg-stone-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-stone-200">
                      {caso.grafo.total_nos} nós · {caso.grafo.total_arestas} relações
                    </p>
                  </div>
                  {onGrafoClick && (
                    <button
                      onClick={onGrafoClick}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-950/50 text-purple-400 rounded-lg hover:bg-purple-950/70 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      visualizar
                    </button>
                  )}
                </div>
                
                {caso.grafo.nos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-500">elementos principais:</p>
                    {caso.grafo.nos.slice(0, 5).map((no) => (
                      <div
                        key={no.id}
                        className="flex items-center gap-3 text-xs"
                      >
                        <span className="px-2 py-0.5 bg-stone-800 text-stone-400 rounded">
                          {no.tipo}
                        </span>
                        <span className="text-stone-300 flex-1 truncate">{no.titulo}</span>
                        <span className="text-stone-500">{(no.forca * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* execuções IA */}
        <div>
          <SecaoHeader 
            titulo="execuções de ia" 
            icone={Bot} 
            id="ia" 
            badge={caso.execucoes_ia.length}
          />
          {secaoExpandida === 'ia' && (
            <div className="px-4 pb-4 space-y-2">
              {caso.execucoes_ia.length === 0 ? (
                <p className="text-sm text-stone-500 py-4 text-center">
                  nenhuma execução de ia registrada
                </p>
              ) : (
                caso.execucoes_ia
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .slice(0, 10)
                  .map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center gap-4 p-3 bg-stone-800/30 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-950/50 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-200">{exec.tipo_agente}</p>
                        <p className="text-xs text-stone-500">
                          {exec.sugestoes_aplicadas}/{exec.sugestoes_geradas} sugestões aplicadas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-400">
                          {(exec.confianca * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-stone-500">{formatarData(exec.data)}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* auditoria */}
        <div>
          <SecaoHeader 
            titulo="trilha de auditoria" 
            icone={History} 
            id="auditoria" 
            badge={caso.auditoria.length}
          />
          {secaoExpandida === 'auditoria' && (
            <div className="px-4 pb-4">
              {caso.auditoria.length === 0 ? (
                <p className="text-sm text-stone-500 py-4 text-center">
                  nenhum evento registrado
                </p>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {caso.auditoria
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .slice(0, 10)
                      .map((evento) => (
                        <div
                          key={evento.id}
                          className="flex items-center gap-3 p-2 text-xs"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            evento.tipo_ator === 'agente'
                              ? 'bg-purple-950/50'
                              : evento.tipo_ator === 'sistema'
                              ? 'bg-stone-800'
                              : 'bg-blue-950/50'
                          }`}>
                            {evento.tipo_ator === 'agente' ? (
                              <Bot className="w-3 h-3 text-purple-400" />
                            ) : evento.tipo_ator === 'sistema' ? (
                              <Shield className="w-3 h-3 text-stone-400" />
                            ) : (
                              <User className="w-3 h-3 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-stone-300">{evento.descricao}</span>
                            <span className="text-stone-600 ml-2">por {evento.ator}</span>
                          </div>
                          <span className="text-stone-600">{formatarData(evento.data)}</span>
                        </div>
                      ))
                    }
                  </div>
                  {onAuditoriaClick && caso.auditoria.length > 10 && (
                    <button
                      onClick={onAuditoriaClick}
                      className="w-full mt-4 py-2 text-xs text-stone-400 hover:text-stone-300 transition-colors"
                    >
                      ver todos os {caso.auditoria.length} eventos →
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* timestamps */}
      <div className="flex items-center justify-between text-xs text-stone-600 px-2">
        <span>criado em {formatarData(caso.created_at)}</span>
        <span>atualizado em {formatarData(caso.updated_at)}</span>
      </div>
    </div>
  )
}
