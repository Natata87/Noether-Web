# Noether Web

Noether Web é o protótipo jogável em navegador do RPG **Noether**.

## Versão atual

**v0.4.1** — refinamento do Perfil & Build, quatro paletas testáveis e estrutura visual preparada para equipamentos por slot.

## Rodar localmente

Requisitos:
- Node.js LTS
- npm

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173/`.

## Build de produção

```bash
npm run build
npm run preview
```

## Estrutura do projeto

```text
src/
├─ game/
│  ├─ data/        # regras, dados e assets atuais
│  ├─ screens/     # telas do jogo
│  ├─ styles/      # identidade visual
│  └─ RPGGame.jsx  # shell e estado principal
├─ platform/       # ponte de persistência local
└─ server-ready/   # fronteira planejada para backend/multiplayer

legacy/            # snapshot do protótipo anterior à migração
```

## Organização do repositório

- `src/` — código-fonte atual
- `public/` — arquivos públicos do Vite
- `legacy/` — código legado preservado
- `docs/` — documentação técnica e de design vinculada ao jogo web
- `CHANGELOG.md` — histórico de versões seguindo SemVer

## Versionamento

O projeto usa **Versionamento Semântico (SemVer)** no formato `MAJOR.MINOR.PATCH`.

- `MAJOR`: mudanças incompatíveis ou reestruturações profundas
- `MINOR`: sistemas, telas e redesigns relevantes
- `PATCH`: correções e refinamentos compatíveis

Enquanto o jogo estiver em protótipo, as versões permanecerão em `0.x.y`.

## Direção técnica

O jogo ainda roda majoritariamente no cliente. Antes de multiplayer público, sistemas críticos como dano, XP, drops, inventário, moeda, captura e PvP deverão migrar para um backend autoritativo.

## Fluxo recomendado

- `main` — versão estável/testável
- `dev` — integração de desenvolvimento
- `feature/...` — mudanças grandes isoladas

As builds zipadas não ficam versionadas dentro do código-fonte; o histórico do Git preserva cada versão e releases podem ser usados posteriormente para distribuição.
