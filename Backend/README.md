# backend-hono

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

To sync data directly into the Hono SQLite database:

```bash
bun run sync:calendar-en
bun run sync:calendar-zh
bun run sync:announcements
bun run sync:links

# or run everything in sequence
bun run sync:all

# 如果沒有啟動 Ollama，可跳過 embeddings
SKIP_EMBEDDINGS=1 bun run sync:links
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Docker

To build the Docker image:

```bash
docker build -t myntupp-backend:latest .
```

To run the container:

```bash
# Minimal: port 8000 only
docker run --rm -p 8000:8000 myntupp-backend:latest

# With Redis URL (for session support):
docker run --rm -p 8000:8000 \
  -e REDIS_URL=redis://redis:6379/0 \
  myntupp-backend:latest

# With email configuration:
docker run --rm -p 8000:8000 \
  -e REDIS_URL=redis://redis:6379/0 \
  -e EMAIL_HOST_USER=yourname \
  -e EMAIL_HOST_PASSWORD=yourpass \
  -e ADMIN_EMAIL=admin@ntu.edu.tw \
  myntupp-backend:latest
```

Environment variables (all optional):
- `PORT`: Server port (default: 8000)
- `REDIS_URL`: Redis connection URL (default: redis://127.0.0.1:6379/0)
- `OLLAMA_URL`: Ollama service URL (default: http://localhost:11434)
- `EMBED_MODEL`: Embedding model name (default: all-minilm)
- `EMAIL_HOST`: Email SMTP host (default: smtps.ntu.edu.tw)
- `EMAIL_PORT`: Email SMTP port (default: 465)
- `EMAIL_HOST_USER`: Email username
- `EMAIL_HOST_PASSWORD`: Email password
- `ADMIN_EMAIL`: Admin email address for contact form
