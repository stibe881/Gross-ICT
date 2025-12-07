import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 text-destructive">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Seite nicht gefunden</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Die gesuchte Seite existiert leider nicht oder wurde verschoben.
        </p>
        <Link href="/">
          <Button size="lg">Zurück zur Startseite</Button>
        </Link>
      </div>
    </Layout>
  );
}
