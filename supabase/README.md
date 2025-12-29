# Justinianus.AI — Setup do Banco de Dados

## Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase

## Setup Rápido (Dashboard)

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha nome, senha do banco e região
4. Aguarde a criação (~2 minutos)

### 2. Executar Migrations

1. No dashboard do projeto, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo de `migrations/00001_initial_schema.sql`
4. Clique em **Run** (ou Cmd+Enter)
5. Repita para `migrations/00002_seed_data.sql` (dados de exemplo)

### 3. Configurar Variáveis de Ambiente

Copie as credenciais de **Settings > API**:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Estrutura do Banco

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `organizacoes` | Escritórios e departamentos jurídicos |
| `clientes` | Clientes (PF/PJ) |
| `leads` | Potenciais clientes em qualificação |
| `casos` | Processos e consultorias |
| `prazos` | Prazos processuais |
| `tarefas_caso` | Tarefas vinculadas aos casos |
| `documentos` | Documentos com metadados de IA |
| `nos_grafo_evidencias` | Grafo de evidências |
| `sugestoes_ia` | Sugestões geradas por IA |
| `acoes` | Ações com workflow de aprovação |
