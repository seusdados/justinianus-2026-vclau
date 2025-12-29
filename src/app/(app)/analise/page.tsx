'use client'

import { useState } from 'react'
import Link from 'next/link'

const nodes = [
  { id: 1, tipo: 'fato', titulo: 'Demissão em 15/10/2024', x: 100, y: 100 },
  { id: 2, tipo: 'prova', titulo: 'Termo de rescisão', x: 300, y: 80 },
  { id: 3, tipo: 'prova', titulo: 'Holerites', x: 300, y: 160 },
  { id: 4, tipo: 'fato', titulo: 'Horas extras não pagas', x: 100, y: 220 },
  { id: 5, tipo: 'prova', titulo: 'Controle de ponto', x: 300, y: 240 },
  { id: 6, tipo: 'pedido', titulo: 'Verbas rescisórias', x: 500, y: 120 },
  { id: 7, tipo: 'pedido', titulo: 'Horas extras', x: 500, y: 220 },
  { id: 8, tipo: 'risco', titulo: 'Prescrição parcial', x: 500, y: 320 },
]

const edges = [
  { from: 1, to: 2 },
  { from: 1, to: 6 },
  { from: 4, to: 3 },
  { from: 4, to: 5 },
  { from: 4, to: 7 },
  { from: 7, to: 8 },
]

const tipoColors: Record<string, { bg: string; border: string; text: string }> = {
  fato: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  prova: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  pedido: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  risco: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
}

export default function AnalisePage() {
  const [selectedNode, setSelectedNode] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">← Voltar</Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">🕸️ Análise</h1>
                <p className="text-sm text-gray-500">Grafo de evidências do caso</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition font-medium">
                + Adicionar Nó
              </button>
              <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-medium">
                🤖 Gerar com IA
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Grafo Visual */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4" style={{ minHeight: '500px' }}>
            <div className="relative w-full h-full" style={{ minHeight: '450px' }}>
              {/* SVG para conexões */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                {edges.map((edge, i) => {
                  const fromNode = nodes.find(n => n.id === edge.from)
                  const toNode = nodes.find(n => n.id === edge.to)
                  if (!fromNode || !toNode) return null
                  return (
                    <line
                      key={i}
                      x1={fromNode.x + 60}
                      y1={fromNode.y + 20}
                      x2={toNode.x}
                      y2={toNode.y + 20}
                      stroke="#cbd5e1"
                      strokeWidth="2"
                    />
                  )
                })}
              </svg>
              
              {/* Nós */}
              {nodes.map(node => {
                const colors = tipoColors[node.tipo]
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node.id)}
                    className={`absolute px-3 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${colors.bg} ${colors.border} ${colors.text} ${
                      selectedNode === node.id ? 'ring-2 ring-offset-2 ring-cyan-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ left: node.x, top: node.y, zIndex: 10 }}
                  >
                    {node.titulo}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Painel Lateral */}
          <div className="space-y-4">
            {/* Legenda */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Legenda</h3>
              <div className="space-y-2">
                {Object.entries(tipoColors).map(([tipo, colors]) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${colors.bg} ${colors.border} border`}></div>
                    <span className="text-sm text-gray-600 capitalize">{tipo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhes do Nó */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Nó</h3>
              {selectedNode ? (
                <div>
                  {(() => {
                    const node = nodes.find(n => n.id === selectedNode)
                    if (!node) return null
                    const colors = tipoColors[node.tipo]
                    return (
                      <>
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${colors.bg} ${colors.text}`}>
                          {node.tipo.toUpperCase()}
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{node.titulo}</h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Clique em outro nó para ver suas conexões e detalhes.
                        </p>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            Editar
                          </button>
                          <button className="flex-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                            Remover
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Selecione um nó para ver detalhes</p>
              )}
            </div>

            {/* Estatísticas */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{nodes.length}</div>
                  <div className="text-xs text-gray-500">Nós</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{edges.length}</div>
                  <div className="text-xs text-gray-500">Conexões</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
