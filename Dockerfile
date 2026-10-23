# ==========================================
# Stage 1: Build Next.js Frontend
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

ENV NEXT_TELEMETRY_DISABLED=1

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci || npm install

# Copy frontend source and build standalone bundle
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV BACKEND_INTERNAL_URL=http://127.0.0.1:8000

# Install system dependencies for OpenCASCADE, OpenGL, wget (for Coolify healthcheck), and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    wget \
    libgl1 \
    libglx-mesa0 \
    libegl1 \
    libgomp1 \
    procps \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /root/.npm

# Install Python backend dependencies (novtk minimal runtime without VTK bloat or NumPy 2 conflicts)
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt \
    && pip install --no-cache-dir --no-deps build123d==0.7.0 cadquery>=2.7.0 \
    && (find /usr/local/lib/python3.11 -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true) \
    && rm -rf /root/.cache

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontend standalone server and static assets
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend-dist
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend-dist/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend-dist/public

# Copy startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

CMD ["/app/docker-entrypoint.sh"]
