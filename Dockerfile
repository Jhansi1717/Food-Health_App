FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY tsconfig.json* ./
COPY artifacts/nourish/package.json ./artifacts/nourish/

RUN pnpm install --frozen-lockfile || pnpm install

COPY artifacts/nourish ./artifacts/nourish

WORKDIR /app/artifacts/nourish
RUN pnpm exec expo export --platform web --output-dir dist

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/artifacts/nourish/dist /usr/share/nginx/html

RUN printf 'server {\n\
    listen       8080;\n\
    server_name  _;\n\
    root   /usr/share/nginx/html;\n\
    index  index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
