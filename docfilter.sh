#!/bin/bash

# Configurazione percorsi
PROJECT_DIR="/opt/docfilter"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
PID_FILE="$PROJECT_DIR/docfilter.pid"
LOG_FILE="$PROJECT_DIR/docfilter.log"
PORT=8000

start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "DocFilter è già in esecuzione (PID: $PID)."
            return
        else
            echo "Trovato file PID obsoleto. Lo rimuovo..."
            rm "$PID_FILE"
        fi
    fi

    echo "Avvio in corso di DocFilter..."
    cd "$BACKEND_DIR" || exit 1
    
    # Avvia uvicorn in background e ridirige i log
    nohup "$VENV_DIR/bin/uvicorn" main:app --host "0.0.0.0" --port "$PORT" > "$LOG_FILE" 2>&1 &
    
    # Salva il Process ID nel file pid
    echo $! > "$PID_FILE"
    echo "DocFilter avviato con successo su http://0.0.0.0:$PORT (PID: $(cat $PID_FILE))."
    echo "I log sono consultabili in $LOG_FILE"
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "DocFilter non è in esecuzione (nessun file PID trovato)."
        # Prova ad arrestarlo cercando uvicorn nel caso in cui il pid file manchi
        PIDS=$(pgrep -f "uvicorn main:app")
        if [ ! -z "$PIDS" ]; then
            echo "Trovati processi orfani di uvicorn. Li arresto..."
            kill $PIDS
        fi
        return
    fi
    
    PID=$(cat "$PID_FILE")
    echo "Arresto di DocFilter (PID: $PID)..."
    kill $PID 2>/dev/null
    
    # Attendi l'interruzione del processo
    while ps -p $PID > /dev/null 2>&1; do
        sleep 0.5
    done
    
    rm -f "$PID_FILE"
    echo "DocFilter fermato."
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "DocFilter è IN ESECUZIONE (PID: $PID) in ascolto sulla porta $PORT."
        else
            echo "DocFilter NON È IN ESECUZIONE (ma esiste un file PID obsoleto)."
        fi
    else
        echo "DocFilter NON È IN ESECUZIONE."
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 1
        start
        ;;
    status)
        status
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
esac
