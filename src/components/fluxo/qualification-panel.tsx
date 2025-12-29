"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, RiscoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Lead, QualificacaoLead, NivelRisco } from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  Calendar,
  Scale,
  ChevronRight,
  Info,
  Brain,
  Shield,
  Lightbulb,
} from "lucide-react";
import { formatarData, calcularDiasRestantes } from "@/lib/utils";

// Semáforo de Risco
interface RiskTrafficLightProps {
  nivel: NivelRisco;
  motivo?: string;
  confianca?: number;
  className?: string;
  showDetails?: boolean;
}

export function RiskTrafficLight({
  nivel,
  motivo,
  confianca,
  className,
  showDetails = true,
}: RiskTrafficLightProps) {
  const config = {
    baixo: {
      color: "bg-green-500",
      glow: "shadow-green-500/50",
      label: "risco baixo",
      description: "caso com boas chances de sucesso",
    },
    medio: {
      color: "bg-amber-500",
      glow: "shadow-amber-500/50",
      label: "risco médio",
      description: "atenção a alguns pontos",
    },
    alto: {
      color: "bg-red-500",
      glow: "shadow-red-500/50",
      label: "risco alto",
      description: "requer análise cuidadosa",
    },
    critico: {
      color: "bg-red-600",
      glow: "shadow-red-600/50",
      label: "risco crítico",
      description: "decisão urgente necessária",
    },
  };

  const { color, glow, label, description } = config[nivel];
  const lights = ["baixo", "medio", "alto"] as const;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Semáforo visual */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/50 border border-border">
        {lights.map((light) => {
          const isActive = 
            (light === "baixo" && nivel === "baixo") ||
            (light === "medio" && nivel === "medio") ||
            (light === "alto" && (nivel === "alto" || nivel === "critico"));

          const lightColor = {
            baixo: "bg-green-500",
            medio: "bg-amber-500",
            alto: "bg-red-500",
          }[light];

          return (
            <div
              key={light}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300",
                isActive
                  ? cn(lightColor, "shadow-lg", `shadow-${light === "baixo" ? "green" : light === "medio" ? "amber" : "red"}-500/50`)
                  : "bg-muted"
              )}
            />
          );
        })}
      </div>

      {/* Informações */}
      {showDetails && (
        <div className="text-center space-y-1">
          <p className="text-sm font-medium lowercase">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {confianca && (
            <p className="text-xs text-muted-foreground">
              confiança ia: {Math.round(confianca * 100)}%
            </p>
          )}
        </div>
      )}

      {/* Motivo com tooltip */}
      {motivo && (
        <div className="group relative">
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Info className="h-3 w-3" />
            <span>ver motivo</span>
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10">
            <p className="text-xs text-foreground">{motivo}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Chip de Motivo (para explicabilidade)
interface ReasonChipProps {
  tipo: "positivo" | "negativo" | "neutro" | "alerta";
  texto: string;
  detalhes?: string;
  className?: string;
}

export function ReasonChip({ tipo, texto, detalhes, className }: ReasonChipProps) {
  const config = {
    positivo: { icon: CheckCircle, color: "bg-green-500/10 text-green-500 border-green-500/20" },
    negativo: { icon: XCircle, color: "bg-red-500/10 text-red-500 border-red-500/20" },
    neutro: { icon: Info, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    alerta: { icon: AlertTriangle, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  };

  const { icon: Icon, color } = config[tipo];

  return (
    <div className={cn("group relative inline-flex", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-default",
          color
        )}
      >
        <Icon className="h-3 w-3" />
        <span>{texto}</span>
      </div>

      {detalhes && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10">
          <p className="text-xs text-foreground">{detalhes}</p>
        </div>
      )}
    </div>
  );
}

// Painel de Qualificação completo
interface QualificationPanelProps {
  lead: Lead;
  qualificacao: QualificacaoLead;
  onAceitar?: () => void;
  onRecusar?: (motivo: string) => void;
  onManter?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function QualificationPanel({
  lead,
  qualificacao,
  onAceitar,
  onRecusar,
  onManter,
  isLoading = false,
  className,
}: QualificationPanelProps) {
  const diasParaPrescricao = qualificacao.data_prescricao
    ? calcularDiasRestantes(qualificacao.data_prescricao)
    : null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header com semáforo */}
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Semáforo */}
            {qualificacao.nivel_risco && (
              <RiskTrafficLight
                nivel={qualificacao.nivel_risco}
                confianca={qualificacao.confianca_ia}
              />
            )}

            {/* Informações principais */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground normal-case">
                  {lead.nome}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lead.tipo_servico} • {lead.tipo_cliente === "pessoa_fisica" ? "pessoa física" : "pessoa jurídica"}
                </p>
              </div>

              {/* Classificação */}
              {qualificacao.classificacao && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">classificação</p>
                  <Badge variant="default">{qualificacao.classificacao}</Badge>
                </div>
              )}

              {/* Áreas jurídicas */}
              {qualificacao.area_juridica && qualificacao.area_juridica.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">áreas jurídicas</p>
                  <div className="flex flex-wrap gap-1">
                    {qualificacao.area_juridica.map((area) => (
                      <Badge key={area} variant="outline" size="sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Alerta de prescrição */}
            {diasParaPrescricao !== null && diasParaPrescricao <= 30 && (
              <div className="shrink-0 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">prescrição próxima</span>
                </div>
                <p className="mt-1 text-2xl font-medium text-red-500">
                  {diasParaPrescricao} dias
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo IA */}
      {qualificacao.resumo_executivo && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">resumo executivo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {qualificacao.resumo_executivo}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fatos Principais */}
      {qualificacao.fatos_principais && qualificacao.fatos_principais.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">fatos principais</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qualificacao.fatos_principais.map((fato, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    {typeof fato === "string" ? fato : JSON.stringify(fato)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Estratégia Recomendada */}
      {qualificacao.estrategia_recomendada && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm">estratégia recomendada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {qualificacao.estrategia_recomendada}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Métricas de qualidade IA */}
      <Card variant="outline">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">métricas de qualidade ia</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {qualificacao.confianca_ia && (
              <div>
                <p className="text-xs text-muted-foreground">confiança</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${qualificacao.confianca_ia * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {Math.round(qualificacao.confianca_ia * 100)}%
                  </span>
                </div>
              </div>
            )}
            {qualificacao.pontuacao_fundamentacao && (
              <div>
                <p className="text-xs text-muted-foreground">fundamentação</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${qualificacao.pontuacao_fundamentacao * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {Math.round(qualificacao.pontuacao_fundamentacao * 100)}%
                  </span>
                </div>
              </div>
            )}
            {qualificacao.pontuacao_consistencia && (
              <div>
                <p className="text-xs text-muted-foreground">consistência</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${qualificacao.pontuacao_consistencia * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {Math.round(qualificacao.pontuacao_consistencia * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {qualificacao.decisao === "pendente" && (
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Button
            onClick={onAceitar}
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            aceitar e criar caso
          </Button>
          <Button
            variant="outline"
            onClick={onManter}
            disabled={isLoading}
          >
            manter em análise
          </Button>
          <Button
            variant="ghost"
            onClick={() => onRecusar?.("motivo não especificado")}
            disabled={isLoading}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Card resumido de qualificação para lista
interface QualificationCardProps {
  lead: Lead;
  onClick?: () => void;
  className?: string;
}

export function QualificationCard({ lead, onClick, className }: QualificationCardProps) {
  const qualificacao = lead.qualificacao;

  return (
    <Card
      variant="default"
      className={cn(
        "cursor-pointer transition-all duration-200 hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Mini semáforo */}
          {qualificacao?.nivel_risco && (
            <RiskTrafficLight
              nivel={qualificacao.nivel_risco}
              showDetails={false}
            />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate normal-case">
              {lead.nome}
            </h4>
            <p className="text-sm text-muted-foreground truncate">
              {qualificacao?.classificacao || lead.tipo_servico}
            </p>
            {qualificacao?.resumo_executivo && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {qualificacao.resumo_executivo}
              </p>
            )}
          </div>

          {/* Confiança */}
          {qualificacao?.confianca_ia && (
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">confiança</p>
              <p className="text-lg font-medium text-primary">
                {Math.round(qualificacao.confianca_ia * 100)}%
              </p>
            </div>
          )}

          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
