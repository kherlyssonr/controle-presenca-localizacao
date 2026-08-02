# Presença Inteligente — v1.0.0

Sistema de controle de presença por localização desenvolvido como um MVP full stack para registrar a presença de alunos por geolocalização e permitir o acompanhamento diário por supervisores.

> **Status da versão:** MVP funcional em ambiente local. A interface oficial de login está em fase de integração; durante os testes, pode ser utilizada a página temporária `login-teste.html`.

---

## Objetivo

A versão `v1.0.0` foi criada para validar, em um teste prático:

- o uso da plataforma pelos alunos;
- a obtenção da localização pelo navegador;
- a validação de distância e precisão;
- a confiabilidade do registro de presença;
- o acompanhamento diário pelo supervisor;
- a usabilidade em computadores e celulares.

A proposta desta versão é entregar um sistema pequeno, funcional e adequado para apresentação e testes reais.

---

## Perfis de acesso

O sistema possui dois perfis:

### Aluno

O aluno pode:

- entrar com e-mail e senha;
- visualizar nome e matrícula;
- consultar o status da presença do dia;
- permitir o acesso à localização;
- registrar a própria presença;
- visualizar data e horário do registro;
- sair da conta.

### Supervisor

O supervisor pode:

- entrar com e-mail e senha;
- visualizar a quantidade de alunos cadastrados;
- visualizar quantos registraram presença;
- visualizar quantos ainda não registraram;
- consultar a lista diária;
- pesquisar por nome ou matrícula;
- adicionar uma presença manualmente;
- corrigir um registro;
- informar uma justificativa obrigatória;
- exportar o relatório diário em CSV;
- sair da conta.

---

## Fluxo de registro de presença

Ao clicar em **Marcar presença**, o sistema:

1. verifica se o aluno está autenticado;
2. verifica se já existe uma presença no dia;
3. solicita a localização do dispositivo;
4. recebe latitude, longitude e precisão;
5. envia os dados para o backend;
6. calcula a distância até a instituição;
7. valida o raio permitido;
8. valida a precisão da localização;
9. registra a presença no PostgreSQL;
10. atualiza o status exibido ao aluno.

A presença é recusada quando:

- a localização é negada;
- o navegador não consegue obter a posição;
- a precisão está fora do limite;
- o aluno está fora do raio permitido;
- já existe um registro no mesmo dia;
- a sessão está inválida.

---

## Funcionalidades da v1.0.0

- autenticação com JWT;
- controle de acesso por perfil;
- senhas protegidas com hash;
- registro de presença por geolocalização;
- cálculo de distância no backend;
- validação de precisão;
- horário definido pelo servidor;
- bloqueio de presença duplicada;
- painel diário do supervisor;
- pesquisa por nome ou matrícula;
- presença manual com justificativa;
- correção de horário;
- exportação de relatório CSV;
- persistência no PostgreSQL;
- layout responsivo para computador, tablet e celular.

---

## Tecnologias

### Frontend

- HTML5;
- CSS3;
- JavaScript;
- Vite;
- Fetch API;
- Geolocation API.

### Backend

- Node.js;
- Express;
- JSON Web Token;
- bcryptjs;
- CORS;
- dotenv.

### Banco de dados

- PostgreSQL;
- biblioteca `pg`.

### Ferramentas

- VS Code;
- Git;
- GitHub;
- pgAdmin 4;
- PowerShell.

---

## Estrutura do projeto

```text
controle-presenca-localizacao/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── docs/
│
├── frontend/
│   ├── aluno.html
│   ├── supervisor.html
│   ├── login-teste.html
│   ├── src/
│   │   ├── css/
│   │   └── js/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

A estrutura pode apresentar pequenas diferenças conforme a organização atual do repositório.

---

## Banco de dados

A versão utiliza as tabelas:

### `usuarios`

Armazena:

- nome;
- e-mail;
- hash da senha;
- tipo de usuário;
- situação da conta;
- data de criação.

### `alunos`

Armazena:

- usuário relacionado;
- matrícula;
- data de criação.

### `presencas`

Armazena:

- aluno;
- data;
- horário;
- precisão;
- distância aproximada;
- tipo de registro;
- justificativa;
- supervisor responsável;
- data de criação.

### `instituicao`

Armazena:

- nome;
- latitude;
- longitude;
- raio permitido;
- precisão máxima aceita.

O banco impede duas presenças do mesmo aluno no mesmo dia por meio da restrição:

```sql
UNIQUE (aluno_id, data)
```

---

## Pré-requisitos

Antes de executar o projeto, instale:

- Node.js;
- PostgreSQL;
- Git;
- pgAdmin 4 opcional.

---

## Configuração do banco

Crie o banco:

```sql
CREATE DATABASE controle_presenca;
```

Depois, execute o arquivo:

```text
database/schema.sql
```

Isso pode ser feito pelo Query Tool do pgAdmin 4 ou pelo terminal:

```bash
psql -U postgres -d controle_presenca -f database/schema.sql
```

Cadastre os usuários de teste por script, pelo Query Tool ou diretamente no banco.

As senhas devem ser armazenadas como hash do `bcrypt`. Nunca salve a senha original no campo `senha_hash`.

---

## Variáveis de ambiente

### Backend

Crie:

```text
backend/.env
```

Exemplo:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=controle_presenca
DB_USER=postgres
DB_PASSWORD=sua_senha

JWT_SECRET=uma_chave_secreta_segura
JWT_EXPIRES_IN=8h

FRONTEND_URL=http://localhost:5173
```

