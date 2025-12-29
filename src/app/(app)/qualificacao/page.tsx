'use client'

import { useState } from 'react'
import Link from 'next/link'

const leadsParaQualificar = [
  { 
    id: '1', 
    nome: 'Maria Silva', 
    tipo: 'Trabalhista', 
    resumo: 'Demissão sem justa causa após 5 anos. Alega horas extras não pagas.',
    documentos: 3,
    iaScore: 85,
    risco: 'medio',
    prazoEstimado: '15 dias'
  },
  { 
    id: '4', 
    nome: 'Ana Oliveira', 
    tipo: 'Família', 
    resumo: 'Divórcio litigioso com disputa de guarda de 2 filhos menores.',
    documentos: 7,
    iaScore: 72,
    risco: 'alto',
    prazoEstimado: '30 dias'
  },
]

export default function QualificacaoPage() {
  const [leadSelecionado, setLeadSelecionado] = useState<string | null>(null)
  const [analiseIA, setAnaliseIA] = useState(false)

  const executarAnaliseIA = (leadId: string) => {
    setLeadSelecionado(leadId)
    setAnaliseIA(true)
    setTimeout(() => setAnaliseIA(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">← Voltar</Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">🔍 Qualificação</h1>
              <p className="text-sm text-gray-500">Análise de viabilidade com IA</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lista de Leads */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads para Qualificação</h2>
            <div className="space-y-4">
              {leadsParaQualificar.map(lead => (
                <div 
                  key={lead.id} 
                  className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition ${
                    leadSelecionado === lead.id ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => setLeadSelecionado(lead.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{lead.nome}</h3>
                      <span className="text-sm text-purple-600">{lead.tipo}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{lead.iaScore}%</div>
                      <div className="text-xs text-gray-500">Score IA</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{lead.resumo}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📄 {lead.documentos} documentos</span>
                    <span>⏱️ {lead.prazoEstimado}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      lead.risco === 'baixo' ? 'bg-green-100 text-green-700' :
                      lead.risco === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Risco {lead.risco}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de Análise */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Análise Detalhada</h2>
            {leadSelecionado ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {analiseIA ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Analisando com IA...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Resumo Executivo</h3>
                      <p className="text-sm text-gray-600">
                        Caso com boa fundamentação jurídica. Documentação completa para os principais pontos.
                        Recomenda-se aceitar o caso com honorários padrão.
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Checklist de Documentos</h3>
                      <div className="space-y-2">
                        {['Contrato de trabalho', 'Holerites dos últimos 6 meses', 'CTPS atualizada', 'Termo de rescisão'].map((doc, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className={i < 3 ? 'text-green-500' : 'text-gray-300'}>
                              {i < 3 ? '✓' : '○'}
                            </span>
                            <span className={i < 3 ? 'text-gray-700' : 'text-gray-400'}>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Métricas da IA</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-green-600">92%</div>
                          <div className="text-xs text-gray-500">Fundamentação</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-blue-600">88%</div>
                          <div className="text-xs text-gray-500">Consistência</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => executarAnaliseIA(leadSelecionado)}
                        className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
                      >
                        🔄 Re-analisar
                      </button>
                      <Link 
                        href="/analise"
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-center"
                      >
                        ✓ Aprovar
                      </Link>
                      <button className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium">
                        ✗ Recusar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">👈</div>
                <p className="text-gray-500">Selecione um lead para ver a análise detalhada</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
