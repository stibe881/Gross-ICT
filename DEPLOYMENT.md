# Deployment-Anleitung für Gross ICT

## Problem behoben
- ✅ Drag-and-Drop Library-Kompatibilität behoben (@dnd-kit/sortable 10.0.0 → 8.0.0)
- ✅ Production Build erstellt (16 MB)
- ⚠️ SMTP-Tabelle muss in Produktionsdatenbank erstellt werden

## Schritt 1: SMTP-Tabelle in Produktionsdatenbank erstellen

Führen Sie diese SQL-Abfrage in Ihrer Produktionsdatenbank aus:

```sql
CREATE TABLE IF NOT EXISTS smtpSettings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  secure INT DEFAULT 1 NOT NULL,
  user VARCHAR(320) NOT NULL,
  password VARCHAR(500) NOT NULL,
  fromEmail VARCHAR(320) NOT NULL,
  fromName VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

**Wo ausführen:**
- phpMyAdmin: SQL-Tab
- MySQL Workbench: Query-Fenster
- Command Line: `mysql -u username -p database_name < create_smtp_table.sql`

## Schritt 2: Deployment-Paket herunterladen

Das Deployment-Paket wurde erstellt:
- Datei: `gross-ict-deployment.tar.gz` (16 MB)
- Enthält: dist/, server/, drizzle/, package.json

## Schritt 3: Auf Server hochladen

### Option A: Via FTP/SFTP
1. Laden Sie `gross-ict-deployment.tar.gz` auf Ihren Server hoch
2. Entpacken Sie: `tar -xzf gross-ict-deployment.tar.gz`
3. Installieren Sie Dependencies: `pnpm install --prod`
4. Starten Sie den Server: `node dist/index.js`

### Option B: Via Git (empfohlen)
```bash
# Auf dem Server
cd /var/www/gross-ict
git pull origin main
pnpm install
pnpm build
pm2 restart gross-ict  # oder Ihr Process Manager
```

## Schritt 4: Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei auf dem Server mit:

```env
DATABASE_URL=mysql://user:password@localhost:3306/database_name
NODE_ENV=production
PORT=3000
```

## Schritt 5: Server neu starten

```bash
# Mit PM2
pm2 restart gross-ict

# Mit systemd
sudo systemctl restart gross-ict

# Manuell
node dist/index.js
```

## Schritt 6: Testen

1. Öffnen Sie https://gross-ict.ch
2. Melden Sie sich als Admin an
3. Testen Sie das Dashboard (Drag-and-Drop sollte funktionieren)
4. Öffnen Sie SMTP-Einstellungen (sollte keine Fehler mehr geben)

## Troubleshooting

### "Illegal constructor" Fehler bleibt
- **Ursache:** Browser-Cache
- **Lösung:** Hard Refresh (Ctrl+Shift+R oder Cmd+Shift+R)
- **Alternative:** Cache leeren in Browser-Einstellungen

### "Failed query: smtpSettings" Fehler
- **Ursache:** Tabelle existiert nicht in Produktionsdatenbank
- **Lösung:** SQL-Abfrage aus Schritt 1 ausführen

### Drag-and-Drop funktioniert nicht
- **Ursache:** Alte JavaScript-Dateien werden noch geladen
- **Lösung:** 
  1. Browser-Cache leeren
  2. Server-seitigen Cache leeren (falls vorhanden)
  3. CDN-Cache purgen (falls vorhanden)

## Wichtige Hinweise

- ⚠️ **Backup:** Erstellen Sie vor dem Deployment ein Backup Ihrer Datenbank
- ⚠️ **Downtime:** Planen Sie ca. 5-10 Minuten Downtime ein
- ✅ **GitHub:** Code ist bereits auf GitHub gepusht (Commit: cea7723)
- ✅ **Version:** Checkpoint 7b894f9f

## Support

Bei Problemen:
1. Überprüfen Sie Server-Logs: `pm2 logs gross-ict`
2. Überprüfen Sie Browser-Konsole (F12)
3. Überprüfen Sie Datenbankverbindung
