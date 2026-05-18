# nestjs-ai-starter

Production-leaning NestJS API for AI workloads: pluggable OpenAI/Anthropic chat, Redis/BullMQ jobs, JWT machine auth, throttling, structured logging, OpenAI embeddings + in-memory vector search, and signed outbound webhooks (with an optional inbound receiver).

## Quick start

1. **Setup Environment:**
   ```bash
   cp .env.example .env
   ```

2. **Generate Secrets:**
   Run this command 3 times and paste a unique output for `JWT_SECRET`, `SERVICE_TOKEN`, and `WEBHOOK_SIGNING_SECRET` into your `.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Install & Run:**
   ```bash
   npm install
   docker compose up -d redis
   npm run start:dev
   ```

- **Health:** `GET http://localhost:3000/health`
- **OpenAPI / client generation:** `GET http://localhost:3000/docs` and `GET http://localhost:3000/docs-json` (use with `openapi-typescript`, OpenAPI Generator, etc.)
- **Auth:** `POST http://localhost:3000/v1/auth/token` with header `x-service-token: <SERVICE_TOKEN>` → Bearer JWT for secured routes.

## Features (where to look)

| Area | Path |
| --- | --- |
| LLM abstraction + routing | `src/ai` |
| BullMQ queues | `src/queue`, processors in `src/queue` / `src/webhooks` |
| JWT + global guard + `@Public()` | `src/auth`, `src/common/decorators/public.decorator.ts` |
| Rate limiting | `ThrottlerModule` + `ThrottlerGuard` in `src/app.module.ts` |
| Pino HTTP logging | `LoggerModule` in `src/app.module.ts`, `nestjs-pino` |
| Embeddings / vectors | `src/vector` (OpenAI embeddings; cosine search in memory) |
| Webhooks | `src/webhooks` (`ai.chat.completed` after async jobs) |
| Docker | `Dockerfile`, `docker-compose.yml` |
| Kubernetes | `kubernetes/` |

## Docker (API + Redis)

```bash
cp .env.example .env
docker compose up --build
```

## Kubernetes

Edit `kubernetes/secret.yaml`, build/push `nestjs-ai-starter:latest`, then:

```bash
kubectl apply -f kubernetes/
```

Redis manifest is included for a single-node dev-style cluster; swap for a managed Redis in real environments.
