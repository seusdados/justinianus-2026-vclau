'use client'

import { useState, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  FileText,
  Shield,
  Clock,
  Download,
  Filter,
  Search,
  User,
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Lock,
  FileJson,
  FileType,
  Printer,
  Share2,
  Archive,
  Loader2,
  RefreshCw,
  Activity,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge, FaseBadge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/input'
import { TimelineAuditoria } from '@/components/visualizacao/timeline-auditoria'
import { 
  useCaso, 
  useAuditoria,
  useAuditoriaStats,
  useExecucoesIA,
  useDocumentos
} from '@/hooks'
import { formatarData, formatarMoeda } from '@/lib/utils'

function RegistroPageContent() {
  const searchParams = useSearchParams()
  const casoIdParam = searchParams.get('caso')
  const casoId = casoIdParam ? parseInt(casoIdParam) : 1

  const [abaSelecionada, setAbaSelecionada] = useState<'auditoria' | 'lgpd' | 'metricas' | 'dossie'>('auditoria')
  const [filtroAuditoria, setFiltroAuditoria] = useState<string>('todos')
  const [buscaAuditoria, setBuscaAuditoria] = useState('')

  // Hooks de dados
  const { caso, loading: loadingCaso, refetch: refetchCaso } = useCaso(casoId)
  
  const { 
    logs, 
    loading: loadingAuditoria, 
    refetch: refetchAuditoria 
  } = useAuditoria({ 
    tipoEntidade: 'caso', 
    idEntidade: casoId.toString() 
  })
  
  const { stats: auditoriaStats } = useAuditoriaStats()
  
  const { 
    execucoes, 
    loading: loadingExecucoes 
  } = useExecucoesIA({ tipoEntidadeGatilho: 'caso', idEntidadeGatilho: casoId.toString() })
  
  const { 
    documentos, 
    loading: loadingDocumentos 
  } = useDocumentos({ casoId })

  // Filtrar logs de auditoria
  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      if (filtroAuditoria !== 'todos' && log.tipo_ator !== filtroAuditoria) return false
      if (buscaAuditoria) {
        const termos = [log.evento, log.categoria_evento, log.tipo_ator].join(' ').toLowerCase()
        if (!termos.includes(buscaAuditoria.toLowerCase())) return false
      }
      return true
    })
  }, [logs, filtroAuditoria, buscaAuditoria])

  // Métricas calculadas
  const metricas = useMemo(() => {
    const logsOrdenados = [...logs].sort((a, b) => 
      new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    )
    
    const execucoesIa = execucoes.length
    const documentosProcessados = documentos.filter(d => d.ocr_processado).length
    const taxaAceiteSugestoes = execucoes.length > 0 
      ? execucoes.filter(e => e.status === 'concluido').length / execucoes.length 
      : 0
    const custoIaEstimado = execucoes.reduce((acc, e) => acc + (e.duracao_ms || 0), 0) / 1000000 * 0.002

    return {
      execucoesIa,
      documentosProcessados,
      totalDocumentos: documentos.length,
      taxaAceiteSugestoes,
      custoIaEstimado,
      totalEventos: logs.length
    }
  }, [logs, execucoes, documentos])

  // Dados LGPD
  const dadosLgpd = useMemo(() => ({
    baseLegal: 'Art. 7º, V - Execução de contrato',
    finalidade: 'Prestação de serviços advocatícios e defesa em juízo',
    dadosTratados: [
      { categoria: 'Dados de identificação', tipos: ['Nome', 'CPF', 'RG', 'Endereço'], sensivel: false },
      { categoria: 'Dados trabalhistas', tipos: ['CTPS', 'Salário', 'Jornada'], sensivel: false },
      { categoria: 'Dados de saúde', tipos: ['Atestados (se houver)'], sensivel: true },
    ],
    execucoesIa: execucoes.slice(0, 5).map(e => ({
      agente: e.tipo_agente,
      execucoes: 1,
      ultimaExecucao: e.iniciado_em
    })),
    consentimentos: [
      { tipo: 'Tratamento de dados', data: (caso as any)?.criado_em || new Date(), status: 'ativo' },
      { tipo: 'Uso de IA', data: (caso as any)?.criado_em || new Date(), status: 'ativo' },
      { tipo: 'Portal do cliente', data: (caso as any)?.criado_em || new Date(), status: (caso as any)?.portal_cliente_habilitado ? 'ativo' : 'inativo' },
    ],
    retencao: {
      prazoAnos: 5,
      baseCalculo: 'Data de encerramento do caso + prazo prescricional',
      exclusaoAutomatica: true,
    },
  }), [caso, execucoes])

  // Handlers
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchCaso(),
      refetchAuditoria()
    ])
  }, [refetchCaso, refetchAuditoria])

  const handleExportarDossie = (formato: 'pdf' | 'json') => {
    console.log(`Exportando dossiê em formato ${formato}`)
    // TODO: implementar exportação
  }

  const handleExportarAuditoria = () => {
    const dados = JSON.stringify(logs, null, 2)
    const blob = new Blob([dados], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria-caso-${casoId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loading = loadingCaso || loadingAuditoria

  // Loading state
  if (loading && !caso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">carregando registros...</p>
      </div>
    )
  }

  // Empty state
  if (!caso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-light">caso não encontrado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          o caso solicitado não foi encontrado ou você não tem permissão para acessá-lo
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/casos'}>
          ver todos os casos
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            voltar
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{(caso as any).numero_interno || `CASO-${(caso as any).id}`}</Badge>
            <FaseBadge fase="registro" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportarAuditoria}>
            <Download className="h-4 w-4 mr-2" />
            exportar auditoria
          </Button>
        </div>
      </div>

      {/* resumo do caso */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-normal">{(caso as any).titulo}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {(caso as any).tribunal && <span>{(caso as any).tribunal}</span>}
                {(caso as any).valor_causa && <span>{formatarMoeda((caso as any).valor_causa)}</span>}
                <span>aberto {formatarData((caso as any).aberto_em, 'relativa')}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-light">{metricas.totalEventos}</div>
                <div className="text-xs text-muted-foreground">eventos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light">{metricas.execucoesIa}</div>
                <div className="text-xs text-muted-foreground">execuções ia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light">{metricas.documentosProcessados}</div>
                <div className="text-xs text-muted-foreground">docs processados</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* abas */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setAbaSelecionada('auditoria')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'auditoria' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="h-4 w-4" />
          trilha de auditoria
          <span className="ml-1 px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
            {logs.length}
          </span>
        </button>
        <button
          onClick={() => setAbaSelecionada('lgpd')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'lgpd' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          lgpd & compliance
        </button>
        <button
          onClick={() => setAbaSelecionada('metricas')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'metricas' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          métricas
        </button>
        <button
          onClick={() => setAbaSelecionada('dossie')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'dossie' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          dossiê
        </button>
      </div>

      {/* conteúdo */}
      {abaSelecionada === 'auditoria' && (
        <div className="space-y-4">
          {/* filtros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                {[
                  { value: 'todos', label: 'todos' },
                  { value: 'usuario', label: 'usuário', icon: User },
                  { value: 'agente', label: 'agente ia', icon: Bot },
                  { value: 'sistema', label: 'sistema', icon: Clock },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFiltroAuditoria(value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                      filtroAuditoria === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <SearchInput
              placeholder="buscar eventos..."
              value={buscaAuditoria}
              onChange={(e) => setBuscaAuditoria(e.target.value)}
              className="w-64"
            />
          </div>

          {/* timeline */}
          {logsFiltrados.length > 0 ? (
            <TimelineAuditoria
              eventos={logsFiltrados as any}
              mostrarFiltros={false}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-normal mb-2">nenhum evento encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  {buscaAuditoria || filtroAuditoria !== 'todos' 
                    ? 'tente ajustar os filtros de busca'
                    : 'os eventos serão registrados conforme as ações no caso'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {abaSelecionada === 'lgpd' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            {/* base legal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  base legal do tratamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm text-green-500">{dadosLgpd.baseLegal}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">finalidade:</span>
                  <p className="mt-1">{dadosLgpd.finalidade}</p>
                </div>
              </CardContent>
            </Card>

            {/* dados tratados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">dados tratados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dadosLgpd.dadosTratados.map((categoria, i) => (
                    <div key={i} className="flex items-start justify-between p-4 rounded-lg bg-muted/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-normal">{categoria.categoria}</h4>
                          {categoria.sensivel && (
                            <Badge className="bg-amber-500/20 text-amber-500 text-xs">
                              sensível
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {categoria.tipos.map(tipo => (
                            <Badge key={tipo} variant="outline" className="text-xs">
                              {tipo}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {categoria.sensivel ? (
                        <Lock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* execuções de ia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">execuções de ia</CardTitle>
                <CardDescription>
                  agentes que processaram dados deste caso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {execucoes.length > 0 ? (
                    execucoes.slice(0, 5).map(execucao => (
                      <div key={execucao.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Bot className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-normal">{execucao.tipo_agente}</span>
                            <p className="text-xs text-muted-foreground">
                              {formatarData(execucao.iniciado_em, 'relativa')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          execucao.status === 'concluido' ? 'bg-green-500/20 text-green-500' :
                          execucao.status === 'falhou' ? 'bg-red-500/20 text-red-500' :
                          'bg-amber-500/20 text-amber-500'
                        }>
                          {execucao.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      nenhuma execução de ia registrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 space-y-4">
            {/* consentimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">consentimentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dadosLgpd.consentimentos.map((consent, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{consent.tipo}</span>
                    <Badge className={
                      consent.status === 'ativo' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-muted text-muted-foreground'
                    }>
                      {consent.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* retenção */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">política de retenção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">prazo</span>
                  <span>{dadosLgpd.retencao.prazoAnos} anos</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">exclusão automática</span>
                  <Badge className={dadosLgpd.retencao.exclusaoAutomatica ? 'bg-green-500/20 text-green-500' : ''}>
                    {dadosLgpd.retencao.exclusaoAutomatica ? 'sim' : 'não'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  {dadosLgpd.retencao.baseCalculo}
                </p>
              </CardContent>
            </Card>

            {/* ações */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <FileType className="h-4 w-4 mr-2" />
                  exportar relatório lgpd
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  atender requisição titular
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {abaSelecionada === 'metricas' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            {/* timeline do caso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">timeline do caso</CardTitle>
                <CardDescription>
                  tempo gasto em cada fase do fluxo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['captação', 'qualificação', 'análise', 'ação', 'registro'].map((fase, i) => (
                    <div key={fase} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">{fase}</div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${i <= 4 ? 'bg-primary' : 'bg-muted'}`}
                          style={{ width: `${Math.random() * 40 + 20}%` }}
                        />
                      </div>
                      <div className="w-20 text-sm text-right">
                        {['30min', '2h', '3h', '5h', '—'][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* distribuição de eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">distribuição de eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <User className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-light">
                      {logs.filter(l => l.tipo_ator === 'usuario').length}
                    </div>
                    <div className="text-xs text-muted-foreground">usuário</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Bot className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-light">
                      {logs.filter(l => l.tipo_ator === 'agente').length}
                    </div>
                    <div className="text-xs text-muted-foreground">agente ia</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-light">
                      {logs.filter(l => l.tipo_ator === 'sistema').length}
                    </div>
                    <div className="text-xs text-muted-foreground">sistema</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 space-y-4">
            {/* eficiência da ia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">eficiência da ia</CardTitle>
                <CardDescription>métricas de qualidade das sugestões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">taxa de aceite de sugestões</span>
                    <span>{Math.round(metricas.taxaAceiteSugestoes * 100)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${metricas.taxaAceiteSugestoes * 100}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 rounded bg-muted/30">
                    <span className="text-2xl font-light">{metricas.execucoesIa}</span>
                    <p className="text-xs text-muted-foreground">execuções de ia</p>
                  </div>
                  <div className="text-center p-3 rounded bg-muted/30">
                    <span className="text-2xl font-light">{logs.filter(l => l.tipo_ator === 'usuario').length}</span>
                    <p className="text-xs text-muted-foreground">ajustes humanos</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">custo estimado de ia</span>
                    <span className="text-green-500">R$ {metricas.custoIaEstimado.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* documentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded bg-muted/30">
                    <span className="text-3xl font-light">{metricas.documentosProcessados}</span>
                    <p className="text-sm text-muted-foreground">processados</p>
                  </div>
                  <div className="text-center p-4 rounded bg-muted/30">
                    <span className="text-3xl font-light">{metricas.totalDocumentos}</span>
                    <p className="text-sm text-muted-foreground">total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* linha do tempo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">linha do tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">início</span>
                    <span>{formatarData((caso as any).criado_em, 'longa')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">duração total</span>
                    <span>
                      {Math.ceil((Date.now() - new Date((caso as any).criado_em).getTime()) / (1000 * 60 * 60 * 24))} dias
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">status</span>
                    <Badge className="bg-green-500/20 text-green-500">em dia</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {abaSelecionada === 'dossie' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">dossiê do caso</CardTitle>
                <CardDescription>
                  compilação completa de todos os documentos e registros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { titulo: 'Dados do cliente', itens: 3, tamanho: '45 KB' },
                    { titulo: 'Documentos anexos', itens: documentos.length, tamanho: `${(documentos.reduce((acc, d) => acc + (d.tamanho_arquivo || 0), 0) / 1024).toFixed(0)} KB` },
                    { titulo: 'Qualificação', itens: 1, tamanho: '12 KB' },
                    { titulo: 'Análise de caso', itens: 1, tamanho: '28 KB' },
                    { titulo: 'Grafo de evidências', itens: 23, tamanho: '156 KB' },
                    { titulo: 'Minutas e peças', itens: 1, tamanho: '89 KB' },
                    { titulo: 'Trilha de auditoria', itens: logs.length, tamanho: '34 KB' },
                    { titulo: 'Registros LGPD', itens: 1, tamanho: '18 KB' },
                  ].map((secao, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-normal">{secao.titulo}</p>
                          <p className="text-xs text-muted-foreground">{secao.itens} itens • {secao.tamanho}</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  tamanho total: ~{((documentos.reduce((acc, d) => acc + (d.tamanho_arquivo || 0), 0) / 1024 / 1024) + 0.4).toFixed(1)} MB
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportarDossie('json')}>
                    <FileJson className="h-4 w-4 mr-2" />
                    json
                  </Button>
                  <Button size="sm" onClick={() => handleExportarDossie('pdf')}>
                    <FileType className="h-4 w-4 mr-2" />
                    pdf
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="col-span-4 space-y-4">
            {/* preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">preview do dossiê</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-muted/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">prévia não disponível</p>
                    <Button variant="link" size="sm" className="mt-2">
                      gerar preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* opções */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal">opções de exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'incluir dados sensíveis', checked: false },
                  { label: 'incluir trilha de auditoria', checked: true },
                  { label: 'incluir métricas de ia', checked: true },
                  { label: 'anonimizar nomes', checked: false },
                  { label: 'incluir marcas d\'água', checked: true },
                ].map((opcao, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={opcao.checked}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{opcao.label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* ações rápidas */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button className="w-full" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  imprimir dossiê
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  compartilhar com cliente
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  arquivar caso
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <RegistroPageContent />
    </Suspense>
  )
}
