# 🏛️ Arquitetura e Stack Tecnológica

Este documento descreve as tecnologias e padrões arquiteturais adotados no projeto **Base SQL**.

---

## 🚀 Core Stack

### Frontend (User Interface)
*   **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/) - O coração do sistema, utilizando Server Components para eficiência e renderização híbrida.
*   **Biblioteca Base**: React 19.
*   **Design System & Styling**: 
    *   **Tailwind CSS v4**: Utilizado para todo o estilo visual, com foco em variáveis CSS modernas e arquitetura de design tokens.
    *   **Glassmorphism**: Estética visual baseada em transparências, bordas suaves e desfoque de fundo (backdrop-blur).
    *   **Lucide React**: Biblioteca padrão de ícones vetoriais.
*   **Componentes Especializados**:
    *   **Monaco Editor**: O motor do VS Code integrado para edição de scripts SQL com realce de sintaxe profissional.
    *   **Framer Motion / Tailwind Animate**: Para micro-interações e transições fluidas de interface.

### Backend (Lógica de Negócio e API)
*   **Runtime**: Node.js.
*   **API Layer**: Next.js Route Handlers (RESTful endpoints em `src/app/api`).
*   **Data Fetching**: Server Actions e padrão de repositório direto via Prisma no servidor.

### Persistência de Dados
*   **ORM**: [Prisma](https://www.prisma.io/) - Provê tipagem segura de ponta a ponta para consultas ao banco de dados.
*   **Banco de Dados**: PostgreSQL (Ambiente Cloud/Self-hosted).

### Segurança e Indentidade
*   **Autenticação**: [Auth.js (NextAuth v5)](https://authjs.dev/) - Sistema robusto de sessões JWT/Database com suporte a múltiplos provedores.
*   **Tipagem**: TypeScript (Strict Mode) para garantir integridade de dados e evitar erros em tempo de execução.

---

## 📁 Estrutura de Pastas

*   `src/app/`: Todas as rotas do sistema (Páginas, Layouts e APIs).
*   `src/components/`: Componentes React reutilizáveis, divididos por responsabilidade.
    *   `src/components/ui/`: Componentes básicos de interface (botões, inputs, cards).
    *   `src/components/forms/`: Lógica de formulários complexos.
    *   `src/components/editor/`: Integrações com o editor Monaco.
*   `src/lib/`: Configurações de bibliotecas externas (Prisma, Auth, utilitários globais).
*   `src/types/`: Definições globais de TypeScript e extensões de tipos.
*   `prisma/`: Contém o `schema.prisma` e arquivos de migração do banco.

---

## 🛠️ Padrões de Código
1.  **Clean Code**: Funções curtas, nomes expressivos e zero comentários óbvios.
2.  **Mobile-First**: Design responsivo garantido via breakpoints do Tailwind.
3.  **SEO**: Implementação de MetaTags e títulos dinâmicos em todas as páginas públicas.

---

> [!NOTE]
> Este documento será atualizado conforme novas funcionalidades críticas (como o sistema granular de permissões) forem implementadas.
