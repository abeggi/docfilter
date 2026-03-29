<p align="center">
  <img src="assets/banner.png" alt="DocFilter Banner" width="100%">
</p>

# 📑 DocFilter

**DocFilter** è un'applicazione web full-stack progettata per filtrare documenti Microsoft Word (`.docx`) in modo intelligente, basandosi sulla loro struttura gerarchica (titoli e capitoli).

L'obiettivo principale di DocFilter è permettere agli utenti di selezionare specifici capitoli da un template complesso e generare un nuovo documento che mantenga **fedelmente** tutta la formattazione originale.

---

## ✨ Caratteristiche Principali

- 🌳 **Visualizzazione ad Albero**: Carica un template e naviga tra i capitoli usando un'interfaccia interattiva.
- 🎯 **Filtraggio Selettivo**: Scegli esattamente quali sezioni includere nel documento finale.
- 🎨 **Preservazione del Layout**: Mantiene stili, margini, intestazioni (headers), piè di pagina (footers) e immagini originali.
- 🔄 **Rigenerazione Sommario**: Il sommario (Table of Contents) viene aggiornato automaticamente per riflettere la nuova struttura.
- 🚀 **Performance elevate**: Backend basato su FastAPI per un'elaborazione rapida dei documenti.

---

## 🛠️ Stack Tecnologico

- **Backend**: Python 3.10+ con **FastAPI**
- **Document Processing**: `python-docx`
- **Frontend**: **React** + **Vite**
- **Deployment**: Local Service (Ubuntu) / Docker

---

## 🚀 Iniziare

Per istruzioni dettagliate su come installare e configurare l'ambiente, consulta la nostra guida completa:

👉 [**Guida all'Installazione (INSTALL.md)**](INSTALL.md)

### Avvio rapido (se già configurato)

```bash
# Avvia l'applicazione
./docfilter.sh start

# L'app sarà disponibile su http://localhost:8000
```

---

## 📂 Struttura del Progetto

```text
.
├── assets/               # Asset grafici e banner
├── backend/              # Logica API e processing documenti
│   ├── routers/          # Endpoint API
│   ├── services/         # Business logic (docx processing)
│   └── main.py           # Entrypoint FastAPI
├── frontend/             # Interfaccia utente React
│   ├── src/              # Sorgenti del frontend
│   └── dist/             # Build di produzione
├── docfilter.sh          # Script di gestione (start/stop)
├── docfilter.service     # Configurazione per systemd
└── INSTALL.md            # Documentazione tecnica completa
```

---

<p align="center">
  Realizzato con ❤️ per semplificare la gestione dei documenti tecnici.
</p>
