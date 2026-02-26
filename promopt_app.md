
Act like a senior full-stack software engineer and software architect, especializado em construção de SaaS B2B e ferramentas internas de times de marketing e performance.

## Contexto e fonte de verdade

Você está rodando via **Claude Code CLI** dentro de um repositório local.

Existe um arquivo de especificação chamado **`descricao_app.md`** no diretório atual.  
Esse arquivo descreve o software **AdReviewOS**, uma plataforma para acelerar e simplificar o fluxo de aprovação de criativos entre o time de performance/criação e os clientes.

Trate o conteúdo de `descricao_app.md` como **fonte de verdade absoluta** para:

- Objetivo de negócio
- Perfis de usuário / personas
- Fluxos de aprovação
- Regras de negócio
- Funcionalidades obrigatórias e desejáveis
- Restrições técnicas eventualmente descritas

Se houver qualquer divergência entre este prompt e `descricao_app.md`, **priorize sempre o que está escrito em `descricao_app.md`**.

## Objetivo principal

Seu objetivo é:

1. Ler e entender profundamente a especificação em `descricao_app.md`.
2. Projetar a arquitetura da aplicação.
3. Criar toda a base de código necessária para um **MVP funcional e extensível em produção** da plataforma descrita.
4. Implementar:
   - Backend (APIs, regras de negócio, integrações)
   - Frontend (UI estilo “Tinder de Aprovação” para criativos)
   - Modelagem de dados / banco de dados
   - Autenticação/autorização (se descrito ou inferido da especificação)
   - Testes mínimos adequados
   - Documentação (README e, se fizer sentido, docs adicionais)

Ao final, o repositório deve estar pronto para:

- Instalar dependências
- Rodar migrações (se houver)
- Subir o backend e o frontend localmente
- Permitir o fluxo completo de aprovação de criativos conforme descrito em `descricao_app.md`

## Stack tecnológico

1. **Respeite sempre a especificação**:
   - Se `descricao_app.md` **já definir** linguagem, framework, banco de dados ou qualquer restrição tecnológica, **siga à risca**.
2. Se a especificação **não definir** stack, use por padrão:
   - **Backend**
     - Node.js (versão LTS recente)
     - TypeScript
     - Framework: **NestJS** ou **Fastify + arquitetura modular** (escolha o mais adequado e seja consistente)
     - ORM: **Prisma**
     - Banco de dados: **PostgreSQL**
     - Migrations versionadas
   - **Frontend web**
     - **React** com **Vite** ou **Next.js** (escolha uma abordagem SPA/SSR coerente com a necessidade)
     - TypeScript
     - Biblioteca de UI moderna (por ex. Tailwind CSS + componentes simples)
   - **Outros**
     - Testes: Jest/Vitest (backend e, se possível, alguns testes de UI)
     - Ferramentas de qualidade: ESLint + Prettier

Se a escolha de stack não estiver definida na especificação, explique brevemente no README o racional da escolha.

## Escopo funcional (alto nível, derivado da ideia)

Use sempre `descricao_app.md` para o detalhamento completo, mas garanta pelo menos:

- Usuários/times relevantes (ex.: time de performance/criação, clientes, aprovadores etc.), conforme descrito.
- Entidades principais do domínio:
  - Criativos/anúncios
  - Campanhas ou grupos de criativos (se estiver no documento)
  - Status de aprovação (aprovado, reprovado, pendente, etc.)
- Fluxo estilo “Tinder de Aprovação”:
  - Interface para o usuário “deslizar”/aprovar/reprovar rapidamente criativos (ou interações equivalentes – botões de like/dislike, teclado, etc.).
- Lista/galeria de criativos com:
  - Dados necessários para tomada de decisão (visual do criativo, cópia, meta-informações, etc., conforme o documento)
- Registro de histórico de decisões:
  - Quem aprovou ou reprovou
  - Quando
  - Comentários/feedback (se previsto)
- Controles de acesso e papéis (roles) se o documento especificar isso.
- Qualquer outra funcionalidade explicitamente exigida em `descricao_app.md`.

Se, ao ler `descricao_app.md`, você identificar outras entidades, fluxos ou telas obrigatórias, **inclua-as** no escopo e ajuste a modelagem e as APIs.

## Regras gerais de implementação

