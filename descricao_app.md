# AdReviewOS - Plataforma de Aprovação de Criativos

## 1. Visão Geral do Produto

**AdReviewOS** é uma plataforma criada para acelerar e simplificar o fluxo de aprovação de criativos entre o time de performance/criação e os clientes.
O sistema oferece uma experiência de aprovação intuitiva baseada em swipe, onde:

- O time envia um *lote* de criativos para revisão.
- O cliente recebe um link único e acessa pelo celular.
- O cliente faz **swipe** para aprovar ou reprovar cada peça.
- Em caso de reprovação, um campo de feedback é automaticamente exibido.
- Todas as interações são registradas em tempo real.
- O time acompanha tudo pela área administrativa e usa os feedbacks para ajustar os criativos.

A plataforma também oferece um **painel interno completo**, garantindo organização, rastreabilidade e eficiência operacional.

---

## 2. Públicos do Sistema

### 2.1 Cliente
- Acessa via link único (sem login).
- Interface 100% mobile-first.
- Realiza aprovação/reprovação com swipes.
- Deixa feedback textual.
- Não tem acesso ao painel administrativo.

### 2.2 Time Interno (Adverse)
- Acessa via login e senha.
- Cria e envia lotes para clientes.
- Visualiza status dos lotes enviados.
- Acompanha feedback por criativo.
- Gerencia ajustes internos.
- Mantém histórico completo de envios e respostas.

---

## 3. Estrutura de Funcionalidades

## 3.1 Área do Cliente (Frontend)
Interface minimalista, inspirada em apps high-end Apple-like.

### Funcionalidades:
- **Swipe right** → Aprovar.
- **Swipe left** → Reprovar.
- Modal rápido de feedback quando houver reprovação.
- Botões redundantes (✔ Aprovar / ✖ Reprovar).
- Navegação automática para o próximo criativo.
- Barra de progresso indicando quantos criativos faltam.
- Animações suaves e experiência fluida.

---

## 3.2 Área Administrativa (Painel Interno)

### Layout:
- Menu lateral esquerdo minimalista.
- Tela desktop-first.
- Navegação clara e objetiva.

### Itens do menu:
1. Dashboard
2. Lotes Enviados
3. Criar Novo Lote
4. Histórico
5. Configurações de Usuário
6. Logout

---

### 3.2.1 Tela “Criar Novo Lote”
- Seleção do cliente.
- Upload múltiplo de criativos (imagem, vídeo, texto).
- Renomear criativos.
- Geração de link único para o cliente.
- Opção de envio automático por e-mail/WhatsApp ou cópia manual.

---

### 3.2.2 Tela “Lotes Enviados”
Lista minimalista contendo:
- Nome do lote
- Cliente
- Data
- Status
  - 🔵 Pendente
  - 🟢 Finalizado
  - 🟡 Parcial
- % aprovado
- % reprovado
- Timestamp da última interação

---

### 3.2.3 Tela Detalhada do Lote
Para cada criativo:
- Thumbnail
- Status (Aprovado, Reprovado, Aguardando)
- Feedback do cliente (se houver)
- Campo interno “status do ajuste”:
  - Não iniciado
  - Em execução
  - Ajustado
  - Reenviado
- Linha do tempo (log) do criativo

Essa tela é o centro operacional do time.

---

## 4. Fluxo Operacional Completo

1. Time cria o lote no painel.
2. Faz uploads dos criativos.
3. Gera e envia o link ao cliente.
4. Cliente acessa e começa a interagir.
5. Aprova/reprova via swipes.
6. Feedbacks são registrados instantaneamente.
7. Time acessa painel interno.
8. Analisa feedbacks por criativo.
9. Marca status interno dos ajustes.
10. Finaliza a etapa ou envia novamente.

---

## 5. Requisitos Técnicos

### 5.1 Backend
- Node.js (Express ou NestJS)
- Banco:
  - MongoDB (preferido)
  - ou PostgreSQL
- Armazenamento:
  - Cloudinary / AWS S3 / Supabase Storage
- Autenticação JWT (para admin)
- Rotas principais:
  - /auth
  - /lotes
  - /criativos
  - /cliente
  - /feedback
  - /analytics

---

### 5.2 Frontend
- React ou Next.js
- Mobile-first (cliente)
- Desktop-first (admin)
- Framer Motion para animações premium
- React UseGesture para swipes
- Upload com Dropzone

---

## 6. Design System (Apple-like · Minimalista · Monocromático)

### 6.1 Paleta
- Preto #000000  
- Branco #FFFFFF  
- Cinza #111111  
- Cinza #1C1C1E  
- Cinza #2C2C2E  
- Cinza #3A3A3C  
- Cinza #8E8E93  

### 6.2 Tipografia
- SF Pro
- Inter
- Pesos 300–700

### 6.3 Componentes
- Botões ghost e filled
- Cards arredondados (12px)
- Sombras sutis
- Microinterações suaves
- Ícones outline minimalistas
- Modals com efeito blur estilo iOS

### 6.4 Identidade
- Muito espaço em branco
- Layout clean, respirado
- Nada de cores vibrantes
- Toda a atenção no criativo

---

## 7. MVP Especificado

### Cliente:
- Acessar lote via link.
- Swipe para aprovar/reprovar.
- Feedback textual quando necessário.
- UI mobile minimalista.
- Barra de progresso.

### Time Interno:
- Login.
- Menu lateral.
- Criar lote.
- Upload múltiplo.
- Gerar link.
- Ver lotes.
- Ver feedbacks.
- Marcar status interno por criativo.

### Infra:
- Backend funcional.
- Banco de dados com tabelas/coleções de lotes e criativos.
- Controle de status e logs.

---

## 8. Diferenciais do Software
- Elimina aprovações por WhatsApp.
- Garante histórico centralizado.
- Reduz ambiguidades e retrabalho.
- Interface premium Apple-like.
- Eleva a experiência do cliente.
- Aumenta eficiência operacional.
- Base sólida para virar um SaaS white-label.

---

## 9. Missão do Software
Criar a forma **mais rápida, elegante e intuitiva** do mercado para aprovar criativos, oferecendo uma experiência premium ao cliente enquanto aumenta a produtividade e a organização interna da equipe.

