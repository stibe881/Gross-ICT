import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Check, Eye, Keyboard, MousePointer, Volume2, Smartphone } from "lucide-react";

export default function AccessibilityStatement() {
  return (
    <Layout>
      <SEO
        title="Barrierefreiheitserklärung"
        description="Informationen zur Barrierefreiheit der Gross ICT Website gemäß WCAG 2.1 Level AA"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-full mb-6">
              <Eye className="w-5 h-5" />
              <span className="font-semibold">WCAG 2.1 Level AA</span>
              <Check className="w-5 h-5" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Barrierefreiheitserklärung
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Unser Engagement für digitale Barrierefreiheit
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <Card className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Unser Engagement
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Gross ICT verpflichtet sich, seine Website für alle Menschen zugänglich zu machen, 
                unabhängig von ihren Fähigkeiten oder Technologien. Wir arbeiten kontinuierlich daran, 
                die Barrierefreiheit und Benutzerfreundlichkeit unserer Website zu verbessern und 
                sicherzustellen, dass sie den relevanten Standards entspricht.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Diese Website wurde entwickelt, um die <strong>Web Content Accessibility Guidelines 
                (WCAG) 2.1 Level AA</strong> zu erfüllen. Diese Richtlinien erklären, wie Webinhalte 
                für Menschen mit Behinderungen zugänglicher gemacht werden können.
              </p>
            </Card>

            {/* Conformance Status */}
            <Card className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Konformitätsstatus
              </h2>
              <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    WCAG 2.1 Level AA Konform
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Diese Website entspricht den Web Content Accessibility Guidelines (WCAG) 2.1 
                    auf Level AA. Dies bedeutet, dass die Website die Erfolgskriterien der Stufen 
                    A und AA erfüllt.
                  </p>
                </div>
              </div>
            </Card>

            {/* Accessibility Features */}
            <Card className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Barrierefreiheits-Funktionen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Tastaturnavigation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alle Funktionen sind über die Tastatur zugänglich. Verwenden Sie Tab, Enter 
                      und Pfeiltasten zur Navigation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <MousePointer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Fokus-Indikatoren
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sichtbare Fokus-Indikatoren zeigen an, welches Element gerade ausgewählt ist.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Volume2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Screenreader-Unterstützung
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Semantisches HTML und ARIA-Labels für optimale Screenreader-Kompatibilität.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Smartphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Responsive Design
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Optimiert für alle Bildschirmgrößen und Geräte, einschließlich mobiler Geräte.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Eye className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Farbkontrast
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ausreichende Farbkontraste (mindestens 4.5:1) für bessere Lesbarkeit.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Check className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Alternative Texte
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alle Bilder und Grafiken haben beschreibende Alt-Texte.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Technical Specifications */}
            <Card className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Technische Spezifikationen
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Die Barrierefreiheit dieser Website basiert auf den folgenden Technologien:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>HTML5 mit semantischen Elementen</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>ARIA (Accessible Rich Internet Applications) Attribute</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>CSS3 für responsive und zugängliche Layouts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>JavaScript mit progressiver Verbesserung</span>
                </li>
              </ul>
            </Card>

            {/* Known Limitations */}
            <Card className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Bekannte Einschränkungen
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Trotz unserer Bemühungen können einige Bereiche der Website Barrierefreiheitsprobleme aufweisen:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Einige ältere PDF-Dokumente sind möglicherweise nicht vollständig barrierefrei</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Externe eingebettete Inhalte (z.B. Videos) können von Drittanbietern stammen</span>
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Wir arbeiten aktiv daran, diese Probleme zu beheben und die Barrierefreiheit kontinuierlich zu verbessern.
              </p>
            </Card>

            {/* Feedback */}
            <Card className="p-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Feedback und Kontakt
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Wir freuen uns über Ihr Feedback zur Barrierefreiheit unserer Website. Wenn Sie auf 
                Barrieren stoßen oder Verbesserungsvorschläge haben, kontaktieren Sie uns bitte:
              </p>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p><strong>E-Mail:</strong> <a href="mailto:info@gross-ict.ch" className="text-blue-600 dark:text-blue-400 hover:underline">info@gross-ict.ch</a></p>
                <p><strong>Telefon:</strong> <a href="tel:+41794140616" className="text-blue-600 dark:text-blue-400 hover:underline">+41 79 414 06 16</a></p>
                <p><strong>Adresse:</strong> Neuhushof 3, 6144 Zell LU, Schweiz</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Wir bemühen uns, innerhalb von 5 Werktagen auf Barrierefreiheits-Anfragen zu antworten.
              </p>
            </Card>

            {/* Last Updated */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Letzte Aktualisierung dieser Erklärung: {new Date().toLocaleDateString('de-CH')}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
