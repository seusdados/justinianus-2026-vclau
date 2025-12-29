# justinianus.ai

Sistema de gestão jurídica com IA para escritórios de advocacia.

## Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **IA**: OpenAI GPT-4 / Anthropic Claude (a configurar)
- **Deploy**: Vercel

## Funcionalidades

### Fluxo Principal (5 Fases)

1. **Captação** (`/captacao`) - Intake de leads via formulário, email ou upload
2. **Qualificação** (`/qualificacao`) - Análise de viabilidade com IA
3. **Análise** (`/analise`) - Grafo de evidências e construção da tese
4. **Ação** (`/acao`) - Sugestões de ações e geração de minutas
5. **Registro** (`/registro`) - Auditoria, LGPD e dossiê completo

### Outras Telas

- **Dashboard** (`/`) - Visão geral e métricas
- **Casos** (`/casos`) - Lista e gestão de casos
- **Prazos** (`/prazos`) - Controle de prazos processuais

## Setup Rápido

### 1. Clonar e instalar

```bash
git clone <repo>
cd justinianus
npm install
```

### 2. Configurar Supabase

Veja [supabase/README.md](./supabase/README.md) para instruções detalhadas.

```bash
cp .env.example .env.local
# Editar com suas credenciais do Supabase
```

### 3. Executar migrations

No dashboard do Supabase, execute os arquivos SQL em ordem:
1. `supabase/migrations/20241229000000_initial_schema.sql`
2. `supabase/migrations/20241229000001_rls_policies.sql`
3. `supabase/migrations/20241229000002_storage_buckets.sql`

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

## Estrutura do Projeto

```
justinianus/
├── src/
│   ├── app/                    # App Router (Next.js)
│   │   ├── (app)/              # Rotas autenticadas
│   │   │   ├── captacao/
│   │   │   ├── qualificacao/
│   │   │   ├── analise/
│   │   │   ├── acao/
│   │   │   ├── registro/
│   │   │   ├── casos/
│   │   │   └── prazos/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Dashboard
│   ├── components/
│   │   ├── ui/                 # Componentes base (shadcn/ui)
│   │   ├── formularios/        # Forms de entidades
│   │   └── fluxo/              # Componentes específicos do fluxo
│   ├── hooks/                  # React hooks (useLeads, useCasos, etc)
│   ├── lib/
│   │   ├── supabase/           # Cliente Supabase
│   │   └── utils.ts            # Utilitários
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── seed.sql                # Dados de desenvolvimento
│   └── README.md               # Instruções de setup
├── public/
└── ...config files
```

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# OpenAI (para agentes IA)
OPENAI_API_KEY=sk-...

# Anthropic (alternativa)
ANTHROPIC_API_KEY=sk-ant-...
```

## Scripts

```bash
npm run dev       # Desenvolvimento
npm run build     # Build de produção
npm run start     # Rodar build
npm run lint      # Linting
```

## Modelo de Dados

### Entidades Principais

- **Organização** - Escritório ou departamento jurídico
- **Cliente** - PF ou PJ
- **Lead** - Potencial cliente/caso
- **Caso** - Processo judicial ou consultivo
- **Prazo** - Prazo processual com alertas
- **Documento** - Arquivo com OCR e metadados
- **Grafo de Evidências** - Nós (fatos, provas, pedidos) e arestas (relações)
- **Sugestão IA** - Recomendações do sistema
- **Ação** - Ação proposta ou executada

### Agentes de IA

1. **Qualificador** - Analisa viabilidade de leads
2. **Analisador de Documentos** - Extrai informações de docs
3. **Construtor de Grafo** - Monta grafo de evidências
4. **Gerador de Minutas** - Cria peças processuais
5. **Detector de Oportunidades** - Identifica janelas de ação
6. **Avaliador de Riscos** - Analisa riscos do caso
7. **Pesquisador de Jurisprudência** - Busca precedentes

## Roadmap

- [x] Frontend completo (todas as páginas)
- [x] Hooks de dados (Supabase)
- [x] Schema SQL v2.0
- [x] RLS Policies
- [x] Storage Buckets
- [ ] Autenticação (email + OAuth)
- [ ] Deploy Supabase (migrations)
- [ ] Workers de IA
- [ ] Jobs assíncronos (prazos, alertas)
- [ ] Deploy Vercel
- [ ] Testes E2E

## Licença

Proprietário - Todos os direitos reservados.
