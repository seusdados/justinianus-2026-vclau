'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Tipos
// ============================================================================

interface No {
  id: string;
  tipo_no: 'fato' | 'prova' | 'alegacao' | 'pedido' | 'base_legal' | 'risco';
  titulo: string;
  conteudo?: string;
  forca: number;
  gerado_por_ia?: boolean;
}

interface Aresta {
  id: string;
  no_origem: string;
  no_destino: string;
  relacao: 'suportado_por' | 'depende_de' | 'fundamentado_por' | 'enfraquecido_por' | 'contradiz' | 'corrobora';
  peso: number;
}

interface GrafoEvidenciasProps {
  nos: No[];
  arestas: Aresta[];
  noSelecionado?: string;
  onSelecionarNo?: (no: No | null) => void;
  onEditarNo?: (no: No) => void;
  className?: string;
  modoVisualizacao?: 'radial' | 'hierarquico' | 'forcas';
}

// ============================================================================
// Constantes de Estilo
// ============================================================================

const CORES_NO = {
  fato: { bg: '#3B82F6', border: '#1D4ED8', text: 'Fato' },
  prova: { bg: '#10B981', border: '#059669', text: 'Prova' },
  alegacao: { bg: '#8B5CF6', border: '#7C3AED', text: 'Alegação' },
  pedido: { bg: '#F59E0B', border: '#D97706', text: 'Pedido' },
  base_legal: { bg: '#6366F1', border: '#4F46E5', text: 'Base Legal' },
  risco: { bg: '#EF4444', border: '#DC2626', text: 'Risco' },
} as const;

const CORES_ARESTA = {
  suportado_por: '#10B981',
  depende_de: '#F59E0B',
  fundamentado_por: '#6366F1',
  enfraquecido_por: '#EF4444',
  contradiz: '#EF4444',
  corrobora: '#10B981',
} as const;

const LABELS_RELACAO = {
  suportado_por: 'suportado por',
  depende_de: 'depende de',
  fundamentado_por: 'fundamentado por',
  enfraquecido_por: 'enfraquecido por',
  contradiz: 'contradiz',
  corrobora: 'corrobora',
} as const;

// ============================================================================
// Componente
// ============================================================================

