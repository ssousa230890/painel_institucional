# Painel institucional — B Adm Ap/CMP

Aplicação web para exibição de informações institucionais da B Adm Ap/CMP, com painel público e área administrativa. Reúne agenda, autoridades, aniversariantes, informativos, situação do dia e guarnição de serviço.

O painel recebe atualizações por Server-Sent Events (SSE), com consultas periódicas como alternativa.

## Funcionalidades

- Painel público acessível sem autenticação.
- Gestão da agenda e dos aniversariantes.
- Edição de informativos, REU, formatura, TFM e guarnição de serviço.
- Exibição de autoridades com foto, posto, cargo e destino.
- Administração de usuários com controle de acesso por perfil.
- Autenticação com JWT e senhas armazenadas com hash bcrypt.

## Perfis de acesso

| Acesso | Permissões |
| --- | --- |
| Público | Visualizar o painel institucional sem login. |
| `secretario` | Gerenciar agenda, aniversariantes, configurações do painel e destino das autoridades. |
| `admin` | Todas as permissões do secretário e gerenciamento de usuários. |

Existem dois perfis autenticados: `admin` e `secretario`. O acesso público não exige cadastro.

## Tecnologias

- **Frontend:** React 18, Vite 5 e Axios.
- **Backend:** Node.js, Express, JWT e bcryptjs.
- **Banco de dados:** MySQL, com acesso pelo mysql2.

## Requisitos

- Node.js 20 ou superior e npm.
- MySQL 8 ou ambiente MariaDB compatível com o script SQL.
- Cliente MySQL para inicializar o banco.

Execute os comandos a seguir na raiz da cópia local do repositório, exceto quando indicado.

## Instalação

### 1. Instalar as dependências

```bash
npm ci
npm --prefix frontend ci
```

### 2. Configurar o ambiente

Copie `.env.example` para `.env` na raiz e `frontend/.env.example` para `frontend/.env`.

No PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
```

No Linux ou macOS:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Configure o `.env` da raiz:

| Variável | Descrição | Valor de referência |
| --- | --- | --- |
| `PORT` | Porta HTTP do backend. | `3000` |
| `DB_HOST` | Endereço do MySQL. | `localhost` |
| `DB_PORT` | Porta do MySQL. | `3306` |
| `DB_USER` | Usuário do banco. | Usuário com acesso à base |
| `DB_PASSWORD` | Senha do banco. | Senha definida no MySQL |
| `DB_NAME` | Nome do banco. | `painel_cmp` |
| `JWT_SECRET` | Chave de assinatura dos tokens. | Chave aleatória e privada |

No arquivo `frontend/.env`, mantenha `VITE_API_URL=` vazio para usar os endereços padrão:

- Em desenvolvimento, o frontend consulta `http://localhost:3000`.
- No build de produção, o frontend consulta a mesma origem em que foi aberto.

Defina `VITE_API_URL` quando a API estiver em outro endereço ou porta. Essa configuração é incorporada ao build: após alterá-la em produção, gere o frontend novamente. Variáveis `VITE_*` ficam disponíveis no navegador; não inclua segredos nelas.

### 3. Inicializar o banco

Abra o cliente MySQL com um usuário autorizado a criar o banco e as tabelas:

```bash
mysql -u root -p
```

Dentro do cliente, execute:

```sql
SOURCE sql/init.sql;
```

O caminho é relativo ao diretório de onde o cliente foi aberto. Se necessário, use o caminho absoluto do arquivo, com barras `/`.

O script cria e seleciona o banco `painel_cmp`, cria as tabelas e insere dados iniciais. Se escolher outro `DB_NAME`, ajuste também o nome do banco no script.

> Use esse script para a instalação inicial. Ele também atualiza registros, redefine as senhas dos usuários iniciais e remove determinados dados de autoridades e aniversariantes. Faça backup e revise o SQL antes de executá-lo em um banco existente.

### 4. Acessar as contas iniciais

| Usuário | Senha inicial | Perfil |
| --- | --- | --- |
| `admin` | `Admin@123` | Administrador |
| `secretario` | `Secretario@123` | Secretário |

Altere essas senhas pela gestão de usuários da conta administrativa antes de disponibilizar a aplicação em rede. Configure também uma chave própria em `JWT_SECRET`.

## Desenvolvimento

Inicie backend e frontend juntos:

```bash
npm run dev:all
```

| Serviço | Endereço padrão |
| --- | --- |
| Painel público | http://localhost:5173/ |
| Área administrativa | http://localhost:5173/admin |
| API | http://localhost:3000 |
| Verificação HTTP do backend | http://localhost:3000/health |

O Vite pode selecionar outra porta se `5173` estiver ocupada; confira o endereço mostrado no terminal.

Para executar separadamente, use `npm run dev` em um terminal e `npm run frontend:dev` em outro. O comando do backend executa `node server.js`; alterações no código exigem reiniciar o processo.

## Produção

Com as dependências, o ambiente e o banco configurados:

```bash
npm run frontend:build
npm start
```

O Express serve o build de `frontend/dist/` e a API na mesma porta:

- Painel público: `http://localhost:3000/`
- Área administrativa: `http://localhost:3000/admin`

Substitua `localhost` pelo endereço do servidor para acesso em rede e ajuste a porta conforme `PORT`. Para disponibilização pública, configure HTTPS no proxy reverso e utilize um usuário de banco com permissões limitadas à aplicação.

