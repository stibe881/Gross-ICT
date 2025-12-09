import { Link } from "wouter";
import { Eye, Check } from "lucide-react";

/**
 * Accessibility Badge Component
 * Displays WCAG 2.1 Level AA compliance badge in footer
 */

export default function AccessibilityBadge() {
  return (
    <Link href="/accessibility-statement">
      <div className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl group cursor-pointer">
        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
          <Eye className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider">WCAG 2.1</span>
            <Check className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="text-sm font-bold">Level AA</div>
          <div className="text-xs opacity-90">Barrierefrei</div>
        </div>
      </div>
    </Link>
  );
}
