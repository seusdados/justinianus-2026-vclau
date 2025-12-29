import Link from "next/link";

export default function Home() {
  const menuItems = [
    { href: "/captacao", icon: "📥", title: "Captação", desc: "Intake de novos leads", color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { href: "/qualificacao", icon: "🔍", title: "Qualificação", desc: "Análise com IA", color: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
    { href: "/analise", icon: "🕸️", title: "Análise", desc: "Grafo de evidências", color: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100" },
    { href: "/acao", icon: "⚡", title: "Ação", desc: "Sugestões e minutas", color: "bg-amber-50 border-amber-200 hover:bg-amber-100" },
    { href: "/registro", icon: "📋", title: "Registro", desc: "Auditoria e dossiê", color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
    { href: "/casos", icon: "📁", title: "Casos", desc: "Gestão de casos", color: "bg-slate-50 border-slate-200 hover:bg-slate-100" },
    { href: "/prazos", icon: "⏰", title: "Prazos", desc: "Controle de prazos", color: "bg-red-50 border-red-200 hover:bg-red-100" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                J
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Justinianus.AI</h1>
                <p className="text-xs text-gray-500">Gestão Jurídica Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                ● Online
              </span>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                + Novo Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-3xl font-bold text-blue-600">127</div>
            <div className="text-sm text-gray-500 mt-1">Casos Ativos</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-3xl font-bold text-purple-600">23</div>
            <div className="text-sm text-gray-500 mt-1">Leads Pendentes</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-3xl font-bold text-red-600">5</div>
            <div className="text-sm text-gray-500 mt-1">Prazos Urgentes</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-3xl font-bold text-green-600">89%</div>
            <div className="text-sm text-gray-500 mt-1">Taxa de Sucesso IA</div>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl border p-6 transition-all ${item.color}`}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Fluxo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo do Sistema</h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">📥 Captação</span>
            <span className="text-gray-400">→</span>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">🔍 Qualificação</span>
            <span className="text-gray-400">→</span>
            <span className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium">🕸️ Análise</span>
            <span className="text-gray-400">→</span>
            <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">⚡ Ação</span>
            <span className="text-gray-400">→</span>
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">📋 Registro</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
          <div className="space-y-3">
            {[
              { time: "Agora", text: "Novo lead recebido: Maria Silva - Trabalhista", type: "lead" },
              { time: "5 min", text: "Qualificação concluída: Caso #1234", type: "qualificacao" },
              { time: "15 min", text: "Prazo atualizado: Contestação TRT-2", type: "prazo" },
              { time: "1 hora", text: "Minuta gerada: Petição Inicial Cível", type: "acao" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 w-16">{item.time}</span>
                <span className="text-sm text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          Justinianus.AI © 2024 — Sistema de Gestão Jurídica com Inteligência Artificial
        </div>
      </footer>
    </div>
  );
}
