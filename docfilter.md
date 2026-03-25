# Prompt per agente AI (Cursor / Firebase Studio)
# App:  DocFilter — Gestione Template Offerta Servizi Gestiti

---

## Obiettivo

Costruisci una web application full-stack che permette di:
1. Caricare e gestire un template Word (.docx) di offerta servizi gestiti IT
2. Visualizzare la struttura del documento (Heading 1 / 2 / 3) come albero interattivo
3. Selezionare i capitoli da mantenere o eliminare tramite checkbox
4. Scaricare una copia del documento con solo i capitoli selezionati
5. Il template originale non viene mai modificato

---

## Stack tecnologico

- **Backend**: Python 3.11+, FastAPI, python-docx
- **Frontend**: React (Vite), Tailwind CSS
- **Comunicazione**: REST API JSON
- **Deploy target**: Ubuntu LXC su Proxmox, esecuzione locale servendo la webapp direttamente tramite FastAPI (senza reverse proxy nginx).

---

## Struttura del progetto

```
project-root/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── routers/
│   │   ├── template.py       # upload, download, gestione file template
│   │   └── document.py       # parsing struttura, generazione documento filtrato
│   ├── services/
│   │   ├── parser.py         # logica python-docx: estrazione heading tree
│   │   └── builder.py        # logica python-docx: ricostruzione documento filtrato
│   └── data/
│       └── template.docx     # file template (persistente, mai modificato)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── HeadingTree.jsx      # tree view con expand/collapse e checkbox
│   │   │   ├── TreeNode.jsx         # singolo nodo dell'albero
│   │   │   └── Settings.jsx         # pagina impostazioni: upload nuovo template
│   │   ├── hooks/
│   │   │   └── useDocumentTree.js   # stato albero, selezione, cascata
│   │   └── api/
│   │       └── client.js            # chiamate REST al backend
│   └── vite.config.js
└── README.md
```

---

## Backend — specifiche dettagliate

### Parser (services/parser.py)

La funzione principale deve:
- Aprire il file `data/template.docx` con `python-docx`
- Iterare tutti i paragrafi e identificare quelli con stile `Heading 1`, `Heading 2`, `Heading 3`
- Costruire una struttura ad albero JSON con la seguente forma:

```json
[
  {
    "id": "h1_0",
    "level": 1,
    "title": "Executive Summary",
    "para_index_start": 2,
    "para_index_end": 38,
    "children": [
      {
        "id": "h2_0",
        "level": 2,
        "title": "Breve descrizione del servizio",
        "para_index_start": 6,
        "para_index_end": 7,
        "children": []
      }
    ]
  }
]
```

- `para_index_start`: indice del paragrafo heading stesso
- `para_index_end`: indice dell'ultimo paragrafo prima del prossimo heading dello stesso livello o superiore
- Gli indici devono essere inclusivi e coprire tutto il contenuto del nodo, heading incluso
- Un nodo Heading 2 appartiene all'ultimo Heading 1 precedente; un Heading 3 all'ultimo Heading 2 precedente
- Il contenuto di testo tra due heading (paragrafi Normal, List Paragraph, ecc.) appartiene al nodo heading che lo precede

### Builder (services/builder.py)

La funzione principale riceve:
- Il documento originale (aperto con python-docx, mai modificato su disco)
- Una lista di `id` di nodi selezionati (quelli da **mantenere**)

