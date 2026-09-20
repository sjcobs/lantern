FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl unzip ca-certificates \
  && curl -fsSL https://cache.agilebits.com/dist/1P/op2/pkg/v2.39.0/op_linux_amd64_v2.39.0.zip -o /tmp/op.zip \
  && unzip /tmp/op.zip op -d /usr/local/bin \
  && rm /tmp/op.zip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci

EXPOSE 6346
CMD ["npm", "start"]
