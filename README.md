# 🍪 Cookie Manager — Sistema de Gestão

Sistema completo para gestão de empresa de cookies artesanais.

---

## 🚀 GUIA DE DEPLOY — PASSO A PASSO COMPLETO

### ANTES DE COMEÇAR — O QUE VOCÊ PRECISA

1. Conta no **GitHub** (gratuita) → https://github.com
2. Conta na **Vercel** (gratuita) → https://vercel.com
3. Banco de dados PostgreSQL gratuito → **Neon** https://neon.tech (recomendado)

---

## PARTE 1 — PREPARAR O BANCO DE DADOS (Neon)

### 1.1 Criar conta no Neon
1. Acesse https://neon.tech e clique em **"Sign Up"**
2. Crie conta com Google ou Email
3. Clique em **"Create a project"**
4. Dê um nome: `cookie-manager`
5. Região: `AWS / US East` (ou a mais próxima)
6. Clique em **"Create project"**

### 1.2 Pegar a URL de conexão
1. Na dashboard do Neon, clique no projeto criado
2. Vá em **"Connection string"**
3. Selecione **"Prisma"** no dropdown
4. Copie a string — ela começa com `postgresql://...`
5. **Guarde esta string! Você vai precisar dela.**

Exemplo: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## PARTE 2 — SUBIR O CÓDIGO NO GITHUB

### 2.1 Instalar o Git (se não tiver)
- Windows: https://git-scm.com/download/win
- Mac: já vem instalado

### 2.2 Criar repositório no GitHub
1. Acesse https://github.com e faça login
2. Clique no botão **"+"** (canto superior direito) → **"New repository"**
3. Nome: `cookie-manager`
4. Deixe como **"Private"** (privado)
5. **NÃO** marque nenhuma opção adicional
6. Clique em **"Create repository"**

### 2.3 Fazer upload dos arquivos

**Opção A — Via interface web do GitHub (mais fácil):**
1. Na página do repositório criado, clique em **"uploading an existing file"**
2. Arraste a pasta `cookie-system` toda para lá
3. Clique em **"Commit changes"**

**Opção B — Via terminal (se tiver Git instalado):**
```bash
cd cookie-system
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/cookie-manager.git
git branch -M main
git push -u origin main
```

---

## PARTE 3 — DEPLOY NA VERCEL

### 3.1 Conectar GitHub na Vercel
1. Acesse https://vercel.com e clique em **"Sign Up"**
2. Escolha **"Continue with GitHub"**
3. Autorize a Vercel a acessar seus repositórios

### 3.2 Importar o projeto
1. Na dashboard da Vercel, clique em **"Add New..."** → **"Project"**
2. Encontre o repositório `cookie-manager` e clique em **"Import"**

### 3.3 Configurar variáveis de ambiente
**ESTA É A PARTE MAIS IMPORTANTE!**

Antes de fazer o deploy, você precisa configurar as variáveis de ambiente.
Na tela de configuração do projeto Vercel, clique em **"Environment Variables"** e adicione:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | A string de conexão do Neon (copiada no Passo 1.2) |
| `NEXTAUTH_SECRET` | Uma string aleatória segura (gere abaixo) |
| `NEXTAUTH_URL` | A URL do seu app na Vercel (preencha depois do primeiro deploy) |

**Para gerar o NEXTAUTH_SECRET:**
- Acesse: https://generate-secret.vercel.app/32
- Copie o valor gerado

### 3.4 Fazer o deploy
1. Clique em **"Deploy"**
2. Aguarde ~3 minutos enquanto a Vercel instala as dependências e faz o build
3. Quando aparecer **"Congratulations!"**, seu site está no ar!

### 3.5 Configurar NEXTAUTH_URL (pós-deploy)
1. Após o deploy, copie a URL do seu app (ex: `https://cookie-manager-abc123.vercel.app`)
2. Vá em **Settings → Environment Variables**
3. Edite `NEXTAUTH_URL` e coloque a URL copiada
4. Clique em **"Save"**
5. Vá em **Deployments** e clique em **"Redeploy"** no último deploy

---

## PARTE 4 — CONFIGURAR O BANCO DE DADOS

### 4.1 Rodar as migrações
Após o deploy, você precisa criar as tabelas no banco.

**Opção A — Via Vercel CLI (recomendado):**
1. Instale: `npm install -g vercel`
2. No terminal, dentro da pasta do projeto:
```bash
vercel login
vercel env pull .env.local
npx prisma db push
npx tsx prisma/seed.ts
```