Logica di ricostruzione:
- Costruisce l'insieme di indici di paragrafo da includere: per ogni nodo selezionato, include tutti i paragrafi da `para_index_start` a `para_index_end`
- Se un Heading 2 è selezionato ma il suo Heading 1 padre non lo è, include comunque il Heading 1 padre come titolo di sezione (per mantenere la coerenza del documento)
- Stessa logica per Heading 3 → include Heading 2 e Heading 1 antenati
- Ricostruisce il documento eliminando dall'originale, tramite manipolazione XML, tutti i nodi (paragrafi/tabelle) NON selezionati.
- **Preservazione di intestazioni e piè di pagina**: prima di rimuovere qualsiasi elemento, il codice cerca eventuali `w:sectPr` annidati **all'interno** di paragrafi che verrebbero eliminati. Se trovati, li estrae e li riattacca come figli diretti del `w:body` — in modo che sopravvivano alla rimozione del paragrafo contenitore. In Word il `sectPr` finale è spesso embedded nell'ultimo `<w:p>` del corpo, non come figlio diretto del body: ignorare questo caso causa la perdita di intestazioni, piè di pagina e margini nel documento generato. Solo dopo questo salvataggio si procede alla rimozione degli elementi non selezionati. I tag `w:sectPr` già figli diretti del body vengono sempre esclusi dalla rimozione.
- Inserisce inoltre il flag XML `w:updateFields` in `settings.xml` affinché Word chieda l'aggiornamento automatico dei campi all'avvio (come il Sommario, che così si autorigenera basandosi esclusivamente sulle sezioni rimaste). **Attenzione: il pop-up ("Aggiornare i campi?") all'apertura del file è il comportamento volutamente atteso ed è una misura di sicurezza di MS Word vitale per garantire l'autoricalcolo dei numeri di pagina precisi sul dispositivo**.
- Restituisce un oggetto BytesIO pronto per il download

**Nota critica sulla manipolazione del documento**: la tecnica di riversare i paragrafi in un nuovo `docx` vuoto con `copy.deepcopy` danneggia irrimediabilmente la formattazione per via di un matching errato coi settings di namespace. Il processo di costruzione deve unicamente rimuovere i nodi XML rintracciati non desiderati dal file template originale (`element.getparent().remove(element)`).

### API Endpoints (FastAPI)

```
GET  /api/structure
     → restituisce l'albero JSON dei heading del template corrente

POST /api/generate
     body: { "selected_ids": ["h1_0", "h2_1", "h2_3", ...] }
     → restituisce il file .docx filtrato come download binario
     Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
     Content-Disposition: attachment; filename="offerta.docx"

GET  /api/template/info
     → restituisce nome file, data upload, dimensione del template corrente

POST /api/template/upload
     body: multipart/form-data, campo "file" di tipo .docx
     → sostituisce il template corrente in data/template.docx
     → restituisce conferma e nuove info template

GET  /api/health
     → { "status": "ok" }
```

### Configurazione FastAPI

- Abilita CORS permettendo l'IP/dominio di produzione per limitare il blocking se montato a porte alternative da reverse proxy.
- Gestione SPA nativa: include un Exception Handler su 404 per servire programmaticamente `index.html` su root non-API, supportando per intero l'history mode di React Router (che consente ad un refresh manuale come F5 su `/settings` di non restituire errori HTTP).
- Servi i file statici del frontend buildato dalla cartella `frontend/dist` allocata su `/` (tramite StaticFiles).
- In produzione, frontend e backend girano assieme sullo stesso robusto processo FastAPI.
- Dimensione massima upload: 20MB

---

## Frontend — specifiche dettagliate

### Tema

L'app usa il tema scuro come default e unica modalità prevista.

- In `tailwind.config.js`: imposta `darkMode: 'class'`
- In `App.jsx`: il div radice ha sempre la classe `dark`
- In `frontend/index.html`: aggiungi `<meta name="color-scheme" content="dark">` nel `<head>`
- In `index.css`: imposta `background-color: #0f172a` e `color: #f1f5f9` su `body`
- Tutti i componenti usano classi Tailwind dark-aware (`bg-gray-900`, `text-gray-100`, ecc.)
- Non è previsto toggle light/dark

### Navigazione

L'app ha due viste principali:
- **Home** (`/`): albero di selezione e download
- **Impostazioni** (`/settings`): upload nuovo template

Navbar minima con link alle due viste.

### HeadingTree (componente principale)

All'avvio:
- Chiama `GET /api/structure`
- Mostra l'albero dei capitoli, collassato di default a Heading 1
- Mostra un pulsante **"Scarica documento"** in basso, disabilitato se nessun nodo è selezionato

Ogni nodo dell'albero (TreeNode) mostra:
- Triangolino ▶/▼ cliccabile per espandere/collassare (solo se ha figli)
- Checkbox per selezionare/deselezionare il nodo
- Titolo del capitolo
- Indentazione proporzionale al livello (level 1 = 0px, level 2 = 20px, level 3 = 40px)

### Logica di selezione (cascata)

Implementare in `useDocumentTree.js`:

