# Guia de Contribuição - Fyness

Obrigado por considerar contribuir com o Fyness! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)

## 🤝 Código de Conduta

Esperamos que todos os contribuidores sigam nosso código de conduta:

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Demonstre empatia com outros membros

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/fyness.git
cd fyness

# Adicione o repositório original como upstream
git remote add upstream https://github.com/fyness/fyness.git
```

### 2. Crie uma Branch

```bash
# Atualize sua main
git checkout main
git pull upstream main

# Crie uma nova branch
git checkout -b feat/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 3. Faça suas Alterações

- Escreva código limpo e bem documentado
- Siga os padrões de código do projeto
- Adicione testes quando apropriado
- Mantenha commits pequenos e focados

### 4. Commit suas Mudanças

```bash
# Adicione os arquivos
git add .

# Commit com mensagem descritiva
git commit -m "feat: adiciona funcionalidade X"
```

### 5. Push e Pull Request

```bash
# Push para seu fork
git push origin feat/minha-feature

# Abra um Pull Request no GitHub
```

## 💻 Padrões de Código

### TypeScript/JavaScript

```typescript
// ✅ BOM
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ RUIM
export function calc(i: any) {
  let s = 0;
  for (let x of i) {
    s += x.price;
  }
  return s;
}
```

### Nomenclatura

- **Variáveis e Funções**: camelCase
  ```typescript
  const userName = 'João';
  function getUserData() {}
  ```

- **Componentes**: PascalCase
  ```typescript
  function UserProfile() {}
  export const CardHeader = () => {};
  ```

- **Constantes**: UPPER_SNAKE_CASE
  ```typescript
  const MAX_RETRY_COUNT = 3;
  const API_BASE_URL = 'https://api.example.com';
  ```

- **Tipos e Interfaces**: PascalCase
  ```typescript
  interface UserData {}
  type ResponseStatus = 'success' | 'error';
  ```

### Estrutura de Arquivos

```typescript
// 1. Imports externos
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Imports internos
import { Button } from '@/components/ui/button';
import { useContas } from '@/hooks';

// 3. Tipos e Interfaces
interface ComponentProps {
  title: string;
  onSave: () => void;
}

// 4. Constantes
const DEFAULT_PAGE_SIZE = 10;

// 5. Componente
export function Component({ title, onSave }: ComponentProps) {
  // Hooks
  const [data, setData] = useState([]);
  const router = useRouter();

  // Effects
  useEffect(() => {
    // logic
  }, []);

  // Handlers
  const handleClick = () => {
    // logic
  };

  // Render
  return <div>{/* JSX */}</div>;
}
```

### Comentários

```typescript
// ✅ BOM - Explica o "porquê"
// Usando debounce para evitar múltiplas chamadas à API durante digitação rápida
const debouncedSearch = useMemo(() => debounce(search, 300), []);

// ❌ RUIM - Descreve o óbvio
// Cria uma variável count e atribui 0
const count = 0;
```

### Tratamento de Erros

```typescript
// ✅ BOM
try {
  const result = await fetchData();
  return result;
} catch (error) {
  console.error('Erro ao buscar dados:', error);
  toast.error('Não foi possível carregar os dados');
  return null;
}

// ❌ RUIM
try {
  const result = await fetchData();
  return result;
} catch (e) {
  console.log(e);
}
```

### Componentes React

```typescript
// ✅ BOM - Componente limpo e focado
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{user.name}</h3>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <Button onClick={() => onEdit(user.id)}>Editar</Button>
    </div>
  );
}

// ❌ RUIM - Componente fazendo muitas coisas
export function UserCard({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const handleSubmit = () => {
    // 50 linhas de lógica
  };
  // Mais 100 linhas de código
}
```

## 🔄 Processo de Pull Request

### Checklist Antes de Submeter

- [ ] O código segue os padrões do projeto
- [ ] Todos os testes passam
- [ ] Novos testes foram adicionados (se aplicável)
- [ ] A documentação foi atualizada (se aplicável)
- [ ] Os commits seguem o padrão Conventional Commits
- [ ] Não há conflitos com a branch main
- [ ] O código foi revisado por você mesmo

### Conventional Commits

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit:

```
tipo(escopo): descrição curta

Descrição mais detalhada do commit (opcional)

Closes #123
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, estilo
- `refactor`: Refatoração sem mudança de funcionalidade
- `perf`: Melhorias de performance
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção

**Exemplos:**
```bash
feat(auth): adiciona autenticação com Google
fix(dashboard): corrige cálculo de totais
docs(readme): atualiza instruções de instalação
refactor(hooks): extrai lógica de filtros para hook personalizado
```

### Revisão de Código

Seu PR será revisado por um mantenedor. Eles podem:

1. Aprovar e fazer merge
2. Solicitar mudanças
3. Fazer comentários e sugestões

Seja receptivo ao feedback e faça as alterações solicitadas.

## 🐛 Reportando Bugs

### Antes de Reportar

1. Verifique se o bug já foi reportado nas Issues
2. Tente reproduzir o bug em ambiente limpo
3. Colete informações sobre o ambiente

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara e concisa do bug.

**Como Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
- OS: [ex: macOS 12.0]
- Browser: [ex: Chrome 95]
- Versão: [ex: 1.2.3]

**Informações Adicionais**
Qualquer outro contexto sobre o problema.
```

## 💡 Sugerindo Melhorias

### Template de Feature Request

```markdown
**A Funcionalidade Está Relacionada a um Problema?**
Descrição clara do problema. Ex: "Sempre fico frustrado quando [...]"

**Descreva a Solução Desejada**
Descrição clara do que você quer que aconteça.

**Descreva Alternativas Consideradas**
Outras soluções ou funcionalidades que você considerou.

**Contexto Adicional**
Qualquer outro contexto ou screenshots sobre a feature request.
```

## 📚 Recursos Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ Perguntas?

Se você tiver dúvidas sobre como contribuir, abra uma Discussion no GitHub ou entre em contato com a equipe.

Obrigado por contribuir! 🚀
