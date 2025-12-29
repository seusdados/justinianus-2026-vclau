"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, RiscoBadge, UrgenciaBadge, StatusLeadBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Lead, Documento } from "@/types";
import {
  Mail,
  Upload,
  Globe,
  User,
  FileText,
  Clock,
  ArrowRight,
  MoreVertical,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatarData } from "@/lib/utils";

// Ícone de origem
const ORIGEM_ICONS = {
  email: Mail,
  upload: Upload,
  api: Globe,
  manual: User,
  formulario: FileText,
  indicacao: User,
};

interface InboxCardProps {
  lead: Lead;
  onClick?: () => void;
  onQualificar?: () => void;
  isProcessing?: boolean;
  className?: string;
}

export function InboxCard({
  lead,
  onClick,
  onQualificar,
  isProcessing = false,
  className,
}: InboxCardProps) {
  const OrigemIcon = lead.origem ? ORIGEM_ICONS[lead.origem] || FileText : FileText;
  const isNovo = lead.status === "novo";
  const temDocumentos = lead.documentos && lead.documentos.length > 0;

  return (
    <Card
      variant={isNovo ? "elevated" : "default"}
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:border-primary/30",
        isProcessing && "animate-pulse",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Indicador de origem */}
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isNovo ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
              )}
            >
              <OrigemIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground truncate normal-case">
                  {lead.nome}
                </h4>
                {isNovo && (
                  <Badge variant="info" size="sm">
                    novo
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {lead.email || lead.telefone || "sem contato"}
              </p>
            </div>
          </div>

          {/* Menu de ações */}
          <button className="shrink-0 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Descrição inicial */}
        {lead.descricao_inicial && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {lead.descricao_inicial}
          </p>
        )}

        {/* Badges de classificação */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusLeadBadge status={lead.status} />
          <Badge variant="outline" size="sm">
            {lead.tipo_servico}
          </Badge>
          <UrgenciaBadge nivel={lead.nivel_urgencia} />
        </div>

        {/* Indicador de qualificação IA */}
        {lead.qualificacao && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">
                  qualificação ia
                </span>
                {lead.qualificacao.nivel_risco && (
                  <RiscoBadge nivel={lead.qualificacao.nivel_risco} />
                )}
              </div>
              {lead.qualificacao.confianca_ia && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-1 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${lead.qualificacao.confianca_ia * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(lead.qualificacao.confianca_ia * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer com meta info e ações */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatarData(lead.criado_em, "relativa")}
            </span>
            {temDocumentos && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {lead.documentos?.length} doc{(lead.documentos?.length || 0) > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Ação principal */}
          {lead.status === "novo" && onQualificar && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onQualificar();
              }}
              className="gap-1"
            >
              qualificar
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Card para documento na inbox
interface DocumentoInboxCardProps {
  documento: Documento;
  onClick?: () => void;
  className?: string;
}

export function DocumentoInboxCard({
  documento,
  onClick,
  className,
}: DocumentoInboxCardProps) {
  const getStatusIcon = () => {
    if (documento.ocr_processado) return CheckCircle;
    return Clock;
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card
      variant="outline"
      className={cn(
        "cursor-pointer transition-all duration-200 hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate normal-case text-sm">
              {documento.titulo}
            </h4>
            <p className="text-xs text-muted-foreground">
              {documento.tipo_documento || documento.tipo_mime}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {documento.resumo_ia && (
              <span title="Resumo IA disponível">
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
            )}
            <StatusIcon
              className={cn(
                "h-4 w-4",
                documento.ocr_processado ? "text-green-500" : "text-muted-foreground"
              )}
            />
          </div>
        </div>

        {documento.resumo_ia && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 pl-13">
            {documento.resumo_ia}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Card para estatísticas da inbox
interface InboxStatsProps {
  novos: number;
  emAnalise: number;
  qualificados: number;
  urgentes: number;
  className?: string;
}

export function InboxStats({
  novos,
  emAnalise,
  qualificados,
  urgentes,
  className,
}: InboxStatsProps) {
  const stats = [
    { label: "novos", value: novos, color: "text-blue-500" },
    { label: "em análise", value: emAnalise, color: "text-amber-500" },
    { label: "qualificados", value: qualificados, color: "text-green-500" },
    { label: "urgentes", value: urgentes, color: "text-red-500" },
  ];

  return (
    <div className={cn("grid grid-cols-4 gap-4", className)}>
      {stats.map((stat) => (
        <Card key={stat.label} variant="outline" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground lowercase">{stat.label}</span>
            {stat.label === "urgentes" && stat.value > 0 && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className={cn("text-2xl font-medium mt-1", stat.color)}>{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