- **Selezione di un nodo**: seleziona automaticamente tutti i suoi figli e discendenti (cascata verso il basso)
- **Deselezione di un nodo**: deseleziona automaticamente tutti i suoi figli e discendenti
- **Selezione parziale dei figli**: il nodo padre mostra uno stato "indeterminato" (checkbox con trattino) — usa la prop `indeterminate` sull'elemento `<input type="checkbox">`
- Pulsanti rapidi: **"Seleziona tutto"** e **"Deseleziona tutto"**

### Download

Al click su "Scarica documento":
- Invia `POST /api/generate` con la lista degli `id` selezionati
- Riceve il blob binario
- Triggera il download nel browser con nome file `offerta_[data_odierna].docx`
- Mostra uno spinner durante la generazione

### Pagina Impostazioni

- Mostra le info del template corrente (nome, data upload, dimensione)
- Form di upload con drag-and-drop o selezione file
- Accetta solo file `.docx`
- Dopo upload con successo: mostra conferma e ricarica le info
- Avviso chiaro: "Il caricamento di un nuovo template sostituirà quello corrente in modo permanente"

---

## Requisiti non funzionali

- Il template originale non viene **mai** modificato — l'operazione di generazione lavora sempre su una copia in memoria
- Il documento generato non viene salvato su disco — viene restituito direttamente come stream
- L'app deve funzionare correttamente anche se il documento ha tabelle, immagini inline, elenchi puntati all'interno dei capitoli (la copia XML-level gestisce questo automaticamente)
- Nessun database — lo stato è il file `data/template.docx` sul filesystem
- **Compatibilità Reverse Proxy**: il client API in produzione si affida intrinsecamente a rotte relative (`/api`), prevenendo il problema di localhost hardcodati; inoltre il server Python si interfaccia su tutti i domini (`0.0.0.0`), risultando universalmente accessibile via LXC / proxy reverse.

---

## Setup e avvio (da includere nel README)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (sviluppo)

```bash
cd frontend
npm install
npm run dev
```

### Produzione (su LXC Ubuntu)

1. Build frontend: `cd frontend && npm run build`
2. Il backend FastAPI serve la cartella `frontend/dist` come StaticFiles alla rotta `/`
3. Utilizzare lo script `docfilter.sh` fornito per gestire l'agile ciclo di vita della webapp:
   - `./docfilter.sh start`: Avvia uvicorn in background sulla porta 8000.
   - `./docfilter.sh stop`: Stoppa in sicurezza il processo uvicorn isolato nel PID.
   - `./docfilter.sh restart`: Esegue un fast-restart.
   - `./docfilter.sh status`: Controlla lo stato di esecuzione del server.

### requirements.txt (backend)

```
fastapi
uvicorn[standard]
python-docx
python-multipart
```

---

## Note per l'agente

- Inizia dal backend: implementa parser e builder, testali con un documento di prova prima di toccare il frontend
- Testa `GET /api/structure` con curl prima di avviare React
- NON utilizzare la tecnica della ri-copiatura in un nuovo documento. Rimuovi i nodi non desiderati direttamente dall'albero XML del template originale tramite manipolazione `_element`. Escludi formalmente dal processo di eliminazione i tag di layout come `w:sectPr`.
- **CRITICO — sectPr annidato nei paragrafi**: In Word il `w:sectPr` che contiene intestazioni, piè di pagina e margini NON è sempre un figlio diretto di `w:body`. Molto spesso è annidato all'interno dell'**ultimo `<w:p>`** del documento. Se quel paragrafo viene rimosso perché fuori dalla selezione, si perde tutto il layout. La soluzione è: **prima** di rimuovere qualsiasi elemento, cercare `w:sectPr` nested con `element.find(qn('w:sectPr'))` e, se trovato, spostarlo come figlio diretto del body con `body.append(nested_sect)`. Solo dopo procedere alle rimozioni.
- Per forzare la rigenerazione flessibile e nativa del Sommario (TOC) ereditato dall'originale, genera proceduralmente un nodo `OxmlElement('w:updateFields')` e integralO in `doc.settings.element`.
- Le tabelle in python-docx non sono paragrafi — itera `doc.element.body` invece di `doc.paragraphs` se vuoi preservare anche le tabelle nell'ordine corretto. Valuta se è necessario in base al contenuto del template.
