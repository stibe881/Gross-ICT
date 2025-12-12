import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MicrosoftCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const callbackMutation = trpc.microsoftOAuth.handleCallback.useMutation({
    onSuccess: async (data) => {
      toast.success(`Willkommen, ${data.user.name}!`);
      
      // Invalidate auth.me to update session
      await utils.auth.me.invalidate();
      
      // Redirect to returnUrl or dashboard
      const redirectUrl = data.returnUrl || "/dashboard";
      setLocation(redirectUrl);
    },
    onError: (error) => {
      setError(error.message || "Microsoft-Anmeldung fehlgeschlagen");
      toast.error(error.message || "Microsoft-Anmeldung fehlgeschlagen");
    },
  });

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");
    const errorDescription = params.get("error_description");

    if (errorParam) {
      setError(errorDescription || errorParam);
      toast.error(`Microsoft-Fehler: ${errorDescription || errorParam}`);
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
      return;
    }

    if (!code || !state) {
      setError("Fehlende Authentifizierungsparameter");
      toast.error("Fehlende Authentifizierungsparameter");
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
      return;
    }

    // Handle callback
    callbackMutation.mutate({ code, state });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white text-center">
            {error ? "Anmeldung fehlgeschlagen" : "Microsoft-Anmeldung"}
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            {error
              ? "Es gab ein Problem bei der Anmeldung"
              : "Sie werden angemeldet..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {error ? (
            <>
              <div className="text-red-400 text-sm text-center">{error}</div>
              <p className="text-gray-400 text-sm">
                Sie werden zur Login-Seite weitergeleitet...
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-gray-400 text-sm">
                Bitte warten Sie, während wir Ihre Microsoft-Anmeldung verarbeiten...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
