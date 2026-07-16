# Cofre de Personagens D&D

Fichas de personagem 5e (React + Vite + TypeScript) para a mesa, com painel do mestre e sync via Upstash Redis no Vercel.

## Setup local

```bash
cp .env.example .env
# edite as senhas em .env
bun install
bun run dev
```

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `VITE_PLAYER_PASSWORD` | Senha dos jogadores (cliente) |
| `VITE_ADMIN_PASSWORD` | Senha do mestre (cliente) |
| `PLAYER_PASSWORD` | Mesma senha no `/api/characters` |
| `ADMIN_PASSWORD` | Mesma senha admin no `/api/characters` |
| `UPSTASH_REDIS_REST_URL` | Redis (Marketplace Vercel) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token |

`.env` fica local e **não** é commitado. No Vercel, configure as mesmas variáveis no projeto.

## Deploy

1. Conecte o repo ao Vercel  
2. Instale **Upstash Redis** pelo Marketplace e linke ao projeto  
3. Defina as senhas nas Environment Variables  
4. Redeploy  

## Scripts

- `bun run dev` — desenvolvimento  
- `bun run build` — build de produção  
- `bun run preview` — preview do build  
