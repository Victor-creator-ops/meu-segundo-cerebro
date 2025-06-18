# Meu Segundo Cérebro 🧠

![Status do Projeto](https://img.shields.io/badge/status-ativo-brightgreen)

"Meu Segundo Cérebro" é uma aplicação web construída com React e Firebase, projetada para ser um sistema de gerenciamento de conhecimento pessoal. Ele permite que os usuários capturem, conectem e cultivem suas ideias, transformando anotações dispersas em uma poderosa base de conhecimento interligada, no estilo de uma wiki pessoal.

## ✨ Funcionalidades Principais

- **Wiki Pessoal**: Crie e edite artigos que se interligam, formando uma rede de conhecimento.
- **Notas Rápidas**: Um espaço para capturar ideias e pensamentos que podem ou não se tornar artigos completos.
- **Conexões Automáticas**: A aplicação identifica automaticamente menções a outros artigos dentro de suas notas, ajudando a visualizar conexões.
- **Autenticação Segura**: Gerenciamento de usuários via Firebase Authentication.
- **Persistência de Dados em Tempo Real**: Todas as suas notas e artigos são salvos instantaneamente no Firestore.
- **Tema Claro e Escuro**: Adapte a interface para sua preferência visual.

## 🚀 Tecnologias Utilizadas

- **React**: Biblioteca principal para a construção da interface de usuário.
- **Firebase**: Backend completo, incluindo Autenticação e banco de dados NoSQL (Firestore).
- **Tailwind CSS**: Framework de CSS para estilização rápida e responsiva.
- **React Quill**: Editor de texto rico (WYSIWYG) para a criação de artigos e notas.

## 🛠️ Guia de Instalação e Execução Local

Siga estes passos para configurar e executar o projeto em um novo ambiente de desenvolvimento.

### 1. Pré-requisitos

- **Node.js**: É essencial ter o Node.js instalado. Recomenda-se a versão LTS. Baixe em [nodejs.org](https://nodejs.org/).

### 2. Configuração Crítica do Firebase

A aplicação não funcionará sem uma configuração correta do Firebase.

1.  **Crie um Projeto no Firebase**: Acesse o [console do Firebase](https://console.firebase.google.com/) e crie um novo projeto.
2.  **Crie um Aplicativo Web**: Dentro do projeto, clique no ícone `</>` para adicionar um aplicativo da web. Ao final, copie o objeto de configuração `firebaseConfig`.
3.  **Habilite a Autenticação**: No menu lateral, vá para **Authentication** -> **Sign-in method** e habilite o provedor **"E-mail/senha"**.
4.  **Crie um Usuário**: Na aba **Users** da mesma seção, adicione um usuário com um e-mail e senha que você usará para fazer login.
5.  **Cole a Configuração no Código**: No arquivo `src/App.js`, encontre a constante `firebaseConfig` e substitua seu valor pelo objeto que você copiou do painel.

### 3. Instalação (Windows com PowerShell)

É fortemente recomendado executar estes comandos em um terminal **PowerShell aberto como Administrador**.

1.  **Permitir Execução de Scripts**:
    Este passo é necessário apenas uma vez por máquina para permitir que o `npm` funcione corretamente.

    ```powershell
    Set-ExecutionPolicy RemoteSigned
    ```

    Quando solicitado, digite `S` e pressione `Enter`.

2.  **Navegue até a Pasta do Projeto**:
    Use o comando `cd` para entrar no diretório onde você salvou os arquivos.

    ```powershell
    cd "C:\caminho\para\seu\projeto"
    ```

3.  **Instale as Dependências**:
    Este comando instala todos os pacotes necessários. A flag `--legacy-peer-deps` é **obrigatória** para resolver um conflito de versão entre as bibliotecas do projeto.

    ```powershell
    npm install --legacy-peer-deps
    ```

4.  **Configure o Tailwind CSS**:
    Crie os arquivos de configuração do Tailwind:
    ```powershell
    npx tailwindcss init -p
    ```
    - **Abra `tailwind.config.js`** e substitua o conteúdo por:
      ```javascript
      /** @type {import('tailwindcss').Config} */
      module.exports = {
        content: ["./src/**/*.{js,jsx,ts,tsx}"],
        theme: { extend: {} },
        plugins: [],
      };
      ```
    - **Abra `src/index.css`**, apague tudo e adicione:
      ```css
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
      ```
    - **Abra `src/index.js`** e garanta que `import './index.css';` esteja no topo.

### 4. Executando o Projeto

Após a instalação, inicie o servidor de desenvolvimento:

```bash
npm start
```

A aplicação será aberta em `http://localhost:3000`. Use as credenciais do Firebase que você criou para fazer login.

## 📦 Deploy

Para publicar sua aplicação, siga estes passos:

1.  **Gere a Build de Produção**:
    ```bash
    npm run build
    ```
2.  **Publique a Pasta `build`**:
    A maneira mais fácil é usar um serviço de hospedagem para sites estáticos como [Vercel](https://vercel.com/) ou [Netlify](https://www.netlify.com/). Basta criar uma conta gratuita e arrastar a pasta `build` inteira para a interface deles.

---

Feito com ❤️ por [Seu Nome/Apelido]
