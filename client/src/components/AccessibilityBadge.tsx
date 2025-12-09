import { Link } from "wouter";

/**
 * Accessibility Badge Component
 * Displays custom WCAG 2.1 Level AA compliance badge with Gross ICT branding
 * Can be used on client projects for brand recognition
 */

export default function AccessibilityBadge() {
  return (
    <Link href="/accessibility-statement">
      <a className="inline-block transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20 group">
        <img 
          src="/wcag-badge-gross-ict.png" 
          alt="WCAG 2.1 Level AA Compliance Badge - Certified by Gross ICT" 
          className="h-16 w-auto rounded-lg shadow-lg group-hover:shadow-yellow-500/30 transition-shadow"
        />
      </a>
    </Link>
  );
}