### Frontend

Crie:

```text
frontend/.env
```

Exemplo:

```env
VITE_API_URL=http://localhost:3000
```

O arquivo `.env` não deve ser enviado ao GitHub. Utilize `.env.example` para documentar as variáveis necessárias.

---

## Como executar

### 1. Backend

Abra um terminal:

```bash
cd backend
npm install
npm run dev
```

O backend ficará disponível em:

```text
http://localhost:3000
```

### 2. Frontend

Abra outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará disponível em:

```text
http://localhost:5173
```

Durante a fase de testes, acesse:

```text
http://localhost:5173/login-teste.html
```

Quando o login oficial for integrado, o acesso principal deverá ser realizado por:

```text
http://localhost:5173
```

---

## Redirecionamento por perfil

Após o login:

```text
ALUNO → /aluno.html
SUPERVISOR → /supervisor.html
```

As páginas verificam o token salvo na sessão e bloqueiam o acesso quando o usuário não está autenticado ou possui um perfil diferente.

---

## Rotas principais da API

### Autenticação

```http
POST /auth/login
GET  /auth/me
```

### Aluno

```http
GET  /aluno/painel
GET  /aluno/presenca-hoje
POST /aluno/presencas
```

### Supervisor

```http
GET   /supervisor/painel
GET   /supervisor/resumo-hoje
GET   /supervisor/alunos-hoje
POST  /supervisor/presencas-manuais
PATCH /supervisor/presencas/:presencaId
GET   /supervisor/relatorio-hoje.csv
```

As rotas protegidas exigem:

```http
Authorization: Bearer TOKEN_JWT
```

---

## Configuração da instituição

Na `v1.0.0`, a localização da instituição é configurada diretamente no banco.

Exemplo:

```sql
UPDATE instituicao
SET
  latitude = -00.000000,
  longitude = -00.000000,
  raio_permitido = 100,
  precisao_maxima = 50
WHERE id = 1;
```

Ajuste os valores de acordo com o local utilizado no teste.

---

## Relatório CSV

O supervisor pode exportar o relatório diário contendo:

- nome;
- matrícula;
- data;
- horário;
- status;
- tipo de registro;
- justificativa.

Tipos de registro:

```text
AUTOMATICO
MANUAL
```

O arquivo pode ser aberto no Excel, Google Planilhas ou LibreOffice.

---

## Privacidade da localização

A localização é solicitada somente quando o aluno tenta registrar a presença.

A versão `v1.0.0` não precisa armazenar permanentemente a latitude e a longitude exatas do aluno. O sistema pode armazenar:

- distância aproximada;
- precisão informada pelo navegador;
- resultado da validação.

O sistema não acompanha a localização continuamente.

---

## Segurança

A versão implementa:

- hash de senhas;
- autenticação com JWT;
- autorização por perfil;
- variáveis de ambiente;
- validação no backend;
- bloqueio de duplicidade no banco;
- proteção das rotas de aluno e supervisor.

Este é um MVP educacional e ainda deve passar por revisão de segurança antes de qualquer uso oficial em produção.

---

## Aviso

Este projeto foi desenvolvido para estudo, portfólio, apresentação e validação de um MVP.

Antes de utilizar o sistema em uma instituição real, é necessário revisar segurança, privacidade, infraestrutura, proteção de dados e regras internas da organização.

---

## Autor

Desenvolvido por **Kherlysson Ryann** e **Webert Kaue**.
