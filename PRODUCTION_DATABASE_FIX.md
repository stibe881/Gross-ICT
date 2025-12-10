# Anleitung: Produktions-Datenbank Migration für CRM-Fix

## Problem
Die CRM-Seite auf gross-ict.ch zeigt einen **500 Internal Server Error**, weil die Datenbank-Tabelle `customers` nicht alle erforderlichen Spalten enthält.

**Fehlermeldung:**
```
Failed query: select `id`, `type`, `name`, `customerNumber`, `contactPerson`, 
`email`, `phone`, `address`, `postalCode`, `city`, `country`, 
`paymentTermsDays`, `defaultVatRate`, `defaultDiscount`, `notes`, 
`userId`, `language`, `currency`, `createdAt`, `updatedAt` 
from `customers` order by `customers`.`createdAt` desc
```

---

## Lösung: Datenbank-Migration durchführen

### Option 1: Via SSH auf dem Produktionsserver

**Schritt 1: Mit Server verbinden**
```bash
ssh user@gross-ict.ch
# oder
ssh user@[SERVER-IP]
```

**Schritt 2: Zum Projekt-Verzeichnis navigieren**
```bash
cd /pfad/zum/projekt  # z.B. /var/www/gross-ict
```

**Schritt 3: Datenbank-Schema aktualisieren**
```bash
# Variante A: Mit Drizzle Push (empfohlen für schnelle Fixes)
pnpm db:push

# Variante B: Mit Drizzle Migrate (sicherer für Produktion)
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

**Schritt 4: Server neu starten**
```bash
# Je nach Setup:
pm2 restart gross-ict
# oder
systemctl restart gross-ict
# oder
docker-compose restart
```

---

### Option 2: Manuelles SQL-Update (falls kein SSH-Zugang)

Falls Sie nur Zugriff auf die Datenbank haben (z.B. via phpMyAdmin, MySQL Workbench):

**SQL-Befehle ausführen:**

```sql
-- Fehlende Spalten zur customers-Tabelle hinzufügen
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'de',
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'CHF';

-- Überprüfen, ob alle Spalten vorhanden sind
DESCRIBE customers;
```

**Erwartete Spalten:**
- id
- type
- name
- customerNumber
- contactPerson
- email
- phone
- address
- postalCode
- city
- country
- paymentTermsDays
- defaultVatRate
- defaultDiscount
- notes
- userId
- **language** ← Diese Spalte fehlt wahrscheinlich
- **currency** ← Diese Spalte fehlt wahrscheinlich
- createdAt
- updatedAt

---

### Option 3: Via Hosting-Panel (z.B. cPanel, Plesk)

**Schritt 1: Datenbank-Manager öffnen**
- Einloggen in Ihr Hosting-Panel
- Zu "Datenbanken" → "phpMyAdmin" navigieren

**Schritt 2: Datenbank auswählen**
- Ihre Produktions-Datenbank auswählen (vermutlich `gross_ict` oder ähnlich)

**Schritt 3: SQL-Tab öffnen**
- Auf "SQL" klicken
- Die SQL-Befehle aus Option 2 einfügen und ausführen

**Schritt 4: Anwendung neu starten**
- Im Hosting-Panel die Anwendung neu starten

---

## Überprüfung nach der Migration

**1. Datenbank-Schema prüfen:**
```sql
SHOW COLUMNS FROM customers;
```

**2. Test-Query ausführen:**
```sql
SELECT id, name, email, language, currency 
FROM customers 
LIMIT 5;
```

**3. Website testen:**
- Öffnen Sie https://gross-ict.ch/crm
- Überprüfen Sie, ob die Kundenliste jetzt geladen wird
- Testen Sie das Anlegen eines neuen Kunden

---

## Wichtige Hinweise

⚠️ **Backup erstellen:**
Erstellen Sie VOR der Migration ein Datenbank-Backup:
```bash
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

⚠️ **Produktionsumgebung:**
- Führen Sie die Migration außerhalb der Stoßzeiten durch
- Informieren Sie Benutzer über mögliche kurze Ausfallzeiten
- Testen Sie nach der Migration alle kritischen Funktionen

⚠️ **Umgebungsvariablen:**
Stellen Sie sicher, dass die `DATABASE_URL` in der Produktionsumgebung korrekt gesetzt ist.

---

## Troubleshooting

**Problem: "pnpm: command not found"**
```bash
npm install -g pnpm
```

**Problem: "Permission denied"**
```bash
sudo pnpm db:push
# oder
sudo chown -R $USER:$USER /pfad/zum/projekt
```

**Problem: "Connection refused"**
- Überprüfen Sie die DATABASE_URL in der `.env` Datei
- Stellen Sie sicher, dass der Datenbankserver läuft
- Prüfen Sie Firewall-Regeln

---

## Kontakt bei Problemen

Falls die Migration fehlschlägt oder Sie weitere Unterstützung benötigen:

1. **Server-Logs prüfen:**
   ```bash
   tail -f /var/log/gross-ict/error.log
   # oder
   pm2 logs gross-ict
   ```

2. **Fehlermeldung kopieren** und mir zusenden

3. **Datenbank-Status prüfen:**
   ```bash
   systemctl status mysql
   # oder
   systemctl status postgresql
   ```

---

## Nach erfolgreicher Migration

✅ Kunden sollten jetzt in der CRM-Ansicht sichtbar sein
✅ Neue Kunden können angelegt werden
✅ Alle CRUD-Operationen (Create, Read, Update, Delete) funktionieren

**Nächste Schritte:**
- Regelmäßige Datenbank-Backups einrichten
- CI/CD-Pipeline für automatische Migrationen konfigurieren
- Monitoring für Datenbank-Fehler einrichten
