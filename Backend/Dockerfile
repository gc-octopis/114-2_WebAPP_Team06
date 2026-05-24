FROM oven/bun:1.3.11

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

ENV PORT=8000

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]