**Opção B — Via Neon (mais simples):**
1. Acesse o painel do Neon → seu projeto
2. Vá em **"SQL Editor"**
3. Execute o schema manualmente (o arquivo `prisma/schema.prisma` define a estrutura)

**Opção C — Adicionar script no primeiro acesso:**
A Vercel executa `prisma generate` automaticamente no build.
Para criar as tabelas, adicione uma variável de ambiente temporária e acesse:
`https://SEU-APP.vercel.app/api/setup` (ver abaixo)

### 4.2 Rota de setup automático (alternativa fácil)
Acesse a URL abaixo UMA VEZ após o deploy para criar as tabelas:
```
https://SEU-APP.vercel.app/api/setup?secret=cookie2024
```

---

## PARTE 5 — PRIMEIRO ACESSO

1. Acesse seu app na Vercel
2. Faça login com:
   - **Email:** `admin@cookies.com`
   - **Senha:** `admin123`
3. 🎉 Pronto! O sistema está funcionando!

---

## 🔐 SEGURANÇA — TROQUE A SENHA PADRÃO!

Após o primeiro login, vá em **Perfil** e troque a senha `admin123` para uma senha segura.

---

## 📱 INSTALAR NO CELULAR (PWA)

**Android (Chrome):**
1. Abra o site no Chrome
2. Toque no menu (3 pontos)
3. Selecione **"Adicionar à tela inicial"**

**iPhone (Safari):**
1. Abra o site no Safari
2. Toque no ícone de compartilhar
3. Selecione **"Adicionar à Tela de Início"**

---

## 🆘 PROBLEMAS COMUNS

### "Build failed" na Vercel
- Verifique se a `DATABASE_URL` está correta
- Confirme que não há espaços nas variáveis de ambiente

### "Login não funciona"
- Verifique se `NEXTAUTH_SECRET` está configurado
- Confirme se `NEXTAUTH_URL` aponta para a URL correta do seu app

### "Banco de dados não conecta"
- Verifique se a URL do Neon inclui `?sslmode=require` no final
- Confirme que o projeto Neon está ativo (não suspenso por inatividade)

### Tabelas não foram criadas
- Execute `npx prisma db push` localmente com a `DATABASE_URL` do Neon
- Ou use a rota `/api/setup` descrita acima

---

## 📞 SUPORTE

Se tiver dúvidas, você pode:
1. Verificar os logs na Vercel: Dashboard → seu projeto → **"Logs"**
2. Verificar o banco no Neon: Dashboard → **"Tables"**

---

## 🛠️ DESENVOLVIMENTO LOCAL

Para rodar localmente:

```bash
# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Edite .env com sua DATABASE_URL do Neon

# Criar tabelas
npx prisma db push

# Popular com dados iniciais
npx tsx prisma/seed.ts

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

---

## 📁 ESTRUTURA DO PROJETO

```
src/
├── app/
│   ├── (app)/          # Páginas protegidas (requerem login)
│   │   ├── dashboard/
│   │   ├── ingredientes/
│   │   ├── receitas/
│   │   ├── producao/
│   │   ├── estoque/
│   │   ├── vendas/
│   │   ├── clientes/
│   │   ├── financeiro/
│   │   └── relatorios/
│   ├── api/            # API Routes (backend)
│   └── login/          # Página de login
├── components/         # Componentes React
├── lib/               # Utilitários (prisma, auth, etc)
└── hooks/             # React hooks
prisma/
├── schema.prisma      # Schema do banco de dados
└── seed.ts           # Dados iniciais
```

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

- [x] Login seguro com NextAuth
- [x] Dashboard com métricas em tempo real
- [x] Gestão de ingredientes com alertas de estoque
- [x] Registro de compras com cálculo de custo médio
- [x] Gestão de receitas com cálculo automático de custos
- [x] Simulador de precificação com margem de lucro
- [x] Registro de produções com baixa automática no estoque
- [x] Geração automática de lotes
- [x] Controle de validade de produtos
- [x] Carrinho de vendas com múltiplos produtos
- [x] 4 formas de pagamento
- [x] Histórico de vendas com cancelamento
- [x] Controle financeiro (receitas e despesas)
- [x] Gestão de clientes
- [x] Relatórios com gráficos (6 meses)
- [x] Interface mobile-first responsiva
- [x] PWA (instalável no celular)
- [x] Alertas de estoque baixo e validade
