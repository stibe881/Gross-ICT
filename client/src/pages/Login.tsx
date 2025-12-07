import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      // Invalidate and refetch the auth.me query to update authentication state
      await utils.auth.me.invalidate();
      toast.success("Login erfolgreich!");
      
      // Redirect based on user role
      if (data.user.role === 'admin') {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
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
