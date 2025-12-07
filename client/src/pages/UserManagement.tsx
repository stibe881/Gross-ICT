import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, UserPlus, Shield, Trash2, Key, Mail, User as UserIcon } from "lucide-react";

export default function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "support" | "admin",
  });

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.all.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Benutzer erfolgreich erstellt");
      setIsCreateDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "user" });
      utils.users.all.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Erstellen des Benutzers");
    },
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rolle erfolgreich geändert");
      utils.users.all.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Ändern der Rolle");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Benutzer erfolgreich gelöscht");
      utils.users.all.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Löschen des Benutzers");
    },
  });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }
    createMutation.mutate(newUser);
  };

  const handleRoleChange = (userId: number, newRole: "user" | "support" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`Möchten Sie den Benutzer "${userName}" wirklich löschen?`)) {
      deleteMutation.mutate({ userId });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Admin</Badge>;
      case "support":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Support</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Benutzer</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Shield className="h-4 w-4 text-red-400" />;
    if (role === "support") return <UserIcon className="h-4 w-4 text-blue-400" />;
    return <UserIcon className="h-4 w-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Lade Benutzerverwaltung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                Benutzerverwaltung
              </h1>
              <p className="text-sm md:text-base text-gray-400 mt-1 md:mt-2">Verwalten Sie Benutzer und deren Rollen</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/80 w-full md:w-auto" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Neuer Benutzer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/95 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Erstellen Sie einen neuen Benutzer mit E-Mail und Passwort
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="max@beispiel.ch"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Passwort</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Mindestens 8 Zeichen"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rolle</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as any })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Benutzer</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    disabled={createMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/80"
                  >
                    {createMutation.isPending ? "Erstelle..." : "Benutzer erstellen"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Users List */}
        <div className="grid gap-4">
          {users?.map((user) => (
            <Card key={user.id} className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(user.role)}
                    <div>
                      <CardTitle className="text-white">{user.name || "Unbekannt"}</CardTitle>
                      <CardDescription className="text-gray-400 flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3" />
                        {user.email || "Keine E-Mail"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    <p>Login-Methode: {user.loginMethod || "OAuth"}</p>
                    <p>Erstellt: {new Date(user.createdAt).toLocaleDateString("de-DE")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v as any)}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Benutzer</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.name || "Unbekannt")}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!users || users.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">Keine Benutzer vorhanden.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
