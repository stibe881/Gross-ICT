import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <Layout>
      <SEO 
        title="Datenschutzerklärung" 
        description="Datenschutzerklärung von Gross ICT gemäß DSGVO und revDSG."
        canonical="/privacy"
        type="article"
      />
      <div className="container py-32">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold mb-8 text-white">Datenschutzerklärung</h1>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">1. Einleitung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Der Schutz Ihrer Privatsphäre ist uns wichtig. Wir halten uns an die geltenden Datenschutzgesetze, insbesondere das Schweizer Datenschutzgesetz (DSG) und, soweit anwendbar, die Datenschutz-Grundverordnung (DSGVO) der Europäischen Union.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">2. Verantwortliche Stelle</h2>
            <div className="text-muted-foreground">
              <p className="font-bold text-white">Gross ICT</p>
              <p>Neuhushof 3</p>
              <p>6144 Zell LU</p>
              <p>Schweiz</p>
              <p>Email: info@gross-ict.ch</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">3. Erhebung und Bearbeitung von Daten</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir bearbeiten Personendaten, die wir im Rahmen unserer Geschäftsbeziehung mit unseren Kunden und anderen Geschäftspartnern von diesen und weiteren beteiligten Personen erhalten oder die wir beim Betrieb unserer Websites, Apps und weiteren Anwendungen von deren Nutzern erheben.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Kontaktinformationen (z.B. Name, Adresse, E-Mail, Telefonnummer)</li>
              <li>Technische Daten (z.B. IP-Adresse, Browser-Typ, Logfiles)</li>
              <li>Vertragsdaten bei Inanspruchnahme unserer Dienstleistungen</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">4. Zwecke der Datenbearbeitung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir verwenden die erhobenen Daten primär, um unsere Verträge mit unseren Kunden und Geschäftspartnern abzuschließen und abzuwickeln, so insbesondere im Rahmen der IT-Dienstleistungen, Webentwicklung und Support, sowie um unseren gesetzlichen Pflichten im In- und Ausland nachzukommen.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">5. Cookies und Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir setzen auf unseren Websites typischerweise "Cookies" und vergleichbare Techniken ein, mit denen Ihr Browser oder Ihr Gerät identifiziert werden kann. Ein Cookie ist eine kleine Datei, die an Ihren Computer gesendet bzw. vom verwendeten Webbrowser automatisch auf Ihrem Computer oder mobilen Gerät gespeichert wird, wenn Sie unsere Website besuchen.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Sie können Ihren Browser so einstellen, dass er Cookies zurückweist, nur für eine Sitzung speichert oder sonst vorzeitig löscht. Die meisten Browser sind so voreingestellt, dass sie Cookies akzeptieren.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">6. Datensicherheit</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir treffen angemessene technische und organisatorische Sicherheitsvorkehrungen zum Schutz Ihrer Personendaten gegen unberechtigten Zugriff und Missbrauch, wie etwa der Erlass von Weisungen, Schulungen, IT- und Netzwerksicherheitslösungen, Zugangskontrollen und -beschränkungen sowie Verschlüsselung von Datenträgern und Übermittlungen.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">7. Ihre Rechte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sie haben im Rahmen des auf Sie anwendbaren Datenschutzrechts das Recht auf Auskunft, Berichtigung, Löschung, das Recht auf Einschränkung der Datenbearbeitung und sonstiger dem Widerspruch gegen unsere Datenbearbeitungen sowie auf Herausgabe gewisser Personendaten zwecks Übertragung an eine andere Stelle (sog. Datenportabilität).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">8. Änderungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wir können diese Datenschutzerklärung jederzeit ohne Vorankündigung anpassen. Es gilt die jeweils aktuelle, auf unserer Website publizierte Fassung.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
