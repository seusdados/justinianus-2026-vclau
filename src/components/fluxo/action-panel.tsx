"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Playbook, PassoPlaybook, Acao, SugestaoIA, TipoPasso } from "@/types";
import {
  Play,
  Pause,
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Brain,
  FileText,
  Eye,
  Send,
  ChevronRight,
  Sparkles,
  UserCheck,
  Bell,
  Target,
  Loader2,
  XCircle,
} from "lucide-react";

// Ícones por tipo de passo
const PASSO_ICONS: Record<TipoPasso, React.ComponentType<{ className?: string }>> = {
  analise_ia: Brain,
  geracao_ia: FileText,
  revisao_humana: Eye,
  acao_humana: UserCheck,
  notificacao: Bell,
  prazo: Clock,
  ponto_decisao: Target,
  aguardar: Clock,
};

// Status do passo no playbook
type StatusPasso = "pendente" | "em_andamento" | "concluido" | "erro" | "aguardando_aprovacao";

// PlaybookRunner - Executa playbooks passo a passo
interface PlaybookRunnerProps {
  playbook: Playbook;
  passos: PassoPlaybook[];
  passoAtual?: number;
  statusPassos?: Record<string, StatusPasso>;
  onExecutarPasso?: (passoId: string) => void;
  onPular?: (passoId: string) => void;
  onPausar?: () => void;
  onContinuar?: () => void;
  isPaused?: boolean;
  isRunning?: boolean;
  className?: string;
}

