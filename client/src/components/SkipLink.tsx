/**
 * Skip Link Component
 * Provides keyboard users with a way to skip navigation and jump directly to main content
 * WCAG 2.1 Criterion 2.4.1 Bypass Blocks - Level A
 */

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
      aria-label="Zum Hauptinhalt springen"
    >
      Zum Hauptinhalt springen
    </a>
  );
}
