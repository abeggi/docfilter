#!/bin/bash
# Script di installazione del servizio systemd per DocFilter

SERVICE_FILE="docfilter.service"
SYSTEMD_DIR="/etc/systemd/system"

echo "=== Installazione servizio DocFilter ==="

# Verifica che il file service esista
if [ ! -f "$SERVICE_FILE" ]; then
    echo "Errore: file $SERVICE_FILE non trovato nella directory corrente."
    exit 1
fi

# Copia il file service in /etc/systemd/system
echo "Copiando il file service in $SYSTEMD_DIR..."
sudo cp "$SERVICE_FILE" "$SYSTEMD_DIR/"

# Imposta i permessi corretti
echo "Impostando i permessi..."
sudo chmod 644 "$SYSTEMD_DIR/$SERVICE_FILE"

# Ricarica systemd per riconoscere il nuovo servizio
echo "Ricaricando systemd..."
sudo systemctl daemon-reload

# Abilita il servizio per l'avvio automatico
echo "Abilitando il servizio per l'avvio automatico..."
sudo systemctl enable docfilter.service

echo ""
echo "=== Installazione completata ==="
echo ""
echo "Comandi disponibili:"
echo "  sudo systemctl start docfilter    # Avvia il servizio"
echo "  sudo systemctl stop docfilter     # Ferma il servizio"
echo "  sudo systemctl restart docfilter  # Riavvia il servizio"
echo "  sudo systemctl status docfilter   # Verifica lo stato"
echo "  sudo journalctl -u docfilter -f   # Visualizza i log in tempo reale"
echo ""
echo "Il servizio partirà automaticamente al prossimo riavvio del server."
