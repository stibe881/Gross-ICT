# E-Mail Spam-Prävention für Gross ICT

## Problem
E-Mails von `stefan@gross-ict.ch` landen im Spam-Ordner der Empfänger.

## Ursache
Fehlende oder falsch konfigurierte E-Mail-Authentifizierung (SPF, DKIM, DMARC).

---

## Lösung: DNS-Einträge konfigurieren

### 1. SPF (Sender Policy Framework)

**Was ist SPF?**
SPF definiert, welche Mail-Server berechtigt sind, E-Mails für Ihre Domain zu versenden.

**DNS-Eintrag hinzufügen:**

```
Type: TXT
Name: @
Value: v=spf1 include:spf.protection.outlook.com -all
TTL: 3600
```

**Erklärung:**
- `v=spf1` - SPF Version 1
- `include:spf.protection.outlook.com` - Erlaubt Office365-Server
- `-all` - Alle anderen Server werden abgelehnt (streng)

**Alternative (weniger streng):**
```
v=spf1 include:spf.protection.outlook.com ~all
```
(`~all` = Soft Fail, markiert als verdächtig statt abgelehnt)

---

### 2. DKIM (DomainKeys Identified Mail)

**Was ist DKIM?**
DKIM fügt eine digitale Signatur zu E-Mails hinzu, die beweist, dass die E-Mail von Ihrer Domain stammt.

**Schritte:**

1. **DKIM in Office365 aktivieren:**
   - Gehen Sie zu: https://admin.microsoft.com
   - Exchange Admin Center → Protection → DKIM
   - Wählen Sie Ihre Domain (`gross-ict.ch`)
   - Klicken Sie auf "Create DKIM keys"

2. **DNS-Einträge hinzufügen:**
   
   Office365 zeigt Ihnen zwei CNAME-Einträge an, die Sie bei Ihrem DNS-Provider hinzufügen müssen:

   ```
   Type: CNAME
   Name: selector1._domainkey
   Value: selector1-gross-ict-ch._domainkey.grossict.onmicrosoft.com
   TTL: 3600

   Type: CNAME
   Name: selector2._domainkey
   Value: selector2-gross-ict-ch._domainkey.grossict.onmicrosoft.com
   TTL: 3600
   ```

   **Wichtig:** Die genauen Werte erhalten Sie von Office365!

3. **DKIM aktivieren:**
   - Nach dem Hinzufügen der DNS-Einträge (kann 24-48h dauern)
   - Gehen Sie zurück zu Exchange Admin Center → DKIM
   - Aktivieren Sie DKIM für `gross-ict.ch`

---

### 3. DMARC (Domain-based Message Authentication)

**Was ist DMARC?**
DMARC definiert, was mit E-Mails passieren soll, die SPF/DKIM-Checks nicht bestehen.

**DNS-Eintrag hinzufügen:**

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:stefan@gross-ict.ch; ruf=mailto:stefan@gross-ict.ch; fo=1
TTL: 3600
```

**Erklärung:**
- `v=DMARC1` - DMARC Version 1
- `p=quarantine` - Verdächtige E-Mails in Spam verschieben
- `rua=mailto:...` - Aggregate Reports an diese E-Mail senden
- `ruf=mailto:...` - Forensic Reports an diese E-Mail senden
- `fo=1` - Reports bei jedem Fehler senden

**Alternative Policies:**
- `p=none` - Nur überwachen, nichts blockieren (für Tests)
- `p=reject` - E-Mails komplett ablehnen (sehr streng)

---

## DNS-Provider: Wo DNS-Einträge hinzufügen?

Je nachdem, wo Ihre Domain registriert ist:

### **Infomaniak (empfohlen für .ch Domains)**
1. Login: https://manager.infomaniak.com
2. Domains → `gross-ict.ch` → DNS-Zone
3. "Eintrag hinzufügen" klicken
4. Typ, Name und Wert eingeben
5. Speichern

### **Cloudflare**
1. Login: https://dash.cloudflare.com
2. Wählen Sie `gross-ict.ch`
3. DNS → Add record
4. Typ, Name und Wert eingeben
5. Save

### **GoDaddy / Namecheap / andere**
Ähnliche Schritte wie oben - suchen Sie nach "DNS Management" oder "DNS Records"

---

## Überprüfung

Nach dem Hinzufügen der DNS-Einträge (24-48h warten):

### **SPF prüfen:**
```bash
nslookup -type=txt gross-ict.ch
```
Sollte zeigen: `v=spf1 include:spf.protection.outlook.com -all`

### **DKIM prüfen:**
```bash
nslookup -type=cname selector1._domainkey.gross-ict.ch
```

### **DMARC prüfen:**
```bash
nslookup -type=txt _dmarc.gross-ict.ch
```

### **Online-Tools:**
- https://mxtoolbox.com/spf.aspx
- https://mxtoolbox.com/dkim.aspx
- https://mxtoolbox.com/dmarc.aspx
- https://www.mail-tester.com (E-Mail-Test)

---

## Zusätzliche Tipps

### 1. **Reverse DNS (PTR Record)**
Stellen Sie sicher, dass Ihr Mail-Server einen korrekten PTR-Eintrag hat.
Bei Office365 ist das bereits konfiguriert.

### 2. **E-Mail-Inhalt**
- Vermeiden Sie Spam-Wörter ("Gratis", "Gewinn", "Klicken Sie hier")
- Fügen Sie einen Abmelde-Link hinzu
- Verwenden Sie eine professionelle E-Mail-Signatur
- Halten Sie Text/HTML-Verhältnis ausgewogen

### 3. **IP-Reputation**
Office365 hat eine gute IP-Reputation. Wenn Sie einen eigenen Server verwenden:
- Prüfen Sie Ihre IP auf Blacklists: https://mxtoolbox.com/blacklists.aspx
- Wärmen Sie neue IPs langsam auf (wenige E-Mails pro Tag am Anfang)

### 4. **Engagement**
- Bitten Sie Empfänger, Ihre E-Mail-Adresse zu ihren Kontakten hinzuzufügen
- Fordern Sie sie auf, E-Mails aus dem Spam-Ordner zu verschieben

---

## Zeitplan

1. **Sofort:** SPF-Eintrag hinzufügen (5 Minuten)
2. **Heute:** DKIM in Office365 aktivieren und DNS-Einträge hinzufügen (15 Minuten)
3. **Morgen:** DMARC-Eintrag hinzufügen (5 Minuten)
4. **In 48h:** Überprüfung mit Online-Tools
5. **Nach 1 Woche:** DMARC-Reports analysieren

---

## Erwartete Verbesserung

Nach korrekter Konfiguration:
- ✅ 90%+ der E-Mails landen im Posteingang
- ✅ Höhere Zustellrate
- ✅ Bessere Domain-Reputation
- ✅ Weniger Spam-Markierungen

---

## Support

Falls Sie Hilfe benötigen:
- Office365 Support: https://admin.microsoft.com/AdminPortal/Home#/support
- DNS-Provider Support kontaktieren
- E-Mail-Test durchführen: https://www.mail-tester.com
