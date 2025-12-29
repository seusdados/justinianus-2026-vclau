'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  ArrowRight,
  FileText,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge, RiscoBadge, StatusLeadBadge, UrgenciaBadge } from '@/components/ui/badge'
import { 
  RiskTrafficLight, 
  QualificationPanel, 
  ReasonChip 
} from '@/components/fluxo/qualification-panel'
import { useLeads, useQualificacoes, useDocumentos } from '@/hooks'
import type { Lead, QualificacaoLead, Documento } from '@/types'
import { formatarData, calcularDiasRestantes } from '@/lib/utils'

function QualificacaoPageContent() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('lead')
  
  const [expandirDocumentos, setExpandirDocumentos] = useState(false)
  const [processando, setProcessando] = useState(false)

  // hooks de dados
  const { leads, loading: loadingLeads, refetch: refetchLeads } = useLeads()
  const { qualificacoes, loading: loadingQual, buscarQualificacaoPorLead, decidirLead } = useQualificacoes()
  const { documentos, loading: loadingDocs, refetch: refetchDocumentos } = useDocumentos()

  // buscar qualificação quando temos lead
  useEffect(() => {
    if (leadId) {
      buscarQualificacaoPorLead(leadId)
    }
  }, [buscarQualificacaoPorLead, leadId])

  // encontrar o lead atual
  const lead = leads.find(l => l.id === leadId) || leads[0]
  const qualificacao = qualificacoes.find(q => q.lead_id === lead?.id)
  const docsDoLead = documentos.filter(d => d.lead_id === lead?.id)

  // leads em análise para navegação
  const leadsEmAnalise = leads.filter(l => l.status === 'em_analise')
  const indexAtual = leadsEmAnalise.findIndex(l => l.id === lead?.id)

  const loading = loadingLeads || loadingQual || loadingDocs

  // se não há lead, mostrar estado vazio
  if (!loading && !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-normal">lead não encontrado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          o lead solicitado não foi encontrado ou você não tem permissão para acessá-lo.
        </p>
        <Button onClick={() => window.location.href = '/captacao'}>
          voltar para captação
        </Button>
      </div>
    )
  }

  // loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">carregando qualificação...</p>
      </div>
    )
  }

  const diasParaPrescricao = qualificacao?.data_prescricao 
    ? calcularDiasRestantes(qualificacao.data_prescricao)
    : null

  const handleAceitar = async () => {
    if (!lead) return
    setProcessando(true)
    try {
      await decidirLead(lead.id, 'aceito')
      window.location.href = '/analise?caso=novo'
    } catch (error) {
      console.error('Erro ao aceitar lead:', error)
      setProcessando(false)
    }
  }

  const handleRecusar = async (motivo: string) => {
    if (!lead) return
    setProcessando(true)
    try {
      await decidirLead(lead.id, 'recusado', motivo)
      window.location.href = '/captacao'
    } catch (error) {
      console.error('Erro ao recusar lead:', error)
      setProcessando(false)
    }
  }

  const handleManterAnalise = async () => {
    setProcessando(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setProcessando(false)
  }

  const navegarPara = (direcao: 'anterior' | 'proximo') => {
    const novoIndex = direcao === 'anterior' ? indexAtual - 1 : indexAtual + 1
    if (novoIndex >= 0 && novoIndex < leadsEmAnalise.length) {
      window.location.href = `/qualificacao?lead=${leadsEmAnalise[novoIndex].id}`
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            voltar
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Badge variant="secondary">lead #{lead.id.slice(0, 8)}</Badge>
            <StatusLeadBadge status={lead.status} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          criado {formatarData(lead.criado_em, 'relativa')}
        </div>
      </div>

      {/* grid principal */}
      <div className="grid grid-cols-12 gap-6">
        {/* coluna esquerda - dados do lead */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* card do cliente */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {lead.tipo_cliente === 'pessoa_fisica' ? (
                    <User className="h-6 w-6 text-primary" />
                  ) : (
                    <Building2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg font-normal">{lead.nome}</CardTitle>
                  <CardDescription>{lead.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">tipo</span>
                  <p className="font-normal">
                    {lead.tipo_cliente === 'pessoa_fisica' ? 'pessoa física' : 'pessoa jurídica'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">telefone</span>
                  <p className="font-normal">{lead.telefone || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">serviço</span>
                  <p className="font-normal">{lead.tipo_servico}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">urgência</span>
                  <UrgenciaBadge nivel={lead.nivel_urgencia} />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground text-sm">descrição inicial</span>
                <p className="text-sm mt-1 leading-relaxed">
                  {lead.descricao_inicial}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* documentos */}
          <Card>
            <CardHeader 
              className="cursor-pointer pb-3"
              onClick={() => setExpandirDocumentos(!expandirDocumentos)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base font-normal">
                    documentos ({docsDoLead.length})
                  </CardTitle>
                </div>
                {expandirDocumentos ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandirDocumentos && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {docsDoLead.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      nenhum documento anexado
                    </p>
                  ) : (
                    docsDoLead.map(doc => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-normal">{doc.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.ocr_processado ? (
                                <span className="text-green-500">✓ processado</span>
                              ) : (
                                <span className="text-amber-500">⏳ aguardando OCR</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* alerta de prescrição */}
          {diasParaPrescricao && diasParaPrescricao < 180 && (
            <Card variant="outline" className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-normal text-amber-500">atenção ao prazo</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      prescrição em {diasParaPrescricao} dias 
                      ({formatarData(qualificacao!.data_prescricao!, 'curta')})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* coluna direita - qualificação IA */}
        <div className="col-span-8">
          {qualificacao ? (
            <QualificationPanel
              lead={lead as any}
              qualificacao={qualificacao}
              onAceitar={handleAceitar}
              onRecusar={handleRecusar}
              onManter={handleManterAnalise}
              isLoading={processando}
            />
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-normal">qualificação pendente</h3>
                <p className="text-muted-foreground max-w-md">
                  a qualificação automática deste lead ainda não foi gerada. 
                  aguarde o processamento ou solicite manualmente.
                </p>
                <Button variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  gerar qualificação
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* navegação entre leads */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={indexAtual <= 0}
          onClick={() => navegarPara('anterior')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          lead anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          {leadsEmAnalise.length > 0 
            ? `${indexAtual + 1} de ${leadsEmAnalise.length} leads em análise`
            : 'nenhum lead em análise'
          }
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          disabled={indexAtual >= leadsEmAnalise.length - 1}
          onClick={() => navegarPara('proximo')}
        >
          próximo lead
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

export default function QualificacaoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <QualificacaoPageContent />
    </Suspense>
  )
}
