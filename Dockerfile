FROM node:22-alpine

WORKDIR /app
COPY . .

VOLUME /app

RUN corepack enable && corepack prepare pnpm@latest

RUN pnpm install --frozen-lockfile

EXPOSE 17091-17095/udp
EXPOSE 3000-3001/udp

# RUN chmod +x /app/.cache/bin/mkcert

CMD ["pnpm", "dev"]