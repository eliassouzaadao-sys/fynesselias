# Fyness - Sistema de Gestão Financeira

Sistema completo de gestão financeira para MEI e pequenas empresas, desenvolvido com Next.js 16, React 19 e Tailwind CSS.

## 🚀 Funcionalidades

- **Dashboard**: Visão geral com KPIs e métricas financeiras
- **Contas a Pagar**: Gerenciamento completo de despesas e pagamentos
- **Contas a Receber**: Controle de recebimentos e faturas
- **Caixa**: Controle de fluxo de caixa e movimentações
- **Contas Bancárias**: Gestão de múltiplas contas bancárias
- **Conciliação**: Conciliação bancária automatizada
- **Créditos**: Gerenciamento de linhas de crédito
- **Centros de Custo**: Organização por departamentos e projetos
- **Relatórios**: DRE, Fluxo de Caixa, Balancete e mais
- **Automação**: Regras e automações financeiras
- **Auditoria**: Rastreamento de todas as operações
- **Multi-empresa**: Suporte a múltiplas empresas

## 🛠️ Tecnologias

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Banco de Dados**: Prisma ORM + SQLite (desenvolvimento)
- **UI**: Tailwind CSS 4.x + shadcn/ui
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Chart.js + Recharts
- **Autenticação**: NextAuth.js
- **Gerenciador de Pacotes**: pnpm

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/fyness.git

# Entre no diretório
cd fyness

# Instale as dependências
pnpm install

# Configure o banco de dados
pnpm prisma generate
pnpm prisma migrate dev

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## 🏗️ Estrutura do Projeto

```
fyness/
├── app/                    # Next.js App Router
│   ├── (app)/             # Rotas protegidas
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── pagar/         # Contas a pagar
│   │   ├── receber/       # Contas a receber
│   │   ├── caixa/         # Controle de caixa
│   │   └── ...
│   ├── api/               # API Routes
│   ├── login/             # Página de login
│   └── layout.tsx         # Layout raiz
│
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI (shadcn)
│   ├── forms/            # Componentes de formulários
│   ├── layout/           # Layout components (sidebar, topbar)
│   ├── shared/           # Componentes compartilhados
│   └── features/         # Componentes específicos de features
│
├── lib/                  # Bibliotecas e utilitários
│   ├── services/         # Serviços de API
│   ├── validations/      # Schemas de validação (Zod)
│   ├── types/            # Definições de tipos TypeScript
│   ├── constants/        # Constantes da aplicação
│   ├── utils.ts          # Funções utilitárias
│   ├── format.js         # Formatação de dados
│   └── prisma.js         # Cliente Prisma
│
├── hooks/                # Custom React Hooks
│   ├── useContas.ts      # Hook para gerenciar contas
│   ├── usePessoas.ts     # Hook para gerenciar pessoas
│   ├── useFilters.ts     # Hook para filtros
│   ├── usePagination.ts  # Hook para paginação
│   ├── use-mobile.ts     # Hook para responsividade
│   └── use-toast.ts      # Hook para notificações
│
├── prisma/               # Prisma ORM
│   ├── schema.prisma     # Schema do banco de dados
│   └── migrations/       # Migrations
│
├── public/               # Arquivos estáticos
└── styles/               # Estilos globais
```

## 🎨 Padrões de Código

### Nomenclatura
- **Componentes**: PascalCase (ex: `PagarContent.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useContas.ts`)
- **Serviços**: camelCase com sufixo `.service` (ex: `contas.service.ts`)
- **Tipos**: PascalCase (ex: `Conta`, `Pessoa`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_ROUTES`)

### Estrutura de Componentes
```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface ComponentProps {
  // props
}

// Component
export function Component({ prop }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => {
    // logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Uso de Hooks Personalizados
```typescript
import { useContas } from '@/hooks';

function MyComponent() {
  const { contas, loading, createConta, updateConta } = useContas({
    tipo: 'pagar',
    autoLoad: true,
  });

  // Use the data and methods
}
```

### Validação com Zod
```typescript
import { contaSchema } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(contaSchema),
  defaultValues: {
    tipo: 'pagar',
    descricao: '',
    valor: 0,
  },
});
```

### Chamadas de API
```typescript
import { contasService } from '@/lib/services';

// Create
const result = await contasService.create(data);

// Get all
const { data: contas } = await contasService.getAll(filters);

// Update
await contasService.update(id, data);

// Delete
await contasService.delete(id);
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Lint
pnpm lint

# Prisma Studio (visualizar banco de dados)
pnpm prisma studio

# Gerar tipos do Prisma
pnpm prisma generate

# Criar migration
pnpm prisma migrate dev --name migration_name

# Reset do banco de dados
pnpm prisma migrate reset
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Node
NODE_ENV="development"
```

## 📝 Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `test`: Adição ou modificação de testes
- `chore`: Atualização de tarefas de build, etc

Exemplo:
```
feat: add authentication to dashboard
fix: correct currency formatting issue
docs: update README with new features
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feat/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Autores

- Equipe Fyness

## 🐛 Reportar Bugs

Para reportar bugs ou solicitar funcionalidades, abra uma issue no repositório.

## 📚 Recursos Adicionais

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
