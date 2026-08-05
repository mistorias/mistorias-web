FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.8.1

WORKDIR /workspace

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4321

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
