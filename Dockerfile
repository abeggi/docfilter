# ── Stage 1: build del frontend React/Vite ──────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copia solo i file di dipendenze per sfruttare la cache di layer
COPY frontend/package.json frontend/package-lock.json* ./

RUN npm ci --prefer-offline

# Copia i sorgenti e genera il bundle di produzione
COPY frontend/ ./
RUN npm run build


# ── Stage 2: runtime Python/FastAPI ─────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Metadati
LABEL maintainer="DocFilter" \
      description="DocFilter – filtro template Word basato su struttura titoli"

# Variabili d'ambiente Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/opt/docfilter

WORKDIR $APP_HOME

# Installa le dipendenze Python
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r backend/requirements.txt

# Copia il codice del backend
COPY backend/ ./backend/

# Copia il frontend già compilato dallo stage precedente
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Cartella per i file caricati dagli utenti
RUN mkdir -p backend/data

# Espone la porta su cui uvicorn ascolterà
EXPOSE 8000

# Avvio dell'applicazione
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
