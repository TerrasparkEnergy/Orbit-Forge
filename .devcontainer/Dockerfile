# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

# Build arguments
ARG TZ=UTC

# Set timezone
ENV TZ="$TZ"

# Set DEVCONTAINER environment variable for orientation
ENV DEVCONTAINER=true

# Install system dependencies including dev tools and network utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    sudo \
    ca-certificates \
    ripgrep \
    fd-find \
    jq \
    tree \
    less \
    procps \
    fzf \
    zsh \
    man-db \
    unzip \
    nano \
    vim \
    iptables \
    ipset \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user with passwordless sudo
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
        groupmod --gid $USER_GID node \
        && usermod --uid $USER_UID --gid $USER_GID node \
        && chown -R $USER_UID:$USER_GID /home/node; \
    fi \
    && echo "$USERNAME ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Create command history directory
RUN mkdir -p /commandhistory \
    && touch /commandhistory/.bash_history \
    && chown -R $USERNAME:$USERNAME /commandhistory

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Copy and set up firewall script
COPY init-firewall.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-firewall.sh \
    && echo "$USERNAME ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall \
    && chmod 0440 /etc/sudoers.d/node-firewall

# Switch to non-root user
USER $USERNAME

# Set default shell and editor
ENV SHELL=/bin/bash
ENV EDITOR=nano
ENV VISUAL=nano

# Configure bash history persistence
RUN echo 'export HISTFILE=/commandhistory/.bash_history' >> ~/.bashrc \
    && echo 'export PROMPT_COMMAND="history -a"' >> ~/.bashrc \
    && echo 'export HISTSIZE=10000' >> ~/.bashrc \
    && echo 'export HISTFILESIZE=10000' >> ~/.bashrc

# Install zsh with productivity plugins
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/deluan/zsh-in-docker/master/zsh-in-docker.sh)" -- \
    -p git \
    -p fzf \
    -a "export HISTFILE=/commandhistory/.zsh_history" \
    -a "export PROMPT_COMMAND='history -a'" || true

# Set working directory
WORKDIR /workspaces/terraspark/Orbit-Forge
