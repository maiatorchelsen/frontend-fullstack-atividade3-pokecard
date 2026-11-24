# PokéVault TCG

Aplicação frontend para cadastro e gerenciamento de uma coleção de cartas Pokémon TCG. O projeto permite criar uma conta, autenticar-se, cadastrar cartas, consultar cartas em português no catálogo TCGdex, atualizar quantidades e acompanhar os totais da coleção.

## Funcionalidades

- Cadastro e login de treinadores
- Autenticação por token JWT
- Rotas protegidas
- Listagem da coleção de cartas
- Busca por nome, tipo e raridade
- Cadastro, edição e exclusão de cartas
- Alteração da quantidade de cada carta
- Resumo com total físico, cartas únicas e valor estimado
- Pesquisa no catálogo TCGdex em português para preencher os dados da carta
- Interface responsiva com animações

## Tecnologias

- React 18
- TypeScript
- Vite
- React Router DOM
- Framer Motion
- TCGdex API
- Fetch API

## Pré-requisitos

- Node.js 18 ou superior
- npm
- Uma API backend compatível com os endpoints descritos abaixo

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/maiatorchelsen/frontend-fullstack-atividade3-pokecard.git
cd frontend-fullstack-atividade3-pokecard
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows, você também pode copiar manualmente o arquivo `.env.example` e renomeá-lo para `.env`.

## Configuração

As variáveis de ambiente disponíveis estão em `.env.example`:

```env
VITE_API_URL=https://backend-fullstack-atividade3-pokecard.onrender.com
```

- `VITE_API_URL`: endereço base da API backend.

Para desenvolvimento com um backend local, altere o valor para `http://localhost:3000`. No Vercel, configure `VITE_API_URL` com a URL pública do backend nas variáveis de ambiente e faça um novo deploy.

A busca de cartas usa a [API TCGdex](https://tcgdex.dev/pt-br), configurada para português (`pt`).

O token e os dados do usuário autenticado são armazenados no `localStorage` do navegador.

## Executando o projeto

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

Certifique-se de que a API backend esteja executando no endereço configurado em `VITE_API_URL`.

## Scripts disponíveis

```bash
npm run dev      # inicia o servidor de desenvolvimento
npm run build    # gera a versão de produção
npm run preview  # executa localmente a versão compilada
```

## Build de produção

```bash
npm run build
npm run preview
```

Os arquivos otimizados são gerados no diretório `dist`.

## Integração com o backend

A aplicação espera os seguintes endpoints:

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/auth/register` | Cadastra um usuário |
| `POST` | `/auth/login` | Autentica e retorna token e usuário |
| `GET` | `/cartas` | Lista as cartas |
| `GET` | `/cartas/resumo` | Retorna o resumo da coleção |
| `POST` | `/cartas` | Cadastra uma carta |
| `PUT` | `/cartas/:id` | Atualiza uma carta |
| `DELETE` | `/cartas/:id` | Remove uma carta |

As rotas autenticadas recebem o token no cabeçalho:

```http
Authorization: Bearer <token>
```

## Estrutura do projeto

```text
src/
├── components/       # Componentes visuais e modais
├── contexts/         # Contexto de autenticação
├── pages/            # Páginas de login e dashboard
├── services/         # Comunicação com APIs
├── types/            # Tipagens TypeScript
├── App.tsx           # Configuração de rotas
├── main.tsx          # Inicialização da aplicação
└── styles.css        # Estilos globais
```
