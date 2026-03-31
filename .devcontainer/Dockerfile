FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# Extra packages useful for browser-focused frontend debugging and native npm modules.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*
