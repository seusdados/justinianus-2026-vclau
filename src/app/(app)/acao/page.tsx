'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  ArrowRight,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Send,
  Download,
  Target,
  FilePlus,
  Calendar,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, FaseBadge } from '@/components/ui/badge'
import { 
  ActionDock, 
  ActionSuggestionCard,
  DraftPreview,
  PendingActionsList 
} from '@/components/fluxo/action-panel'
import { TarefaForm } from '@/components/formularios/tarefa-form'
import { 
  useCaso, 
  useAcoes, 
  useSugestoesIA,
  useOportunidadesAtivas,
  useTarefas
} from '@/hooks'
import type { TarefaCaso } from '@/types'
import { formatarData, formatarMoeda } from '@/lib/utils'

function AcaoPageContent() {
  const searchParams = useSearchParams()
  const casoIdParam = searchParams.get('caso')
  const casoId = casoIdParam ? parseInt(casoIdParam) : 1
  
  const [abaSelecionada, setAbaSelecionada] = useState<'sugestoes' | 'minuta' | 'pendentes' | 'oportunidades'>('sugestoes')
  const [minutaEditando, setMinutaEditando] = useState(false)
  const [showNovaTarefa, setShowNovaTarefa] = useState(false)
  
  // Hooks de dados
  const { caso, loading: loadingCaso, refetch: refetchCaso } = useCaso(casoId)
  
  const { 
    acoes,
    loading: loadingAcoes,
    refetch: refetchAcoes,
    aprovar,
    rejeitar
  } = useAcoes({ tipoEntidade: 'caso', idEntidade: casoId.toString() })
  
  const { 
    sugestoes,
    loading: loadingSugestoes,
    refetch: refetchSugestoes,
    aceitar: aceitarSugestao,
    rejeitar: rejeitarSugestaoFn
  } = useSugestoesIA({})
  
  const {
    oportunidades,
    loading: loadingOportunidades,
    refetch: refetchOportunidades,
    marcarAcionada,
    descartar
  } = useOportunidadesAtivas(casoId)
  
  const {
    criar: criarTarefa,
    refetch: refetchTarefas
  } = useTarefas({ casoId })

  // Filtrar dados
  const acoesPendentes = acoes.filter(a => 
    a.status === 'em_aprovacao' || a.status === 'proposta'
  )
  const sugestoesPendentes = sugestoes.filter(s => s.status === 'pendente')
  const oportunidadesAtivas = oportunidades.filter(o => !o.expirado && !o.acao_tomada)

  // Encontrar minuta gerada (se houver)
  const minutaSugestao = sugestoes.find(s => s.tipo_sugestao === 'minuta' && s.status === 'pendente')
  const casoDados = caso as any
  const conteudoMinuta = (minutaSugestao?.estruturado as any)?.conteudo || `
EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DO TRABALHO DA ___ VARA DO TRABALHO DE SÃO PAULO - SP

${casoDados?.titulo || 'RECLAMANTE vs. RECLAMADA'}

RECLAMANTE: [Nome do Cliente]
CPF: [CPF]
Endereço: [Endereço completo]

RECLAMADA: [Nome da Empresa]
CNPJ: [CNPJ]
Endereço: [Endereço completo]

I - DOS FATOS

[Narrativa dos fatos baseada no grafo de evidências]

II - DO DIREITO

[Fundamentação jurídica com citações legais]

III - DOS PEDIDOS

Ante o exposto, requer:

a) Verbas rescisórias não pagas;
b) Horas extras com adicional de 50%;
c) Danos morais no valor de R$ [valor];
d) Honorários advocatícios de 15%;
e) Justiça gratuita.

Dá-se à causa o valor de R$ ${casoDados?.valor_causa ? formatarMoeda(casoDados?.valor_causa) : '150.000,00'}.

Termos em que,
Pede deferimento.

São Paulo, ${formatarData(new Date(), 'longa')}

_______________________________
[Nome do Advogado]
OAB/SP [Número]
`

  // Handlers
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchCaso(),
      refetchAcoes(),
      refetchSugestoes(),
      refetchOportunidades()
    ])
  }, [refetchCaso, refetchAcoes, refetchSugestoes, refetchOportunidades])

  const handleAceitarSugestao = async (id: string) => {
    await aceitarSugestao(id)
    await refetchSugestoes()
  }

  const handleRejeitarSugestao = async (id: string, motivo?: string) => {
    await rejeitarSugestaoFn(id, motivo)
    await refetchSugestoes()
  }

  const handleAprovarAcao = async (id: string) => {
    await aprovar(id)
    await refetchAcoes()
  }

  const handleRejeitarAcao = async (id: string, motivo?: string) => {
    await rejeitar(id, motivo || 'Rejeitado pelo usuário')
    await refetchAcoes()
  }

  const handleAceitarOportunidade = async (id: string) => {
    await marcarAcionada(id)
    await refetchOportunidades()
  }

  const handleDescartarOportunidade = async (id: string, motivo?: string) => {
    await descartar(id)
    await refetchOportunidades()
  }

  const handleCriarTarefa = async (dados: Partial<TarefaCaso>) => {
    await criarTarefa({ ...dados, caso_id: casoId } as any)
    setShowNovaTarefa(false)
    await refetchTarefas()
  }

  const loading = loadingCaso || loadingAcoes || loadingSugestoes || loadingOportunidades

  // Loading state
  if (loading && !caso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">carregando ações...</p>
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
            <Badge variant="secondary">{casoDados.numero_interno || `CASO-${casoDados.id}`}</Badge>
            <FaseBadge fase="acao" />
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
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            gerar sugestões
          </Button>
          <Button size="sm" onClick={() => window.location.href = `/registro?caso=${casoId}`}>
            <ArrowRight className="h-4 w-4 mr-2" />
            avançar para registro
          </Button>
        </div>
      </div>

      {/* modal nova tarefa */}
      {showNovaTarefa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-normal">nova tarefa</h2>
              <button
                onClick={() => setShowNovaTarefa(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <TarefaForm
                casoId={casoId}
                onSucesso={handleCriarTarefa}
                onCancelar={() => setShowNovaTarefa(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* resumo do caso */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-normal">{casoDados.titulo}</h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {casoDados.tribunal && <span>{casoDados.tribunal}</span>}
                {casoDados?.valor_causa && <span>{formatarMoeda(casoDados?.valor_causa)}</span>}
                <span>{formatarData(casoDados.aberto_em, 'relativa')}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-light">{sugestoesPendentes.length}</div>
                <div className="text-xs text-muted-foreground">sugestões</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light">{acoesPendentes.length}</div>
                <div className="text-xs text-muted-foreground">pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-amber-500">{oportunidadesAtivas.length}</div>
                <div className="text-xs text-muted-foreground">oportunidades</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* abas */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setAbaSelecionada('sugestoes')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'sugestoes' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          sugestões ia
          {sugestoesPendentes.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
              {sugestoesPendentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAbaSelecionada('oportunidades')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'oportunidades' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="h-4 w-4" />
          oportunidades
          {oportunidadesAtivas.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded">
              {oportunidadesAtivas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAbaSelecionada('minuta')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'minuta' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          minuta
        </button>
        <button
          onClick={() => setAbaSelecionada('pendentes')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            abaSelecionada === 'pendentes' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          pendentes
          {acoesPendentes.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded">
              {acoesPendentes.length}
            </span>
          )}
        </button>
      </div>

      {/* conteúdo */}
      {abaSelecionada === 'sugestoes' && (
        <div className="space-y-4">
          {sugestoesPendentes.length > 0 && (
            <ActionDock
              sugestoes={sugestoesPendentes.slice(0, 3) as any}
              onAceitar={handleAceitarSugestao}
              onRejeitar={handleRejeitarSugestao}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-normal">todas as sugestões</CardTitle>
              <CardDescription>sugestões geradas pela ia para este caso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sugestoes.length > 0 ? (
                sugestoes.map(sugestao => (
                  <ActionSuggestionCard
                    key={sugestao.id}
                    sugestao={sugestao as any}
                    onAceitar={() => handleAceitarSugestao(sugestao.id)}
                    onRejeitar={() => handleRejeitarSugestao(sugestao.id)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-normal mb-2">nenhuma sugestão</h3>
                  <p className="text-sm text-muted-foreground">
                    clique em "gerar sugestões" para a ia analisar o caso
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {abaSelecionada === 'oportunidades' && (
        <div className="space-y-4">
          {oportunidadesAtivas.length > 0 ? (
            oportunidadesAtivas.map(oportunidade => (
              <Card key={oportunidade.id} className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-amber-500/20 text-amber-500">
                          {oportunidade.tipo_sinal}
                        </Badge>
                        <Badge variant="outline">{oportunidade.impacto_potencial}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {oportunidade.expira_em ? `expira em ${formatarData(oportunidade.expira_em, 'relativa')}` : 'sem expiração'}
                        </span>
                      </div>
                      <h3 className="font-normal mb-1">{oportunidade.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{oportunidade.descricao}</p>
                      {oportunidade.acao_recomendada && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <span className="text-xs text-muted-foreground">ação sugerida:</span>
                          <p className="text-sm mt-1">{oportunidade.acao_recomendada}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-center px-3 py-2 bg-muted/30 rounded-lg">
                      <div className="text-lg font-light">
                        {Math.round((oportunidade.confianca || 0) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">confiança</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDescartarOportunidade(oportunidade.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      descartar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleAceitarOportunidade(oportunidade.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      aceitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-normal mb-2">nenhuma oportunidade</h3>
                <p className="text-sm text-muted-foreground">
                  o sistema está monitorando sinais de timing para este caso
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {abaSelecionada === 'minuta' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <DraftPreview
              titulo="Petição Inicial - Reclamação Trabalhista"
              conteudo={conteudoMinuta}
              onEditar={() => setMinutaEditando(true)}
              onAceitar={() => minutaSugestao && handleAceitarSugestao(minutaSugestao.id)}
              onRejeitar={() => minutaSugestao && handleRejeitarSugestao(minutaSugestao.id)}
            />
          </div>

          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal">métricas da minuta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">confiança ia</span>
                    <span>{Math.round((minutaSugestao?.confianca || 0.89) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(minutaSugestao?.confianca || 0.89) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">fundamentação</span>
                    <span>{Math.round((minutaSugestao?.pontuacao_fundamentacao || 0.92) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(minutaSugestao?.pontuacao_fundamentacao || 0.92) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">acionabilidade</span>
                    <span>{Math.round((minutaSugestao?.pontuacao_acionabilidade || 0.95) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(minutaSugestao?.pontuacao_acionabilidade || 0.95) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal">checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'qualificação das partes', ok: true },
                  { label: 'fatos narrados', ok: true },
                  { label: 'fundamentação jurídica', ok: true },
                  { label: 'pedidos específicos', ok: true },
                  { label: 'valor da causa', ok: !!casoDados?.valor_causa },
                  { label: 'documentos anexos', ok: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {item.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={item.ok ? 'text-foreground' : 'text-amber-500'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <Button className="w-full" size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  aprovar e protocolar
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  exportar .docx
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  enviar para revisão
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {abaSelecionada === 'pendentes' && (
        <PendingActionsList
          acoes={acoesPendentes as any}
          onAprovar={handleAprovarAcao}
          onRejeitar={handleRejeitarAcao}
        />
      )}

      {/* footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNovaTarefa(true)}>
            <FilePlus className="h-4 w-4 mr-2" />
            nova tarefa
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            agendar prazo
          </Button>
        </div>
        
        <Button size="sm" onClick={() => window.location.href = `/registro?caso=${casoId}`}>
          avançar para registro
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

export default function AcaoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AcaoPageContent />
    </Suspense>
  )
}