- **Nada de pseudocódigo**: escreva código real, compilável/rodável.
- Evite deixar trechos críticos com `// TODO`; somente use TODO para melhorias futuras não essenciais ao MVP.
- Use **nomes claros e consistentes** para variáveis, funções, classes, componentes e tabelas.
- Estruture o projeto para ser fácil de manter, testar e evoluir.
- Tenha cuidado especial com:
  - Validações de entrada
  - Mensagens de erro claras
  - Regras de negócio de aprovação (quem pode aprovar o quê, em que momento etc.)
- Sempre que fizer uma decisão de design importante (ex.: estratégia de autenticação, formato de API, modelagem de status), registre em um arquivo `docs/arquitetura.md` ou seção específica do README.

## Estrutura de pastas sugerida

Se a especificação não impor outra estrutura, use algo como:

- `/backend`
  - `src/`
    - `modules/` (cada módulo de domínio: criativos, campanhas, approvals, usuários etc.)
    - `infra/`
    - `config/`
    - `main.ts` ou equivalente
  - `prisma/` (schema e migrations) ou diretório equivalente do ORM escolhido
- `/frontend`
  - `src/`
    - `pages/` ou `routes/`
    - `components/`
    - `features/` (fluxos de negócio: aprovação, listagem, gestão de criativos, etc.)
    - `styles/`
- `/docs`
  - `arquitetura.md`
- `README.md`

Adapte conforme necessário, mas mantenha a **separação clara de responsabilidades**.

## Como usar o Claude Code CLI neste contexto

Enquanto estiver rodando via Claude Code CLI:

1. **Leia primeiro `descricao_app.md` por completo.**
2. Crie (ou edite) um arquivo `docs/arquitetura.md` resumindo:
   - Objetivo do sistema
   - Personas
   - Principais entidades e relacionamentos
   - Visão geral da arquitetura escolhida (stack, pastas, padrões)
3. Em seguida, crie a estrutura mínima de pastas e arquivos do projeto (backend, frontend, docs).
4. Implemente a modelagem de dados e configure o ORM e o banco.
5. Implemente as APIs necessárias para suportar todos os fluxos descritos.
6. Implemente o frontend com foco:
   - Na experiência de aprovação rápida de criativos via swipe
   - Na clareza dos estados (pendente, aprovado, reprovado, etc.)
7. Crie testes básicos pelo menos para:
   - Casos de uso centrais do backend (aprovar/reprovar criativo, criação/edição de criativo, etc.)
8. Configure scripts de NPM/Yarn/Pnpm para:
   - Instalar dependências
   - Rodar migrações (se houver)
   - Subir backend
   - Subir frontend
   - Rodar testes
9. Atualize o `README.md` com:
   - Descrição breve do produto
   - Stack utilizada
   - Pré-requisitos (ex.: Node, PostgreSQL)
   - Passo a passo para rodar o projeto do zero (dev)
   - Comandos principais (dev, build, test, migrations, etc.)

## Qualidade de código e UX

- Priorize **legibilidade** sobre “cleverness”.
- Escreva componentes reutilizáveis e simples.
- Garanta que a UI seja:
  - Responsiva (funcione bem em tamanhos de tela comuns)
  - Intuitiva (o usuário entende rapidamente como aprovar/reprovar criativos)
- Utilize feedback visual adequado (loaders, estados vazios, mensagens de erro/sucesso).

## Raciocínio e transparência

- Antes de sair escrevendo código, elabore internamente um **plano de alto nível**:
  - Liste as principais entidades e relações em forma de tabela.
  - Liste os principais endpoints da API com métodos HTTP e payloads.
  - Liste as principais telas/rotas do frontend e o que cada uma faz.
- Sempre que fizer uma mudança relevante, mantenha o código e a documentação em sincronia.
- Se algo na especificação estiver ambíguo, escolha a solução mais simples que atenda ao caso de uso, documente sua decisão no `docs/arquitetura.md` e siga em frente.

## Resultado esperado

Ao concluir o trabalho, o repositório deve conter:

1. Código backend completo para o MVP conforme `descricao_app.md`.
2. Código frontend completo para o MVP conforme `descricao_app.md`.
3. Modelagem de dados e migrations funcionando.
4. Scripts para instalar, migrar e rodar.
5. README claro para que qualquer desenvolvedor consiga subir o projeto localmente.
6. Uma experiência de aprovação de criativos minimamente polida e utilizável dentro do escopo do MVP.

Take a deep breath and work on this problem step-by-step.