O endpoint `/health` confirma que o processo HTTP responde; ele não valida a conexão com o MySQL. Confira também os logs do backend e o funcionamento das operações que persistem dados.

## Estrutura do projeto

```text
painel_base/
├── frontend/
│   ├── src/
│   │   ├── pages/       # Painel público, login e administração
│   │   └── services/    # Cliente da API
│   └── vite.config.js
├── middleware/         # Autenticação e permissões
├── public/             # Logos e fotos das autoridades
├── routes/             # Rotas da API
├── sql/                # Inicialização e scripts do banco
├── .env.example        # Modelo de configuração do backend
├── db.js               # Pool de conexões MySQL
└── server.js           # Servidor Express e arquivos estáticos
```

## API principal

As rotas protegidas recebem o token retornado pelo login no cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Acesso / finalidade |
| --- | --- | --- |
| `GET` | `/health` | Público; estado do servidor HTTP. |
| `POST` | `/auth/login` | Autenticação com `username` e `senha`. |
| `GET` | `/public/painel` | Público; dados agregados do painel. |
| `GET` | `/public/stream` | Público; fluxo de atualizações SSE. |
| `GET` | `/agenda` | Público; consulta da agenda. |
| `POST` | `/agenda` | Admin ou secretário; criação. |
| `PUT`, `DELETE` | `/agenda/:id` | Admin ou secretário; edição ou exclusão. |
| `GET` | `/autoridades` | Público; consulta das autoridades. |
| `PUT`, `PATCH` | `/autoridades/:id` | Admin ou secretário; atualização do destino. |
| `GET`, `POST` | `/aniversariantes` | Admin ou secretário; consulta ou criação. |
| `PUT`, `DELETE` | `/aniversariantes/:id` | Admin ou secretário; edição ou exclusão. |
| `GET`, `PUT` | `/painel-config` | Admin ou secretário; consulta ou edição. |
| `GET`, `POST` | `/users` | Admin; consulta ou criação de usuários. |
| `PUT`, `DELETE` | `/users/:id` | Admin; edição ou exclusão de usuários. |

## Personalização

### Autoridades e fotos

As listas de autoridades são definidas em `routes/autoridades.js` e `routes/public.js`. Ao alterar os cadastros, mantenha `AUTHORITY_ROSTER`, `DEFAULT_AUTHORITY_PHOTOS` e a sincronização em `ensureAuthorityRoster()` coerentes nos dois arquivos e atualize os dados iniciais em `sql/init.sql`.

As rotas sincronizam os cadastros ao serem consultadas. Uma alteração apenas no banco pode ser sobrescrita por essa sincronização.

Coloque as fotos em `public/autoridades/`, com nomes iguais aos configurados em `foto_url`, respeitando maiúsculas, minúsculas e extensão. O campo também aceita uma URL completa. Os arquivos locais ficam disponíveis em `/midia/autoridades/<arquivo>`.

Inclua os arquivos de foto correspondentes ao adaptar a lista: o código pode referenciar imagens que ainda não estejam presentes na pasta. Após alterar o backend, reinicie o processo.

### Logos

Coloque as imagens na pasta `public/`. O frontend tenta os nomes abaixo na ordem indicada:

| Imagem | Nomes aceitos, em ordem de prioridade |
| --- | --- |
| Base | `logo-base.png`, `logo-base.jpg`, `base-logo.png`, `base-logo.jpg`, `brasao-base.png`, `brasao-base.jpg` |
| Exército Brasileiro | `logo-exercito.png`, `logo-exercito.jpg`, `exercito-logo.png`, `exercito-logo.jpg`, `logo-eb.png`, `logo-eb.jpg` |

Exemplo de acesso: `http://localhost:3000/midia/logo-base.png`.

## Solução de problemas

| Sintoma | O que verificar |
| --- | --- |
| Falha de conexão com o MySQL | Serviço do banco, credenciais, porta e existência da base configurada no `.env`. |
| Frontend não encontra a API | Endereço de `VITE_API_URL`, porta do backend e novo build após alterar variáveis do frontend. |
| Página indisponível ao executar `npm start` | Execute `npm run frontend:build` e confirme que existe `frontend/dist/index.html`. |
| Foto ou logo não carrega | Nome, extensão, permissões e acesso direto ao arquivo em `/midia/`. |
| Dados antigos após uma atualização | Reinício do backend, diretório da aplicação em execução e endereço da API usado pelo navegador. |

## Antes de publicar no GitHub

O `.gitignore` atual exclui `.env`, `frontend/.env`, dependências e o build do frontend. Revise também os arquivos selecionados para publicação:

- Preserve os modelos `.env.example` sem credenciais reais.
- Exclua logs, arquivos de distribuição e backups que possam conter dados do ambiente.
- Revise documentos operacionais locais, como `MEMENTO_ATUALIZACAO_AUTORIDADES.md`, que contêm informações de infraestrutura.
- Confirme a autorização para divulgar nomes, fotos, símbolos e demais dados institucionais presentes no código, nas imagens e nos scripts SQL.
- Escolha e adicione uma licença caso pretenda permitir reutilização e distribuição por terceiros. O projeto ainda não possui arquivo `LICENSE`.
