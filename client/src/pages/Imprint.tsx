import Layout from "@/components/Layout";

export default function Imprint() {
  return (
    <Layout>
      <div className="container py-32">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold mb-8 text-white">Impressum</h1>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Kontaktadresse</h2>
            <div className="text-muted-foreground">
              <p className="font-bold text-white">Gross ICT</p>
              <p>Neuhushof 3</p>
              <p>6144 Zell LU</p>
              <p>Schweiz</p>
              <br />
              <p>Email: info@gross-ict.ch</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Haftungsausschluss</h2>
            <p className="text-muted-foreground leading-relaxed">
              Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen. Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen, durch Missbrauch der Verbindung oder durch technische Störungen entstanden sind, werden ausgeschlossen.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Urheberrechte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf der Website gehören ausschließlich der Firma Gross ICT oder den speziell genannten Rechtsinhabern. Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung der Urheberrechtsträger im Voraus einzuholen.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
