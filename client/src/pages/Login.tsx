import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { MicrosoftIcon } from "@/components/icons/MicrosoftIcon";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'support') {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch the auth.me query to update authentication state
      await utils.auth.me.invalidate();
      const userData = await utils.auth.me.fetch();
      toast.success("Login erfolgreich!");
      // Redirect based on user role
      if (userData) {
        if (userData.role === 'admin' || userData.role === 'support' || userData.role === 'accounting') {
          setLocation("/admin");
        } else {
          setLocation("/dashboard");
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Login fehlgeschlagen");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account erstellt! Bitte melden Sie sich an.");
      setIsRegistering(false);
      setName("");
      setPassword("");
    },
    onError: (error) => {
      toast.error(error.message || "Registrierung fehlgeschlagen");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegistering) {
      if (!name || !email || !password) {
        toast.error("Bitte füllen Sie alle Felder aus");
        return;
      }
      registerMutation.mutate({ email, password, name });
    } else {
      if (!email || !password) {
        toast.error("Bitte füllen Sie alle Felder aus");
        return;
      }
      loginMutation.mutate({ email, password });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  // Microsoft SSO Login Component
  const MicrosoftLoginButton = () => {
    const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
    const microsoftAuthMutation = trpc.microsoftOAuth.getAuthUrl.useMutation({
      onSuccess: (data) => {
        // Redirect to Microsoft login
        window.location.href = data.authUrl;
      },
      onError: (error) => {
        setIsMicrosoftLoading(false);
        toast.error(error.message || "Microsoft-Login fehlgeschlagen");
      },
    });

    const handleMicrosoftLogin = () => {
      setIsMicrosoftLoading(true);
      microsoftAuthMutation.mutate({
        returnUrl: window.location.pathname,
      });
    };

    return (
      <Button
        type="button"
        variant="outline"
        className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
        onClick={handleMicrosoftLogin}
        disabled={isMicrosoftLoading}
      >
        {isMicrosoftLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Weiterleitung...
          </>
        ) : (
          <>
            <MicrosoftIcon className="mr-2 h-5 w-5" />
            Mit Microsoft anmelden
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            {isRegistering ? "Account erstellen" : "Anmelden"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isRegistering
              ? "Erstellen Sie ein Konto für das Support-Portal"
              : "Melden Sie sich an, um Ihre Tickets zu verwalten"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ihr Name"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.com"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegistering ? "Wird erstellt..." : "Wird angemeldet..."}
                </>
              ) : (
                <>{isRegistering ? "Account erstellen" : "Anmelden"}</>
              )}
            </Button>

            {!isRegistering && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-gray-400">Oder</span>
                  </div>
                </div>

                <MicrosoftLoginButton />
              </>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setName("");
                  setPassword("");
                }}
                className="text-sm text-primary hover:underline"
              >
                {isRegistering
                  ? "Bereits ein Konto? Anmelden"
                  : "Noch kein Konto? Registrieren"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
