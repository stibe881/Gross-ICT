import { getDb } from "../server/db.ts";
import { kbArticles, users } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function seedKB() {
  const db = await getDb();

  // Get admin user
  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  
  if (!admin) {
    console.error("❌ Admin user not found. Please create an admin user first.");
    process.exit(1);
  }

  console.log(`✓ Using admin user: ${admin.email}`);

  // Check if KB articles already exist
  const existingArticles = await db.select().from(kbArticles);
  if (existingArticles.length > 0) {
    console.log(`⚠️  ${existingArticles.length} KB articles already exist. Skipping seed.`);
    process.exit(0);
  }

  const articles = [
    {
      title: "Wie erstelle ich ein Support-Ticket?",
      content: `Um ein Support-Ticket zu erstellen, folgen Sie diesen Schritten:

1. Navigieren Sie zum Support-Center über den "Support"-Link in der Navigation
2. Klicken Sie auf "Neues Ticket erstellen"
3. Füllen Sie das Formular aus:
   - Betreff: Kurze Beschreibung Ihres Problems
   - Kategorie: Wählen Sie die passende Kategorie (Netzwerk, Hardware, Software, etc.)
   - Priorität: Wählen Sie die Dringlichkeit
   - Beschreibung: Detaillierte Beschreibung des Problems
4. Optional: Fügen Sie Screenshots oder Logdateien hinzu
5. Klicken Sie auf "Ticket erstellen"

Sie erhalten eine Bestätigung und können den Status Ihres Tickets jederzeit im Dashboard verfolgen.`,
      category: "Allgemein",
      tags: "ticket,erstellen,support,anleitung",
      visibility: "public",
      authorId: admin.id,
    },
    {
      title: "Wie setze ich mein Passwort zurück?",
      content: `Wenn Sie Ihr Passwort vergessen haben:

1. Gehen Sie zur Login-Seite
2. Klicken Sie auf "Passwort vergessen?"
3. Geben Sie Ihre registrierte E-Mail-Adresse ein
4. Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen
5. Klicken Sie auf den Link und geben Sie ein neues Passwort ein
6. Bestätigen Sie das neue Passwort

Hinweis: Der Link ist 24 Stunden gültig. Falls Sie keine E-Mail erhalten, überprüfen Sie Ihren Spam-Ordner oder kontaktieren Sie unseren Support.`,
      category: "Account",
      tags: "passwort,zurücksetzen,login,account",
      visibility: "public",
      authorId: admin.id,
    },
    {
      title: "Wie kann ich den Status meines Tickets verfolgen?",
      content: `Sie können den Status Ihres Tickets auf verschiedene Weisen verfolgen:

**Im Dashboard:**
1. Melden Sie sich an
2. Gehen Sie zu "Meine Tickets" im Dashboard
3. Sehen Sie alle Ihre Tickets mit aktuellem Status

**Status-Bedeutungen:**
- Offen: Ticket wurde erstellt und wartet auf Bearbeitung
- In Bearbeitung: Ein Support-Mitarbeiter arbeitet an Ihrem Problem
- Gelöst: Das Problem wurde behoben
- Geschlossen: Ticket wurde abgeschlossen

**Benachrichtigungen:**
Sie erhalten E-Mail-Benachrichtigungen bei Statusänderungen und neuen Kommentaren von unserem Support-Team.`,
      category: "Allgemein",
      tags: "ticket,status,verfolgen,dashboard",
      visibility: "public",
      authorId: admin.id,
    },
    {
      title: "Welche Informationen sollte ich in ein Ticket aufnehmen?",
      content: `Um eine schnelle Lösung zu gewährleisten, fügen Sie bitte folgende Informationen hinzu:

**Für Netzwerk-Probleme:**
- Betroffene Geräte/Computer
- Fehlermeldungen
- Zeitpunkt des Auftretens
- Betroffene Dienste

**Für Hardware-Probleme:**
- Gerätetyp und Modell
- Seriennummer (falls vorhanden)
- Genaue Fehlerbeschreibung
- Fotos des Problems (falls relevant)

**Für Software-Probleme:**
- Programmname und Version
- Fehlermeldung (Screenshot hilfreich)
- Schritte zur Reproduktion
- Betriebssystem

**Allgemein:**
- Screenshots oder Logdateien
- Bereits durchgeführte Lösungsversuche
- Dringlichkeit des Problems`,
      category: "Allgemein",
      tags: "ticket,informationen,best practices,anleitung",
      visibility: "public",
      authorId: admin.id,
    },
    {
      title: "Wie lange dauert die Bearbeitung eines Tickets?",
      content: `Die Bearbeitungszeit hängt von der Priorität ab:

**Priorität: Kritisch**
- Erste Reaktion: Innerhalb von 1 Stunde
- Lösung: Innerhalb von 4 Stunden
- Beispiele: Kompletter Netzwerkausfall, kritische Sicherheitsprobleme

**Priorität: Hoch**
- Erste Reaktion: Innerhalb von 4 Stunden
- Lösung: Innerhalb von 1 Arbeitstag
- Beispiele: Teilweiser Ausfall, wichtige Funktionen nicht verfügbar

**Priorität: Normal**
- Erste Reaktion: Innerhalb von 1 Arbeitstag
- Lösung: Innerhalb von 3 Arbeitstagen
- Beispiele: Kleinere Probleme, Fragen zur Nutzung

**Priorität: Niedrig**
- Erste Reaktion: Innerhalb von 2 Arbeitstagen
- Lösung: Nach Verfügbarkeit
- Beispiele: Feature-Anfragen, allgemeine Fragen

Hinweis: Diese Zeiten gelten während der Geschäftszeiten (Mo-Fr, 8-18 Uhr).`,
      category: "Allgemein",
      tags: "bearbeitungszeit,sla,priorität,reaktionszeit",
      visibility: "public",
      authorId: admin.id,
    },
    {
      title: "Kann ich Dateien an ein Ticket anhängen?",
      content: `Ja, Sie können Dateien an Tickets anhängen:

**Unterstützte Dateitypen:**
- Bilder: JPG, PNG, GIF (max. 10 MB)
- Dokumente: PDF, DOC, DOCX, TXT (max. 10 MB)
- Logdateien: LOG, TXT (max. 5 MB)
- Archive: ZIP, RAR (max. 20 MB)

**So fügen Sie Dateien hinzu:**
1. Beim Erstellen eines Tickets: Klicken Sie auf "Datei anhängen"
2. Bei bestehenden Tickets: Fügen Sie Dateien über die Kommentar-Funktion hinzu
3. Wählen Sie die Datei von Ihrem Computer aus
4. Warten Sie auf den Upload (Fortschrittsbalken)

**Best Practices:**
- Screenshots sind sehr hilfreich bei visuellen Problemen
- Logdateien helfen bei technischen Fehlern
- Komprimieren Sie mehrere Dateien in einem ZIP-Archiv
- Entfernen Sie sensible Daten vor dem Upload`,
      category: "Allgemein",
      tags: "anhänge,dateien,upload,screenshots",
      visibility: "public",
      authorId: admin.id,
    },
    {
      title: "Was bedeuten die verschiedenen Ticket-Kategorien?",
      content: `Wir verwenden verschiedene Kategorien zur besseren Organisation:

**Netzwerk**
- Internet-Verbindungsprobleme
- WLAN-Probleme
- VPN-Zugang
- Netzwerk-Konfiguration

**Hardware**
- Defekte Geräte
- Drucker-Probleme
- Computer/Laptop-Probleme
- Peripheriegeräte

**Software**
- Programmfehler
- Installation/Updates
- Lizenzprobleme
- Konfiguration

**E-Mail**
- E-Mail-Zugriff
- Spam-Probleme
- E-Mail-Konfiguration
- Outlook/Thunderbird

**Sicherheit**
- Verdächtige Aktivitäten
- Virus/Malware
- Passwort-Probleme
- Zugriffskontrolle

**Sonstiges**
- Alle anderen Anfragen
- Allgemeine Fragen
- Feature-Anfragen

Die richtige Kategorie hilft uns, Ihr Ticket schneller an den richtigen Spezialisten weiterzuleiten.`,
      category: "Allgemein",
      tags: "kategorien,ticket,organisation,übersicht",
      visibility: "public",
      authorId: admin.id,
    },
    {
      title: "Interne Anleitung: Ticket-Eskalation",
      content: `Prozess für die Eskalation von Tickets:

**Wann eskalieren?**
- SLA-Fristen werden nicht eingehalten
- Problem erfordert Spezialwissen
- Kunde ist unzufrieden
- Kritisches Problem ohne Lösung

**Eskalationsstufen:**
1. Level 1: Standard Support (erste 24h)
2. Level 2: Senior Support (nach 24h oder bei Bedarf)
3. Level 3: Management (kritische Fälle)

**Vorgehensweise:**
1. Dokumentieren Sie alle bisherigen Lösungsversuche
2. Markieren Sie das Ticket als "Eskalation erforderlich"
3. Benachrichtigen Sie den Team-Lead
4. Fügen Sie alle relevanten Informationen hinzu
5. Setzen Sie die Priorität entsprechend

**Wichtig:**
- Informieren Sie den Kunden über die Eskalation
- Dokumentieren Sie den Grund
- Übergeben Sie alle Kontext-Informationen`,
      category: "Internal",
      tags: "eskalation,prozess,support,intern",
      visibility: "internal",
      authorId: admin.id,
    },
  ];

  console.log(`\n📝 Creating ${articles.length} KB articles...`);

  for (const article of articles) {
    await db.insert(kbArticles).values(article);
    console.log(`✓ Created: ${article.title} (${article.visibility})`);
  }

  console.log(`\n✅ Successfully seeded ${articles.length} KB articles!`);
  console.log(`   - ${articles.filter(a => a.visibility === "public").length} public articles`);
  console.log(`   - ${articles.filter(a => a.visibility === "internal").length} internal articles`);
  
  process.exit(0);
}

seedKB().catch((error) => {
  console.error("❌ Error seeding KB:", error);
  process.exit(1);
});
