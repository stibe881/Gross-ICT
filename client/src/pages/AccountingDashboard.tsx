import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, LogOut, Receipt, UserCircle, Package, Settings } from "lucide-react";
import { toast } from "sonner";

/**
 * Accounting Dashboard - Landing page for users with accounting role
 * Provides access to accounting, CRM, products, and settings
 */
export default function AccountingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Erfolgreich abgemeldet");
      setLocation("/login");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "accounting") {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Buchhaltungs-Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-400">Rechnungen, Kunden & Produkte</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="border-white/20 bg-white/5 hover:bg-white/10"
                size="sm"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Accounting Module */}
          <button
            onClick={() => setLocation("/accounting")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all hover:border-primary/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/10"
          >
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-xl bg-primary/20 p-3">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Buchhaltung</h2>
              <p className="text-sm text-gray-400">
                Rechnungen und Angebote erstellen, verwalten und versenden
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* CRM Module */}
          <button
            onClick={() => setLocation("/crm")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all hover:border-blue-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-xl bg-blue-500/20 p-3">
                <UserCircle className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">CRM</h2>
              <p className="text-sm text-gray-400">
                Kundenverwaltung, Kontakte und Rechnungshistorie
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Products Module */}
          <button
            onClick={() => setLocation("/products")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all hover:border-green-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-green-500/10"
          >
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-xl bg-green-500/20 p-3">
                <Package className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Produkte</h2>
              <p className="text-sm text-gray-400">
                Produktkatalog verwalten und Preise pflegen
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Settings Module */}
          <button
            onClick={() => setLocation("/accounting-settings")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all hover:border-purple-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/10"
          >
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-xl bg-purple-500/20 p-3">
                <Settings className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Einstellungen</h2>
              <p className="text-sm text-gray-400">
                Firmendaten, Bankverbindung und Rechnungsdesign
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
