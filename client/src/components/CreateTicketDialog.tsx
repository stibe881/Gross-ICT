import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<"network" | "hardware" | "software" | "email" | "security" | "other">("other");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const utils = trpc.useUtils();

  const createTicketMutation = trpc.tickets.create.useMutation({
    onSuccess: () => {
      toast.success("Ticket erfolgreich erstellt");
      utils.tickets.filtered.invalidate();
      utils.tickets.stats.invalidate();
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Fehler beim Erstellen des Tickets: " + error.message);
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCompany("");
    setSubject("");
    setMessage("");
    setCategory("other");
    setPriority("medium");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !subject.trim() || !message.trim()) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createTicketMutation.mutate({
      customerName,
      customerEmail,
      company: company || undefined,
      subject,
      message,
      category,
      priority,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket für Kunden erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm">Kundeninformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Max Mustermann"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">
                  E-Mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="max@beispiel.ch"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Firma (optional)</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Beispiel AG"
              />
            </div>
          </div>

          {/* Ticket Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">
                Betreff <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Kurze Beschreibung des Problems"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as typeof category)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Allgemein</SelectItem>
                    <SelectItem value="network">Netzwerk</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="email">E-Mail</SelectItem>
                    <SelectItem value="security">Sicherheit</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as typeof priority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Normal</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Beschreibung <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Detaillierte Beschreibung des Problems..."
                rows={6}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={createTicketMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={createTicketMutation.isPending}>
              {createTicketMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ticket erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
