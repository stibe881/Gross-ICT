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
import { Plus, Search, Package, Edit, Trash2, Eye } from "lucide-react";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [viewProductId, setViewProductId] = useState<number | null>(null);

  const { data: products, isLoading, refetch } = trpc.products.all.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    isActive: true,
  });

  const { data: categories } = trpc.products.categories.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Produktkatalog</h1>
            <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Produkte und Dienstleistungen</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Produkt
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Name, SKU oder Beschreibung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Product List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Lade Produkte...</p>
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine Produkte gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all"
                ? "Versuchen Sie andere Suchkriterien."
                : "Erstellen Sie Ihr erstes Produkt, um loszulegen."}
            </p>
            {!searchTerm && categoryFilter === "all" && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Erstes Produkt erstellen
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {product.category && (
                    <p className="text-muted-foreground">
                      <strong>Kategorie:</strong> {product.category}
                    </p>
                  )}
                  {product.description && (
                    <p className="text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Preis:</span>
                    <span className="text-lg font-bold text-primary">
                      {parseFloat(product.unitPrice).toFixed(2)} CHF
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Einheit: {product.unit} | MwSt: {product.vatRate}%
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewProductId(product.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ansehen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditProductId(product.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Product Dialog */}
        <CreateProductDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            refetch();
            setCreateDialogOpen(false);
          }}
        />

        {/* Edit Product Dialog */}
        {editProductId && (
          <EditProductDialog
            productId={editProductId}
            onClose={() => setEditProductId(null)}
            onSuccess={() => {
              refetch();
              setEditProductId(null);
            }}
          />
        )}

        {/* View Product Dialog */}
        {viewProductId && (
          <ViewProductDialog
            productId={viewProductId}
            onClose={() => setViewProductId(null)}
          />
        )}
      </div>
    </div>
  );
}

// Create Product Dialog
function CreateProductDialog({ open, onOpenChange, onSuccess }: any) {
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    unitPrice: "",
    unit: "Stück",
    vatRate: "8.10",
    isActive: true,
  });

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produkt erfolgreich erstellt");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      category: "",
      unitPrice: "",
      unit: "Stück",
      vatRate: "8.10",
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.unitPrice) {
      toast.error("Bitte füllen Sie Name und Preis aus");
      return;
    }

    createProduct.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Produkt erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Produktname *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">SKU/Artikelnummer</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Beschreibung</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Produktbeschreibung..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Kategorie</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="z.B. Hardware, Software, Service"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preis (CHF) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Einheit</label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stück">Stück</SelectItem>
                  <SelectItem value="Stunde">Stunde</SelectItem>
                  <SelectItem value="Tag">Tag</SelectItem>
                  <SelectItem value="Monat">Monat</SelectItem>
                  <SelectItem value="Jahr">Jahr</SelectItem>
                  <SelectItem value="Lizenz">Lizenz</SelectItem>
                  <SelectItem value="Paket">Paket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">MwSt (%)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={createProduct.isPending}>
              {createProduct.isPending ? "Erstelle..." : "Produkt erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Product Dialog
function EditProductDialog({ productId, onClose, onSuccess }: any) {
  const { data: product, isLoading } = trpc.products.byId.useQuery({ id: productId });
  const [formData, setFormData] = useState<any>(null);

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Produkt erfolgreich aktualisiert");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Produkt erfolgreich gelöscht");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Initialize form data when product loads
  if (product && !formData) {
    setFormData({
      sku: product.sku || "",
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      unitPrice: product.unitPrice,
      unit: product.unit,
      vatRate: product.vatRate,
      isActive: product.isActive,
    });
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.unitPrice) {
      toast.error("Bitte füllen Sie Name und Preis aus");
      return;
    }

    updateProduct.mutate({
      id: productId,
      ...formData,
    });
  };

  const handleDelete = () => {
    if (confirm("Möchten Sie dieses Produkt wirklich löschen?")) {
      deleteProduct.mutate({ id: productId });
    }
  };

  if (isLoading || !formData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <p>Lade Produktdaten...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Produkt bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Produktname *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">SKU/Artikelnummer</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Beschreibung</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Kategorie</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preis (CHF) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Einheit</label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stück">Stück</SelectItem>
                  <SelectItem value="Stunde">Stunde</SelectItem>
                  <SelectItem value="Tag">Tag</SelectItem>
                  <SelectItem value="Monat">Monat</SelectItem>
                  <SelectItem value="Jahr">Jahr</SelectItem>
                  <SelectItem value="Lizenz">Lizenz</SelectItem>
                  <SelectItem value="Paket">Paket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">MwSt (%)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Speichere..." : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// View Product Dialog
function ViewProductDialog({ productId, onClose }: any) {
  const { data: product, isLoading } = trpc.products.byId.useQuery({ id: productId });

  if (isLoading || !product) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <p>Lade Produktdaten...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Produktdetails</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Produktinformationen</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {product.name}</p>
                {product.sku && <p><strong>SKU:</strong> {product.sku}</p>}
                {product.category && <p><strong>Kategorie:</strong> {product.category}</p>}
                {product.description && (
                  <div>
                    <strong>Beschreibung:</strong>
                    <p className="text-muted-foreground mt-1">{product.description}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Preis & Einstellungen</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Preis:</strong> {parseFloat(product.unitPrice).toFixed(2)} CHF</p>
                <p><strong>Einheit:</strong> {product.unit}</p>
                <p><strong>MwSt:</strong> {product.vatRate}%</p>
                <p><strong>Status:</strong> {product.isActive ? "Aktiv" : "Inaktiv"}</p>
              </div>
            </div>
          </div>

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
