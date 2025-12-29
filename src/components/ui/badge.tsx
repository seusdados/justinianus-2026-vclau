"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "sm", ...props }, ref) => {
    const variants = {
      default: "bg-primary/10 text-primary border-primary/20",
      secondary: "bg-secondary text-secondary-foreground border-transparent",
      outline: "bg-transparent border-border text-foreground",
      success: "bg-green-500/10 text-green-500 border-green-500/20",
      warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      danger: "bg-red-500/10 text-red-500 border-red-500/20",
      info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-medium transition-colors",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

// Badge de Risco com semáforo
interface RiscoBadgeProps {
  nivel: "baixo" | "medio" | "alto" | "critico";
  showLabel?: boolean;
  className?: string;
}

export function RiscoBadge({ nivel, showLabel = true, className }: RiscoBadgeProps) {
  const config = {
    baixo: { variant: "success" as const, label: "baixo", dot: "bg-green-500" },
    medio: { variant: "warning" as const, label: "médio", dot: "bg-amber-500" },
    alto: { variant: "danger" as const, label: "alto", dot: "bg-red-500" },
    critico: { variant: "danger" as const, label: "crítico", dot: "bg-red-600" },
  };

  const { variant, label, dot } = config[nivel];

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {showLabel && <span className="lowercase">{label}</span>}
    </Badge>
  );
}

// Badge de Status do Lead
interface StatusLeadBadgeProps {
  status: "novo" | "em_analise" | "qualificado" | "recusado" | "convertido";
  className?: string;
}

export function StatusLeadBadge({ status, className }: StatusLeadBadgeProps) {
  const config = {
    novo: { variant: "info" as const, label: "novo" },
    em_analise: { variant: "warning" as const, label: "em análise" },
    qualificado: { variant: "success" as const, label: "qualificado" },
    recusado: { variant: "danger" as const, label: "recusado" },
    convertido: { variant: "default" as const, label: "convertido" },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

// Badge de Fase
interface FaseBadgeProps {
  fase: "captacao" | "qualificacao" | "analise" | "acao" | "registro";
  className?: string;
}

export function FaseBadge({ fase, className }: FaseBadgeProps) {
  const config = {
    captacao: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", label: "captação" },
    qualificacao: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20", label: "qualificação" },
    analise: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20", label: "análise" },
    acao: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", label: "ação" },
    registro: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", label: "registro" },
  };

  const { bg, text, border, label } = config[fase];

  return (
    <Badge className={cn(bg, text, border, className)}>
      {label}
    </Badge>
  );
}

// Badge de Urgência
interface UrgenciaBadgeProps {
  nivel: "baixa" | "media" | "alta" | "critica";
  className?: string;
}

export function UrgenciaBadge({ nivel, className }: UrgenciaBadgeProps) {
  const config = {
    baixa: { variant: "secondary" as const, label: "baixa" },
    media: { variant: "warning" as const, label: "média" },
    alta: { variant: "danger" as const, label: "alta" },
    critica: { variant: "danger" as const, label: "crítica" },
  };

  const { variant, label } = config[nivel];

  return (
    <Badge variant={variant} className={className}>
      ⚡ {label}
    </Badge>
  );
}

// Badge de Status do Caso
interface StatusBadgeProps {
  status: "ativo" | "suspenso" | "em_execucao" | "encerrado";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    ativo: { variant: "success" as const, label: "ativo" },
    suspenso: { variant: "warning" as const, label: "suspenso" },
    em_execucao: { variant: "info" as const, label: "em execução" },
    encerrado: { variant: "secondary" as const, label: "encerrado" },
  };

  const { variant, label } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

// Badge de Prioridade
interface PrioridadeBadgeProps {
  prioridade: "baixa" | "media" | "alta" | "critica";
  className?: string;
}

export function PrioridadeBadge({ prioridade, className }: PrioridadeBadgeProps) {
  const config = {
    baixa: { variant: "secondary" as const, label: "baixa", dot: "bg-gray-400" },
    media: { variant: "warning" as const, label: "média", dot: "bg-amber-500" },
    alta: { variant: "danger" as const, label: "alta", dot: "bg-orange-500" },
    critica: { variant: "danger" as const, label: "crítica", dot: "bg-red-500 animate-pulse" },
  };

  const { variant, label, dot } = config[prioridade];

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {label}
    </Badge>
  );
}

export { Badge };
