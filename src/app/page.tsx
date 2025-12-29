import Link from "next/link";

export default function Home() {
  const menuItems = [
    { href: "/captacao", icon: "📥", title: "Captação", desc: "Intake de novos leads" },
    { href: "/qualificacao", icon: "🔍", title: "Qualificação", desc: "Análise com IA" },
    { href: "/analise", icon: "🕸️", title: "Análise", desc: "Grafo de evidências" },
    { href: "/acao", icon: "⚡", title: "Ação", desc: "Sugestões e minutas" },
    { href: "/registro", icon: "📋", title: "Registro", desc: "Auditoria e dossiê" },
    { href: "/casos", icon: "📁", title: "Casos", desc: "Gestão de casos" },
    { href: "/prazos", icon: "⏰", title: "Prazos", desc: "Controle de prazos" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-xl font-bold text-slate-900">
                J
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Justinianus.AI</h1>
                <p className="text-xs text-slate-400">Legal Case Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                ● Online
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">
            Sistema de Gestão Jurídica com IA
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Automatize a captação, qualificação e gestão de casos jurídicos com 
            inteligência artificial avançada.
          </p>
        </div>

        <div className="mb-12 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="text-3xl font-bold text-amber-400">127</div>
            <div className="text-sm text-slate-400">Casos Ativos</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="text-3xl font-bold text-emerald-400">23</div>
            <div className="text-sm text-slate-400">Leads Pendentes</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="text-3xl font-bold text-red-400">5</div>
            <div className="text-sm text-slate-400">Prazos Urgentes</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="text-3xl font-bold text-blue-400">89%</div>
            <div className="text-sm text-slate-400">Taxa de Sucesso IA</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition-all hover:border-amber-500/50 hover:bg-slate-800"
            >
              <div className="mb-4 text-4xl">{item.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-amber-400">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Fluxo do Sistema</h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="rounded-lg bg-blue-500/20 px-3 py-2 text-blue-400">📥 Captação</span>
            <span className="text-slate-600">→</span>
            <span className="rounded-lg bg-purple-500/20 px-3 py-2 text-purple-400">🔍 Qualificação</span>
            <span className="text-slate-600">→</span>
            <span className="rounded-lg bg-emerald-500/20 px-3 py-2 text-emerald-400">🕸️ Análise</span>
            <span className="text-slate-600">→</span>
            <span className="rounded-lg bg-amber-500/20 px-3 py-2 text-amber-400">⚡ Ação</span>
            <span className="text-slate-600">→</span>
            <span className="rounded-lg bg-rose-500/20 px-3 py-2 text-rose-400">📋 Registro</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-700 bg-slate-900/50 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-slate-500">
          Justinianus.AI © 2024 — Sistema de Gestão Jurídica com Inteligência Artificial
        </div>
      </footer>
    </div>
  );
}
