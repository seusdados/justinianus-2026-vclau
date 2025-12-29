'use client'

import { useState } from 'react'
import Link from 'next/link'

const sugestoes = [
  { 
    id: 1, 
    tipo: 'minuta', 
    titulo: 'Petição Inicial Trabalhista', 
    descricao: 'Reclamação trabalhista com pedidos de verbas rescisórias e horas extras',
    confianca: 94,
    status: 'pendente',
    caso: 'Maria Silva vs TechCorp'
  },
  { 
    id: 2, 
    tipo: 'estrategia', 
    titulo: 'Proposta de Acordo', 
    descricao: 'Análise indica possibilidade de acordo com desconto de 15%',
    confianca: 78,
    status: 'pendente',
    caso: 'Maria Silva vs TechCorp'
  },
  { 
    id: 3, 
    tipo: 'alerta', 
    titulo: 'Prazo Recursal Aproximando', 
    descricao: 'Prazo para recurso ordinário vence em 3 dias úteis',
    confianca: 100,
    status: 'urgente',
    caso: 'João Santos - Cível'
  },
]

const tipoIcons: Record<string, string> = {
  minuta: '📝',
  estrategia: '💡',
  alerta: '⚠️',
  acao: '⚡'
}

export default function AcaoPage() {
  const [selectedSugestao, setSelectedSugestao] = useState<number | null>(null)
  const [gerando, setGerando] = useState(false)

  const gerarMinuta = () => {
    setGerando(true)
    setTimeout(() => setGerando(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">← Voltar</Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">⚡ Ação</h1>
                <p className="text-sm text-gray-500">Sugestões e geração de minutas</p>
              </div>
            </div>
            <button 
              onClick={gerarMinuta}
              disabled={gerando}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50"
            >
              {gerando ? '⏳ Gerando...' : '🤖 Gerar Nova Minuta'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-amber-600">{sugestoes.length}</div>
            <div className="text-sm text-gray-500">Sugestões Ativas</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-500">Minutas Geradas</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">89%</div>
            <div className="text-sm text-gray-500">Taxa de Aprovação</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-red-600">1</div>
            <div className="text-sm text-gray-500">Alertas Urgentes</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lista de Sugestões */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sugestões da IA</h2>
            <div className="space-y-3">
              {sugestoes.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSelectedSugestao(s.id)}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition ${
                    selectedSugestao === s.id ? 'border-amber-500' : 'border-gray-200 hover:border-amber-300'
                  } ${s.status === 'urgente' ? 'ring-2 ring-red-200' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tipoIcons[s.tipo]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{s.titulo}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          s.status === 'urgente' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {s.status === 'urgente' ? 'Urgente' : 'Pendente'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{s.descricao}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>📁 {s.caso}</span>
                        <span>•</span>
                        <span className="text-amber-600 font-medium">{s.confianca}% confiança</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de Ação */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Executar Ação</h2>
            {selectedSugestao ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {(() => {
                  const s = sugestoes.find(x => x.id === selectedSugestao)
                  if (!s) return null
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{tipoIcons[s.tipo]}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{s.titulo}</h3>
                          <span className="text-sm text-gray-500">{s.caso}</span>
                        </div>
                      </div>

                      {s.tipo === 'minuta' && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-2">Preview da Minuta</h4>
                          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 font-mono max-h-48 overflow-y-auto">
                            EXMO. SR. DR. JUIZ DA ___ VARA DO TRABALHO DE SÃO PAULO - SP
                            <br /><br />
                            MARIA DA SILVA, brasileira, solteira, auxiliar administrativa...
                            <br /><br />
                            vem, respeitosamente, à presença de Vossa Excelência, propor a presente
                            <br /><br />
                            RECLAMAÇÃO TRABALHISTA
                            <br /><br />
                            em face de TECHCORP LTDA...
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                          ✓ Aprovar
                        </button>
                        <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                          ✏️ Editar
                        </button>
                        <button className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium">
                          ✗ Rejeitar
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">👈</div>
                <p className="text-gray-500">Selecione uma sugestão para executar</p>
              </div>
            )}

            {gerando && (
              <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200 p-6 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-amber-700 font-medium">Gerando minuta com IA...</p>
                <p className="text-sm text-amber-600">Analisando caso e precedentes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
