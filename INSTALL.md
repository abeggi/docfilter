# DocFilter — Guida all'installazione

Applicazione web per filtrare template Word (`.docx`) basandosi sulla struttura dei titoli.
Stack: **FastAPI (Python 3)** + **React/Vite** servito in modalità SPA dallo stesso processo uvicorn.

---

## Requisiti di sistema

| Componente | Versione minima | Note |
|---|---|---|
| Ubuntu / Debian | 22.04 LTS | o derivati |
| Python | 3.10+ | per il backend FastAPI |
| Node.js | 18+ | per il build del frontend |
| npm | 9+ | incluso con Node.js |
| git | qualsiasi | per il clone del repository |

---

## 1. Installazione dei runtime

### Python 3

```bash
sudo apt update && sudo apt install -y python3 python3-pip python3-venv
python3 --version   # verifica: deve essere >= 3.10
```

### Node.js 20 (LTS) tramite NodeSource

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # verifica: deve essere >= 18
npm --version
```

### Git

```bash
sudo apt install -y git
```

---

## 2. Clone del repository

```bash
sudo mkdir -p /opt/docfilter
sudo chown $USER:$USER /opt/docfilter

git clone <URL_DEL_REPOSITORY> /opt/docfilter
cd /opt/docfilter
```

> Sostituire `<URL_DEL_REPOSITORY>` con l'URL SSH o HTTPS del repository Git.

---

## 3. Configurazione del backend (Python / FastAPI)

```bash
cd /opt/docfilter/backend

# Crea un virtual environment isolato
python3 -m venv venv

# Attiva il venv
source venv/bin/activate

# Installa le dipendenze
pip install --upgrade pip
pip install -r requirements.txt

# Crea la cartella dati (upload dei template)
mkdir -p data

# Disattiva il venv (verrà riattivato dallo script di avvio)
deactivate
```

### Dipendenze Python installate

| Pacchetto | Scopo |
|---|---|
| `fastapi` | Framework API REST |
| `uvicorn[standard]` | Server ASGI per FastAPI |
| `python-docx` | Lettura/scrittura file `.docx` |
| `python-multipart` | Upload multipart form-data |

---

## 4. Build del frontend (React / Vite)

```bash
cd /opt/docfilter/frontend

# Installa le dipendenze Node
npm install

# Build di produzione (genera frontend/dist/)
npm run build
```

Il backend serve automaticamente la cartella `frontend/dist/` come SPA.

---

## 5. Avvio dell'applicazione

Utilizzare lo script di gestione incluso:

```bash
# Rendi lo script eseguibile (solo la prima volta)
chmod +x /opt/docfilter/docfilter.sh

# Avvia
/opt/docfilter/docfilter.sh start

# Verifica stato
/opt/docfilter/docfilter.sh status

# Riavvia
/opt/docfilter/docfilter.sh restart

# Ferma
/opt/docfilter/docfilter.sh stop
```

L'applicazione sarà disponibile su: **`http://<IP_SERVER>:8000`**

Log in tempo reale:

```bash
tail -f /opt/docfilter/docfilter.log
```

---

## 6. Avvio automatico al boot (systemd) — opzionale

```bash
sudo tee /etc/systemd/system/docfilter.service > /dev/null <<EOF
[Unit]
Description=DocFilter Web Application
After=network.target

[Service]
Type=forking
User=$USER
ExecStart=/opt/docfilter/docfilter.sh start
ExecStop=/opt/docfilter/docfilter.sh stop
PIDFile=/opt/docfilter/docfilter.pid
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable docfilter
sudo systemctl start docfilter
sudo systemctl status docfilter
```

---

## 7. Firewall (UFW) — opzionale

```bash
sudo ufw allow 8000/tcp
sudo ufw reload
```

---

## Struttura del progetto

```
/opt/docfilter/
├── backend/
│   ├── venv/             # virtual environment Python (generato)
│   ├── data/             # upload template .docx (generato)
│   ├── routers/          # endpoint API
│   ├── services/         # logica di business
│   ├── main.py           # entry point FastAPI
│   └── requirements.txt
├── frontend/
│   ├── src/              # sorgenti React
│   ├── dist/             # build di produzione (generata)
│   └── package.json
├── docfilter.sh          # script start/stop/restart/status
├── docfilter.log         # log runtime (generato)
├── docfilter.pid         # PID del processo (generato)
├── INSTALL.md            # questo file
└── .gitignore
```

---

## Riepilogo comandi — installazione completa

```bash
# 1. Runtime
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Clone
sudo mkdir -p /opt/docfilter && sudo chown $USER:$USER /opt/docfilter
git clone <URL_DEL_REPOSITORY> /opt/docfilter

# 3. Backend
cd /opt/docfilter/backend
python3 -m venv venv && source venv/bin/activate
pip install --upgrade pip && pip install -r requirements.txt
mkdir -p data && deactivate

# 4. Frontend
cd /opt/docfilter/frontend
npm install && npm run build

# 5. Avvio
chmod +x /opt/docfilter/docfilter.sh
/opt/docfilter/docfilter.sh start
```
