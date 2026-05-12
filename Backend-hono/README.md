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