export function PlaybookRunner({
  playbook,
  passos,
  passoAtual = 0,
  statusPassos = {},
  onExecutarPasso,
  onPular,
  onPausar,
  onContinuar,
  isPaused = false,
  isRunning = false,
  className,
}: PlaybookRunnerProps) {
  const passosOrdenados = [...passos].sort((a, b) => a.ordem_passo - b.ordem_passo);

  const getStatusPasso = (passo: PassoPlaybook, index: number): StatusPasso => {
    if (statusPassos[passo.id]) return statusPassos[passo.id];
    if (index < passoAtual) return "concluido";
    if (index === passoAtual) return isRunning ? "em_andamento" : "pendente";
    return "pendente";
  };

  const statusConfig = {
    pendente: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
    em_andamento: { icon: Loader2, color: "text-amber-500", bg: "bg-amber-500/10", animate: true },
    concluido: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    erro: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    aguardando_aprovacao: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            <CardTitle>{playbook.nome}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {playbook.duracao_estimada_horas && (
              <Badge variant="outline" size="sm">
                ~{playbook.duracao_estimada_horas}h
              </Badge>
            )}
            {isRunning && !isPaused && (
              <Button size="sm" variant="outline" onClick={onPausar}>
                <Pause className="h-4 w-4 mr-1" />
                pausar
              </Button>
            )}
            {isPaused && (
              <Button size="sm" onClick={onContinuar}>
                <Play className="h-4 w-4 mr-1" />
                continuar
              </Button>
            )}
          </div>
        </div>
        {playbook.descricao && (
          <p className="text-sm text-muted-foreground mt-1">{playbook.descricao}</p>
        )}
      </CardHeader>

      <CardContent>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>progresso</span>
            <span>
              {passoAtual} de {passosOrdenados.length} passos
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(passoAtual / passosOrdenados.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Lista de passos */}
        <div className="space-y-3">
          {passosOrdenados.map((passo, index) => {
            const status = getStatusPasso(passo, index);
            const config = statusConfig[status];
            const PassoIcon = PASSO_ICONS[passo.tipo_passo];
            const StatusIcon = config.icon;
            const isCurrent = index === passoAtual;

            return (
              <div
                key={passo.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  isCurrent ? "border-primary bg-primary/5" : "border-border",
                  status === "concluido" && "opacity-60"
                )}
              >
                {/* Status indicator */}
                <div className={cn("p-2 rounded-lg", config.bg)}>
                  <StatusIcon
                    className={cn(
                      "h-4 w-4",
                      config.color,
                      (config as any).animate && "animate-spin"
                    )}
                  />
                </div>

                {/* Conteúdo do passo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <PassoIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium lowercase">{passo.titulo}</span>
                    {passo.requer_aprovacao && (
                      <Badge variant="warning" size="sm">
                        aprovação
                      </Badge>
                    )}
                  </div>
                  {passo.descricao && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {passo.descricao}
                    </p>
                  )}
                </div>

                {/* Ações */}
                {isCurrent && status === "pendente" && !isRunning && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onExecutarPasso?.(passo.id)}
                    >
                      executar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPular?.(passo.id)}
                    >
                      pular
                    </Button>
                  </div>
                )}

                {status === "aguardando_aprovacao" && (
                  <Button size="sm" variant="outline">
                    aprovar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ActionDock - Dock de ações sugeridas (máx 3)
interface ActionDockProps {
  sugestoes: SugestaoIA[];
  onAceitar?: (sugestaoId: string) => void;
  onRejeitar?: (sugestaoId: string) => void;
  onVerDetalhes?: (sugestaoId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ActionDock({
  sugestoes,
  onAceitar,
  onRejeitar,
  onVerDetalhes,
  isLoading = false,
  className,
}: ActionDockProps) {
  // Limita a 3 sugestões
  const sugestoesVisiveis = sugestoes.slice(0, 3);

  if (sugestoesVisiveis.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium lowercase">ações sugeridas pela ia</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sugestoesVisiveis.map((sugestao) => (
          <ActionSuggestionCard
            key={sugestao.id}
            sugestao={sugestao}
            onAceitar={() => onAceitar?.(sugestao.id)}
            onRejeitar={() => onRejeitar?.(sugestao.id)}
            onVerDetalhes={() => onVerDetalhes?.(sugestao.id)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

// Card de sugestão de ação individual
interface ActionSuggestionCardProps {
  sugestao: SugestaoIA;
  onAceitar?: () => void;
  onRejeitar?: () => void;
  onVerDetalhes?: () => void;
  isLoading?: boolean;
}

export function ActionSuggestionCard({
  sugestao,
  onAceitar,
  onRejeitar,
  onVerDetalhes,
  isLoading = false,
}: ActionSuggestionCardProps) {
  const tipoConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    minuta: { icon: FileText, color: "text-blue-500" },
    acao: { icon: Target, color: "text-amber-500" },
    alerta: { icon: AlertTriangle, color: "text-red-500" },
    notificacao: { icon: Bell, color: "text-violet-500" },
    default: { icon: Sparkles, color: "text-primary" },
  };

  const config = tipoConfig[sugestao.tipo_sugestao] || tipoConfig.default;
  const Icon = config.icon;

  return (
    <Card variant="outline" className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg bg-primary/10", config.color)}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground normal-case line-clamp-1">
              {sugestao.titulo}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {sugestao.resumo}
            </p>

            {/* Métricas */}
            <div className="flex items-center gap-3 mt-2">
              {sugestao.confianca && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">conf:</span>
                  <span className="text-xs font-medium">
                    {Math.round(sugestao.confianca * 100)}%
                  </span>
                </div>
              )}
              {sugestao.pontuacao_risco && sugestao.pontuacao_risco > 0.5 && (
                <Badge variant="warning" size="sm">
                  risco
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Razão (explicabilidade) */}
        {sugestao.razao && (
          <div className="mt-3 p-2 rounded bg-muted/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">por quê:</span> {sugestao.razao}
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            className="flex-1"
            onClick={onAceitar}
            disabled={isLoading}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            aceitar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onVerDetalhes}
            disabled={isLoading}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRejeitar}
            disabled={isLoading}
            className="text-muted-foreground hover:text-red-500"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// DraftPreview - Prévia de minuta com diff
interface DraftPreviewProps {
  titulo: string;
  conteudo: string;
  conteudoOriginal?: string;
  onAceitar?: () => void;
  onEditar?: () => void;
  onRejeitar?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function DraftPreview({
  titulo,
  conteudo,
  conteudoOriginal,
  onAceitar,
  onEditar,
  onRejeitar,
  isLoading = false,
  className,
}: DraftPreviewProps) {
  const [showDiff, setShowDiff] = React.useState(false);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>{titulo}</CardTitle>
            <Badge variant="info" size="sm" className="gap-1">
              <Sparkles className="h-3 w-3" />
              gerado por ia
            </Badge>
          </div>
          {conteudoOriginal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? "ocultar diff" : "mostrar diff"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Preview do conteúdo */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-96 overflow-y-auto">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
            {conteudo}
          </pre>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
          <Button onClick={onAceitar} disabled={isLoading} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            aceitar minuta
          </Button>
          <Button variant="outline" onClick={onEditar} disabled={isLoading}>
            editar
          </Button>
          <Button
            variant="ghost"
            onClick={onRejeitar}
            disabled={isLoading}
            className="text-muted-foreground hover:text-red-500"
          >
            descartar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Lista de ações pendentes
interface PendingActionsListProps {
  acoes: Acao[];
  onAprovar?: (acaoId: string) => void;
  onRejeitar?: (acaoId: string) => void;
  className?: string;
}

export function PendingActionsList({
  acoes,
  onAprovar,
  onRejeitar,
  className,
}: PendingActionsListProps) {
  const acoesPendentes = acoes.filter(
    (a) => a.status === "proposta" || a.status === "em_aprovacao"
  );

  if (acoesPendentes.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <CardTitle>ações pendentes de aprovação</CardTitle>
          <Badge variant="warning" size="sm">
            {acoesPendentes.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {acoesPendentes.map((acao) => (
            <div
              key={acao.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground lowercase">
                  {acao.tipo_acao}
                </p>
                <p className="text-xs text-muted-foreground">
                  {acao.origem === "sugerida_por_ia" && "sugerida pela ia • "}
                  aguardando aprovação
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onAprovar?.(acao.id)}
                >
                  aprovar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRejeitar?.(acao.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