export function GrafoEvidencias({
  nos,
  arestas,
  noSelecionado,
  onSelecionarNo,
  onEditarNo,
  className,
  modoVisualizacao = 'forcas',
}: GrafoEvidenciasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensoes, setDimensoes] = useState({ width: 800, height: 600 });
  const [posicoesNos, setPosicoesNos] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredNo, setHoveredNo] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // ──────────────────────────────────────────────────────────────────────────
  // Calcular Layout Inicial
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensoes({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calcular posições iniciais
  useEffect(() => {
    if (nos.length === 0) return;

    const novasPosicoes = new Map<string, { x: number; y: number }>();
    const centerX = dimensoes.width / 2;
    const centerY = dimensoes.height / 2;
    const raio = Math.min(dimensoes.width, dimensoes.height) / 3;

    if (modoVisualizacao === 'radial') {
      // Agrupar por tipo
      const grupos = new Map<string, No[]>();
      nos.forEach(no => {
        const lista = grupos.get(no.tipo_no) || [];
        lista.push(no);
        grupos.set(no.tipo_no, lista);
      });

      let anguloGrupo = 0;
      grupos.forEach((nosGrupo, tipo) => {
        const anguloIncremento = (Math.PI * 2) / grupos.size;
        const raioGrupo = raio * 0.8;
        
        nosGrupo.forEach((no, i) => {
          const anguloNo = anguloGrupo + (i * 0.2);
          const x = centerX + Math.cos(anguloNo) * raioGrupo * (1 + i * 0.1);
          const y = centerY + Math.sin(anguloNo) * raioGrupo * (1 + i * 0.1);
          novasPosicoes.set(no.id, { x, y });
        });
        
        anguloGrupo += anguloIncremento;
      });
    } else if (modoVisualizacao === 'hierarquico') {
      // Organizar por hierarquia: fatos -> provas -> alegações -> pedidos
      const hierarquia = ['fato', 'prova', 'alegacao', 'pedido', 'base_legal', 'risco'];
      
      hierarquia.forEach((tipo, nivelY) => {
        const nosDoTipo = nos.filter(n => n.tipo_no === tipo);
        nosDoTipo.forEach((no, i) => {
          const x = (dimensoes.width / (nosDoTipo.length + 1)) * (i + 1);
          const y = 80 + nivelY * 100;
          novasPosicoes.set(no.id, { x, y });
        });
      });
    } else {
      // Layout de forças (simulação simples)
      nos.forEach((no, i) => {
        const angulo = (i / nos.length) * Math.PI * 2;
        const x = centerX + Math.cos(angulo) * raio;
        const y = centerY + Math.sin(angulo) * raio;
        novasPosicoes.set(no.id, { x, y });
      });
    }

    setPosicoesNos(novasPosicoes);
  }, [nos, dimensoes, modoVisualizacao]);

  // ──────────────────────────────────────────────────────────────────────────
  // Simulação de Forças (simplificada)
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (modoVisualizacao !== 'forcas' || nos.length === 0) return;

    let animationId: number;
    const posicoes = new Map(posicoesNos);
    const velocidades = new Map<string, { vx: number; vy: number }>();
    
    nos.forEach(no => {
      velocidades.set(no.id, { vx: 0, vy: 0 });
    });

    const simular = () => {
      const centerX = dimensoes.width / 2;
      const centerY = dimensoes.height / 2;

      // Aplicar forças
      nos.forEach(no1 => {
        const pos1 = posicoes.get(no1.id);
        if (!pos1) return;

        let fx = 0;
        let fy = 0;

        // Força de repulsão entre nós
        nos.forEach(no2 => {
          if (no1.id === no2.id) return;
          const pos2 = posicoes.get(no2.id);
          if (!pos2) return;

          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const forca = 5000 / (dist * dist);
          
          fx += (dx / dist) * forca;
          fy += (dy / dist) * forca;
        });

        // Força de atração das arestas
        arestas.forEach(aresta => {
          let outroId: string | null = null;
          if (aresta.no_origem === no1.id) outroId = aresta.no_destino;
          if (aresta.no_destino === no1.id) outroId = aresta.no_origem;
          
          if (outroId) {
            const posOutro = posicoes.get(outroId);
            if (posOutro) {
              const dx = posOutro.x - pos1.x;
              const dy = posOutro.y - pos1.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const forca = dist * 0.01 * aresta.peso;
              
              fx += (dx / dist) * forca;
              fy += (dy / dist) * forca;
            }
          }
        });

        // Força para o centro
        const dxCenter = centerX - pos1.x;
        const dyCenter = centerY - pos1.y;
        fx += dxCenter * 0.001;
        fy += dyCenter * 0.001;

        // Atualizar velocidade
        const vel = velocidades.get(no1.id)!;
        vel.vx = (vel.vx + fx) * 0.8; // Damping
        vel.vy = (vel.vy + fy) * 0.8;

        // Atualizar posição
        if (no1.id !== dragging) {
          pos1.x += vel.vx;
          pos1.y += vel.vy;
          
          // Manter dentro dos limites
          pos1.x = Math.max(50, Math.min(dimensoes.width - 50, pos1.x));
          pos1.y = Math.max(50, Math.min(dimensoes.height - 50, pos1.y));
        }
      });

      setPosicoesNos(new Map(posicoes));
      animationId = requestAnimationFrame(simular);
    };

    simular();

    return () => cancelAnimationFrame(animationId);
  }, [nos, arestas, dimensoes, modoVisualizacao, dragging]);

  // ──────────────────────────────────────────────────────────────────────────
  // Desenhar no Canvas
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar
    ctx.clearRect(0, 0, dimensoes.width, dimensoes.height);

    // Desenhar arestas
    arestas.forEach(aresta => {
      const posOrigem = posicoesNos.get(aresta.no_origem);
      const posDestino = posicoesNos.get(aresta.no_destino);
      
      if (!posOrigem || !posDestino) return;

      ctx.beginPath();
      ctx.strokeStyle = CORES_ARESTA[aresta.relacao] || '#666';
      ctx.lineWidth = 1 + aresta.peso * 2;
      ctx.globalAlpha = 0.6;
      
      // Linha curva
      const midX = (posOrigem.x + posDestino.x) / 2;
      const midY = (posOrigem.y + posDestino.y) / 2;
      const ctrlX = midX + (Math.random() - 0.5) * 30;
      const ctrlY = midY + (Math.random() - 0.5) * 30;
      
      ctx.moveTo(posOrigem.x, posOrigem.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, posDestino.x, posDestino.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Seta
      const angle = Math.atan2(posDestino.y - ctrlY, posDestino.x - ctrlX);
      const arrowSize = 10;
      
      ctx.beginPath();
      ctx.moveTo(posDestino.x, posDestino.y);
      ctx.lineTo(
        posDestino.x - arrowSize * Math.cos(angle - Math.PI / 6),
        posDestino.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        posDestino.x - arrowSize * Math.cos(angle + Math.PI / 6),
        posDestino.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = CORES_ARESTA[aresta.relacao] || '#666';
      ctx.fill();
    });
  }, [arestas, posicoesNos, dimensoes]);

  // ──────────────────────────────────────────────────────────────────────────
  // Handlers de Mouse
  // ──────────────────────────────────────────────────────────────────────────

  const handleMouseDown = (noId: string, e: React.MouseEvent) => {
    setDragging(noId);
    const pos = posicoesNos.get(noId);
    if (pos) {
      setOffset({
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const x = e.clientX - containerRect.left - offset.x;
    const y = e.clientY - containerRect.top - offset.y;

    setPosicoesNos(prev => {
      const novo = new Map(prev);
      novo.set(dragging, { x, y });
      return novo;
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  const estatisticas = useMemo(() => {
    const porTipo = new Map<string, number>();
    nos.forEach(no => {
      porTipo.set(no.tipo_no, (porTipo.get(no.tipo_no) || 0) + 1);
    });
    
    const forcaMedia = nos.length > 0
      ? nos.reduce((sum, n) => sum + n.forca, 0) / nos.length
      : 0;

    return { porTipo, forcaMedia };
  }, [nos]);

  if (nos.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-96 bg-zinc-900 rounded-lg border border-zinc-800', className)}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-zinc-400">nenhuma evidência mapeada</p>
          <p className="text-sm text-zinc-500 mt-1">adicione fatos, provas e alegações ao caso</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden', className)}>
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-zinc-300">grafo de evidências</h3>
          <div className="flex items-center gap-2">
            {Array.from(estatisticas.porTipo.entries()).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: CORES_NO[tipo as keyof typeof CORES_NO]?.bg }}
                />
                <span className="text-xs text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>força média: {(estatisticas.forcaMedia * 100).toFixed(0)}%</span>
          <span>•</span>
          <span>{arestas.length} conexões</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-zinc-800/50">
        {Object.entries(CORES_NO).map(([tipo, config]) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.bg }}
            />
            <span className="text-xs text-zinc-400">{config.text}</span>
          </div>
        ))}
      </div>

      {/* Área do Grafo */}
      <div 
        ref={containerRef}
        className="relative flex-1 min-h-[400px]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas para arestas */}
        <canvas
          ref={canvasRef}
          width={dimensoes.width}
          height={dimensoes.height}
          className="absolute inset-0"
        />

        {/* Nós */}
        {nos.map(no => {
          const pos = posicoesNos.get(no.id);
          if (!pos) return null;

          const cores = CORES_NO[no.tipo_no];
          const isSelecionado = noSelecionado === no.id;
          const isHovered = hoveredNo === no.id;

          return (
            <div
              key={no.id}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-shadow',
                'rounded-lg border-2 px-3 py-2 shadow-lg',
                isSelecionado && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-900',
                isHovered && 'shadow-xl scale-105',
                dragging === no.id && 'cursor-grabbing opacity-90'
              )}
              style={{
                left: pos.x,
                top: pos.y,
                backgroundColor: cores.bg,
                borderColor: cores.border,
                zIndex: isSelecionado || isHovered ? 10 : 1,
              }}
              onMouseDown={(e) => handleMouseDown(no.id, e)}
              onMouseEnter={() => setHoveredNo(no.id)}
              onMouseLeave={() => setHoveredNo(null)}
              onClick={() => onSelecionarNo?.(isSelecionado ? null : no)}
              onDoubleClick={() => onEditarNo?.(no)}
            >
              <div className="flex items-center gap-2 min-w-[100px] max-w-[180px]">
                {/* Indicador de força */}
                <div 
                  className="w-1.5 h-8 rounded-full bg-black/20"
                  title={`Força: ${(no.forca * 100).toFixed(0)}%`}
                >
                  <div 
                    className="w-full bg-white/50 rounded-full transition-all"
                    style={{ height: `${no.forca * 100}%` }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{no.titulo}</p>
                  {no.gerado_por_ia && (
                    <span className="text-[10px] text-white/50">🤖 IA</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel de Detalhes (quando nó selecionado) */}
      {noSelecionado && (
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-800/50">
          {(() => {
            const no = nos.find(n => n.id === noSelecionado);
            if (!no) return null;

            const arestasRelacionadas = arestas.filter(
              a => a.no_origem === noSelecionado || a.no_destino === noSelecionado
            );

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CORES_NO[no.tipo_no].bg }}
                    />
                    <span className="text-sm text-zinc-300">{no.titulo}</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    força: {(no.forca * 100).toFixed(0)}%
                  </span>
                </div>
                
                {no.conteudo && (
                  <p className="text-xs text-zinc-400 line-clamp-2">{no.conteudo}</p>
                )}

                {arestasRelacionadas.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {arestasRelacionadas.map(aresta => {
                      const outroId = aresta.no_origem === noSelecionado 
                        ? aresta.no_destino 
                        : aresta.no_origem;
                      const outroNo = nos.find(n => n.id === outroId);
                      if (!outroNo) return null;

                      return (
                        <span 
                          key={aresta.id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400"
                        >
                          {LABELS_RELACAO[aresta.relacao]} • {outroNo.titulo}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
