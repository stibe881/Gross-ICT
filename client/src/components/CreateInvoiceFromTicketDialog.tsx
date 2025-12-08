import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface CreateInvoiceFromTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
}

export function CreateInvoiceFromTicketDialog({
  open,
  onOpenChange,
  ticketId,
}: CreateInvoiceFromTicketDialogProps) {
  const [, setLocation] = useLocation();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("120");
  const [notes, setNotes] = useState("");

  const { data: customers } = trpc.customers.all.useQuery();
  const { data: ticketCustomer } = trpc.invoiceFromTicket.getCustomerFromTicket.useQuery(
    { ticketId },
    { enabled: open }
  );

  const createInvoice = trpc.invoiceFromTicket.createFromTickets.useMutation({
    onSuccess: (data) => {
      toast.success(`Rechnung ${data.invoiceNumber} erfolgreich erstellt`);
      onOpenChange(false);
      setLocation("/invoices");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Auto-select customer if found
  useEffect(() => {
    if (ticketCustomer && "id" in ticketCustomer) {
      setCustomerId(ticketCustomer.id);
    }
  }, [ticketCustomer]);

  // Set default due date (30 days from now)
  useEffect(() => {
    if (open && !dueDate) {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      setDueDate(date.toISOString().split("T")[0]);
    }
  }, [open, dueDate]);

  const handleSubmit = () => {
    if (!customerId || !dueDate) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createInvoice.mutate({
      ticketIds: [ticketId],
      customerId,
      dueDate: new Date(dueDate),
      hourlyRate: parseFloat(hourlyRate),
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rechnung aus Ticket erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {ticketCustomer && !("id" in ticketCustomer) && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Hinweis:</strong> Kunde nicht in der Datenbank gefunden. Bitte wählen Sie einen
                bestehenden Kunden oder erstellen Sie zuerst einen neuen Kunden mit den Daten:
              </p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 ml-4 list-disc">
                <li>Name: {ticketCustomer.name}</li>
                <li>E-Mail: {ticketCustomer.email}</li>
                {ticketCustomer.company && <li>Firma: {ticketCustomer.company}</li>}
              </ul>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Kunde *</label>
            <Select
              value={customerId?.toString() || ""}
              onValueChange={(v) => setCustomerId(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kunde auswählen" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Fälligkeitsdatum *</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Stundensatz (CHF)</label>
            <Input
              type="number"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Die Stunden werden automatisch basierend auf der Ticket-Priorität geschätzt
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notizen</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interne Notizen zur Rechnung..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "Erstelle..." : "Rechnung erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
