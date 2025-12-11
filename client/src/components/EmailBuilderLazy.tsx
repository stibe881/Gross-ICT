import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load the EmailBuilder component to avoid bundling GrapeJS in the main bundle
const EmailBuilder = lazy(() => import("./EmailBuilder"));

interface EmailBuilderLazyProps {
  initialContent?: string;
  onChange?: (html: string, css: string) => void;
  onSave?: (html: string, css: string) => void;
}

export default function EmailBuilderLazy(props: EmailBuilderLazyProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[700px] bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              E-Mail-Builder wird geladen...
            </p>
          </div>
        </div>
      }
    >
      <EmailBuilder {...props} />
    </Suspense>
  );
}
