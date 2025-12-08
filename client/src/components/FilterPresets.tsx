import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Save, Star, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FilterPresetsProps {
  filterType: string;
  currentFilters: any;
  onApplyPreset: (filters: any) => void;
}

export function FilterPresets({ filterType, currentFilters, onApplyPreset }: FilterPresetsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const utils = trpc.useUtils();

  const { data: presets } = trpc.filterPresets.list.useQuery({ filterType });

  const saveMutation = trpc.filterPresets.create.useMutation({
    onSuccess: () => {
      toast.success("Filter-Preset gespeichert");
      utils.filterPresets.list.invalidate();
      setShowSaveDialog(false);
      setPresetName("");
      setIsDefault(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.filterPresets.delete.useMutation({
    onSuccess: () => {
      toast.success("Filter-Preset gelöscht");
      utils.filterPresets.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.filterPresets.update.useMutation({
    onSuccess: () => {
      toast.success("Filter-Preset aktualisiert");
      utils.filterPresets.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    saveMutation.mutate({
      name: presetName,
      filterType,
      filters: JSON.stringify(currentFilters),
      isDefault,
    });
  };

  const handleApplyPreset = (preset: any) => {
    try {
      const filters = JSON.parse(preset.filters);
      onApplyPreset(filters);
      toast.success(`Filter "${preset.name}" angewendet`);
    } catch (error) {
      toast.error("Fehler beim Laden des Presets");
    }
  };

  const handleToggleDefault = (preset: any) => {
    updateMutation.mutate({
      id: preset.id,
      isDefault: !preset.isDefault,
    });
  };

  const handleDeletePreset = (presetId: number) => {
    if (confirm("Möchten Sie dieses Preset wirklich löschen?")) {
      deleteMutation.mutate({ id: presetId });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Gespeicherte Filter</h3>
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 hover:bg-white/10"
            >
              <Save className="h-4 w-4 mr-2" />
              Aktuellen Filter speichern
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/95 border-white/10">
            <DialogHeader>
              <DialogTitle>Filter-Preset speichern</DialogTitle>
              <DialogDescription>
                Speichern Sie die aktuellen Filtereinstellungen für schnellen Zugriff.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset-Name</Label>
                <Input
                  id="preset-name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="z.B. Dringende offene Tickets"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-white/20 bg-white/5"
                />
                <Label htmlFor="is-default" className="text-sm font-normal">
                  Als Standard-Filter markieren
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="border-white/20 bg-white/5"
              >
                Abbrechen
              </Button>
              <Button onClick={handleSavePreset} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {presets && presets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset: any) => (
            <div
              key={preset.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApplyPreset(preset)}
                className="h-auto p-0 hover:bg-transparent"
              >
                <span className="text-sm">{preset.name}</span>
              </Button>
              
              {preset.isDefault && (
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              )}

              <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleDefault(preset)}
                  className="h-5 w-5 p-0 hover:bg-white/10"
                  title={preset.isDefault ? "Als Standard entfernen" : "Als Standard setzen"}
                >
                  <Star className={`h-3 w-3 ${preset.isDefault ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePreset(preset.id)}
                  className="h-5 w-5 p-0 hover:bg-red-500/20 text-red-400"
                  title="Löschen"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Keine gespeicherten Filter. Speichern Sie häufig verwendete Filtereinstellungen für schnellen Zugriff.
        </p>
      )}
    </div>
  );
}
