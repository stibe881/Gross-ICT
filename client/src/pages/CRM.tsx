import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, User, Eye, Edit, Trash2, Building2, UserCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { CustomerGrowthChart } from "@/components/CustomerGrowthChart";

export default function CRM() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);

  const { data: customers, isLoading, refetch } = trpc.customers.all.useQuery({
    search: searchTerm || undefined,
  });

  const filteredCustomers = customers?.filter((c) => 
    typeFilter === "all" || c.type === typeFilter
  );

  const handleViewCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
  };

  const handleEditCustomer = (customerId: number) => {
    setEditCustomerId(customerId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/admin')}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Kundenverwaltung (CRM)</h1>
              <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Kundendaten und Kontakte</p>
            </div>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neuer Kunde
          </Button>
        </div>

        {/* Customer Growth Chart */}
        <div className="mb-8">
          <CustomerGrowthChart />
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Name, E-Mail oder Firma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kundentyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="company">Firmen</SelectItem>
                <SelectItem value="individual">Privatpersonen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Customer List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Lade Kunden...</p>
          </div>
        ) : !filteredCustomers || filteredCustomers.length === 0 ? (
          <Card className="p-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine Kunden gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== "all" 
                ? "Versuchen Sie andere Suchkriterien."
                : "Erstellen Sie Ihren ersten Kunden, um loszulegen."}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ersten Kunden erstellen
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {customer.type === "company" ? (
                        <Building2 className="w-6 h-6 text-primary" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      {customer.customerNumber && (
                        <p className="text-xs text-muted-foreground">#{customer.customerNumber}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {customer.type === "company" && customer.contactPerson && (
                    <p className="text-muted-foreground">
                      <strong>Kontakt:</strong> {customer.contactPerson}
                    </p>
                  )}
                  <p className="text-muted-foreground truncate">{customer.email}</p>
                  {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  {customer.city && (
                    <p className="text-muted-foreground">
                      {customer.postalCode} {customer.city}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewCustomer(customer.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ansehen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCustomer(customer.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Customer Dialog */}
        <CreateCustomerDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            refetch();
            setCreateDialogOpen(false);
          }}
        />

        {/* Edit Customer Dialog */}
        {editCustomerId && (
          <EditCustomerDialog
            customerId={editCustomerId}
            onClose={() => setEditCustomerId(null)}
            onSuccess={() => {
              refetch();
              setEditCustomerId(null);
            }}
          />
        )}

        {/* View Customer Dialog */}
        {selectedCustomerId && (
          <ViewCustomerDialog
            customerId={selectedCustomerId}
            onClose={() => setSelectedCustomerId(null)}
          />
        )}
      </div>
    </div>
  );
}

// Create Customer Dialog Component
function CreateCustomerDialog({ open, onOpenChange, onSuccess }: any) {
  const [formData, setFormData] = useState({
    type: "company" as "company" | "individual",
    name: "",
    customerNumber: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    country: "Schweiz",
    language: "de" as "de" | "en" | "fr",
    paymentTermsDays: 30,
    defaultVatRate: "8.10",
    defaultDiscount: "0.00",
    notes: "",
  });

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Kunde erfolgreich erstellt");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      type: "company",
      name: "",
      customerNumber: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      city: "",
      country: "Schweiz",
      language: "de",
      paymentTermsDays: 30,
      defaultVatRate: "8.10",
      defaultDiscount: "0.00",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast.error("Bitte füllen Sie Name und E-Mail aus");
      return;
    }

    createCustomer.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Kunden erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Kundentyp *</label>
            <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Firma</SelectItem>
                <SelectItem value="individual">Privatperson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {formData.type === "company" ? "Firmenname" : "Name"} *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Kundennummer</label>
              <Input
                value={formData.customerNumber}
                onChange={(e) => setFormData({ ...formData, customerNumber: e.target.value })}
                placeholder="Optional - wird automatisch generiert"
              />
            </div>
          </div>

          {formData.type === "company" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Kontaktperson</label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">E-Mail *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Telefon</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Adresse</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">PLZ</label>
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Stadt</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Land</label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sprache für Rechnungen</label>
            <Select value={formData.language} onValueChange={(v: any) => setFormData({ ...formData, language: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Rechnungen und E-Mails werden in dieser Sprache versendet</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Zahlungsziel (Tage)</label>
              <Input
                type="number"
                value={formData.paymentTermsDays}
                onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Standard MwSt (%)</label>
              <Input
                value={formData.defaultVatRate}
                onChange={(e) => setFormData({ ...formData, defaultVatRate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Standard Rabatt (%)</label>
              <Input
                value={formData.defaultDiscount}
                onChange={(e) => setFormData({ ...formData, defaultDiscount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notizen</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Interne Notizen..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={createCustomer.isPending}>
              {createCustomer.isPending ? "Erstelle..." : "Kunde erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Customer Dialog Component (similar structure to Create)
function EditCustomerDialog({ customerId, onClose, onSuccess }: any) {
  const { data: customer, isLoading } = trpc.customers.byId.useQuery({ id: customerId });
  const [formData, setFormData] = useState<any>(null);

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Kunde erfolgreich aktualisiert");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Kunde erfolgreich gelöscht");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Initialize form data when customer loads
  if (customer && !formData) {
    setFormData({
      type: customer.type,
      name: customer.name,
      customerNumber: customer.customerNumber || "",
      contactPerson: customer.contactPerson || "",
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      postalCode: customer.postalCode || "",
      city: customer.city || "",
      country: customer.country || "Schweiz",
      language: customer.language || "de",
      paymentTermsDays: customer.paymentTermsDays || 30,
      defaultVatRate: customer.defaultVatRate || "8.10",
      defaultDiscount: customer.defaultDiscount || "0.00",
      notes: customer.notes || "",
    });
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast.error("Bitte füllen Sie Name und E-Mail aus");
      return;
    }

    updateCustomer.mutate({
      id: customerId,
      ...formData,
    });
  };

  const handleDelete = () => {
    if (confirm("Möchten Sie diesen Kunden wirklich löschen? Alle zugehörigen Rechnungen bleiben erhalten.")) {
      deleteCustomer.mutate({ id: customerId });
    }
  };

  if (isLoading || !formData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <p>Lade Kundendaten...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kunde bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Same form fields as Create Dialog */}
          <div>
            <label className="text-sm font-medium mb-2 block">Kundentyp *</label>
            <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Firma</SelectItem>
                <SelectItem value="individual">Privatperson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {formData.type === "company" ? "Firmenname" : "Name"} *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Kundennummer</label>
              <Input
                value={formData.customerNumber}
                onChange={(e) => setFormData({ ...formData, customerNumber: e.target.value })}
              />
            </div>
          </div>

          {formData.type === "company" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Kontaktperson</label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">E-Mail *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Telefon</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Adresse</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">PLZ</label>
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Stadt</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Land</label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sprache für Rechnungen</label>
            <Select value={formData.language} onValueChange={(v: any) => setFormData({ ...formData, language: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Rechnungen und E-Mails werden in dieser Sprache versendet</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Zahlungsziel (Tage)</label>
              <Input
                type="number"
                value={formData.paymentTermsDays}
                onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Standard MwSt (%)</label>
              <Input
                value={formData.defaultVatRate}
                onChange={(e) => setFormData({ ...formData, defaultVatRate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Standard Rabatt (%)</label>
              <Input
                value={formData.defaultDiscount}
                onChange={(e) => setFormData({ ...formData, defaultDiscount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notizen</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Interne Notizen..."
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCustomer.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Speichere..." : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// View Customer Dialog Component
function ViewCustomerDialog({ customerId, onClose }: any) {
  const { data: customer, isLoading } = trpc.customers.byId.useQuery({ id: customerId });
  const { data: invoices } = trpc.invoices.all.useQuery({ customerId });

  if (isLoading || !customer) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <p>Lade Kundendaten...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const totalRevenue = invoices?.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;
  const openInvoices = invoices?.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled").length || 0;
  const paidInvoices = invoices?.filter((inv) => inv.status === "paid").length || 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kundendetails</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Kontaktinformationen</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Typ:</strong> {customer.type === "company" ? "Firma" : "Privatperson"}</p>
                <p><strong>Name:</strong> {customer.name}</p>
                {customer.customerNumber && <p><strong>Kundennummer:</strong> {customer.customerNumber}</p>}
                {customer.contactPerson && <p><strong>Kontaktperson:</strong> {customer.contactPerson}</p>}
                <p><strong>E-Mail:</strong> {customer.email}</p>
                {customer.phone && <p><strong>Telefon:</strong> {customer.phone}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Adresse & Einstellungen</h3>
              <div className="space-y-2 text-sm">
                {customer.address && <p>{customer.address}</p>}
                {customer.city && <p>{customer.postalCode} {customer.city}</p>}
                <p>{customer.country}</p>
                <p><strong>Zahlungsziel:</strong> {customer.paymentTermsDays} Tage</p>
                <p><strong>Standard MwSt:</strong> {customer.defaultVatRate}%</p>
                {parseFloat(customer.defaultDiscount) > 0 && (
                  <p><strong>Standard Rabatt:</strong> {customer.defaultDiscount}%</p>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="font-semibold mb-3">Statistiken</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} CHF</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Rechnungen</p>
                <p className="text-2xl font-bold">{invoices?.length || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Bezahlt</p>
                <p className="text-2xl font-bold text-green-600">{paidInvoices}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Offen</p>
                <p className="text-2xl font-bold text-orange-600">{openInvoices}</p>
              </Card>
            </div>
          </div>

          {/* Invoice History */}
          <div>
            <h3 className="font-semibold mb-3">Rechnungshistorie</h3>
            {!invoices || invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Rechnungen vorhanden</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.invoiceDate).toLocaleDateString("de-CH")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{parseFloat(invoice.totalAmount).toFixed(2)} CHF</p>
                        <p className="text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            invoice.status === "paid" ? "bg-green-100 text-green-800" :
                            invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {invoice.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {customer.notes && (
            <div>
              <h3 className="font-semibold mb-3">Notizen</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
