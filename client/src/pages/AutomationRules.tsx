import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Edit, Power, PowerOff, Zap, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  value: string;
}

export default function AutomationRules() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [triggerType, setTriggerType] = useState("ticket_created");
  const [conditions, setConditions] = useState<Condition[]>([{ field: "priority", operator: "equals", value: "urgent" }]);
  const [actions, setActions] = useState<Action[]>([{ type: "set_status", value: "in_progress" }]);

  const utils = trpc.useUtils();

  const { data: rules, isLoading } = trpc.automation.all.useQuery();

  const createMutation = trpc.automation.create.useMutation({
    onSuccess: () => {
      toast.success("Automatisierungsregel erstellt");
      utils.automation.all.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Erstellen");
    },
  });

  const updateMutation = trpc.automation.update.useMutation({
    onSuccess: () => {
      toast.success("Regel aktualisiert");
      utils.automation.all.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Aktualisieren");
    },
  });

  const deleteMutation = trpc.automation.delete.useMutation({
    onSuccess: () => {
      toast.success("Regel gelöscht");
      utils.automation.all.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Löschen");
    },
  });

  const toggleMutation = trpc.automation.toggle.useMutation({
    onSuccess: () => {
      toast.success("Regel-Status geändert");
      utils.automation.all.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler");
    },
  });

  const resetForm = () => {
    setShowCreateDialog(false);
    setEditingRule(null);
    setRuleName("");
    setRuleDescription("");
    setTriggerType("ticket_created");
    setConditions([{ field: "priority", operator: "equals", value: "urgent" }]);
    setActions([{ type: "set_status", value: "in_progress" }]);
  };

  const handleSubmit = () => {
    if (!ruleName.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    const conditionsJson = JSON.stringify(conditions);
    const actionsJson = JSON.stringify(actions);

    if (editingRule) {
      updateMutation.mutate({
        id: editingRule.id,
        name: ruleName,
        description: ruleDescription,
        triggerType,
        conditions: conditionsJson,
        actions: actionsJson,
      });
    } else {
      createMutation.mutate({
        name: ruleName,
        description: ruleDescription,
        triggerType,
        conditions: conditionsJson,
        actions: actionsJson,
      });
    }
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleDescription(rule.description || "");
    setTriggerType(rule.triggerType);
    setConditions(JSON.parse(rule.conditions));
    setActions(JSON.parse(rule.actions));
    setShowCreateDialog(true);
  };

  const addCondition = () => {
    setConditions([...conditions, { field: "status", operator: "equals", value: "open" }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const addAction = () => {
    setActions([...actions, { type: "set_priority", value: "high" }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof Action, value: string) => {
    const newActions = [...actions];
    newActions[index][field] = value;
    setActions(newActions);
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <p className="text-white">Nur Administratoren haben Zugriff auf diese Seite.</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              Zurück zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              Automatisierungsregeln
            </h1>
            <p className="text-gray-400 mt-1">Automatische Aktionen basierend auf Bedingungen</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Regel
          </Button>
        </div>

        {/* Create/Edit Dialog */}
        {showCreateDialog && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {editingRule ? "Regel bearbeiten" : "Neue Regel erstellen"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Regelname *</Label>
                  <Input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="z.B. Dringende Tickets automatisch zuweisen"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Beschreibung</Label>
                  <Textarea
                    value={ruleDescription}
                    onChange={(e) => setRuleDescription(e.target.value)}
                    placeholder="Optionale Beschreibung..."
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Trigger</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket_created">Ticket erstellt</SelectItem>
                      <SelectItem value="ticket_updated">Ticket aktualisiert</SelectItem>
                      <SelectItem value="status_changed">Status geändert</SelectItem>
                      <SelectItem value="priority_changed">Priorität geändert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white text-lg">Bedingungen</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addCondition}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Bedingung
                  </Button>
                </div>
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Select
                        value={condition.field}
                        onValueChange={(value) => updateCondition(index, "field", value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="priority">Priorität</SelectItem>
                          <SelectItem value="category">Kategorie</SelectItem>
                          <SelectItem value="subject">Betreff</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, "operator", value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Gleich</SelectItem>
                          <SelectItem value="not_equals">Nicht gleich</SelectItem>
                          <SelectItem value="contains">Enthält</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={condition.value}
                        onChange={(e) => updateCondition(index, "value", e.target.value)}
                        placeholder="Wert"
                        className="bg-white/5 border-white/10 text-white flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCondition(index)}
                        disabled={conditions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white text-lg">Aktionen</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addAction}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aktion
                  </Button>
                </div>
                <div className="space-y-3">
                  {actions.map((action, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Select
                        value={action.type}
                        onValueChange={(value) => updateAction(index, "type", value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="set_status">Status setzen</SelectItem>
                          <SelectItem value="set_priority">Priorität setzen</SelectItem>
                          <SelectItem value="assign_to">Zuweisen an</SelectItem>
                          <SelectItem value="send_email">E-Mail senden</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={action.value}
                        onChange={(e) => updateAction(index, "value", e.target.value)}
                        placeholder={
                          action.type === "send_email"
                            ? "E-Mail-Adresse"
                            : action.type === "assign_to"
                            ? "Benutzer-ID"
                            : "Wert"
                        }
                        className="bg-white/5 border-white/10 text-white flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAction(index)}
                        disabled={actions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingRule ? "Aktualisieren" : "Erstellen"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rules List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !rules || rules.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">Keine Automatisierungsregeln vorhanden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-white">{rule.name}</CardTitle>
                        <Badge
                          className={
                            rule.isEnabled
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }
                        >
                          {rule.isEnabled ? "Aktiv" : "Inaktiv"}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {rule.triggerType.replace("_", " ")}
                        </Badge>
                      </div>
                      {rule.description && (
                        <CardDescription className="text-gray-400 mt-1">
                          {rule.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: rule.id,
                            isEnabled: rule.isEnabled ? 0 : 1,
                          })
                        }
                        className="border-white/20 bg-white/5 hover:bg-white/10"
                      >
                        {rule.isEnabled ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rule)}
                        className="border-white/20 bg-white/5 hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Möchten Sie diese Regel wirklich löschen?")) {
                            deleteMutation.mutate({ id: rule.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Bedingungen:</h4>
                      <div className="space-y-1">
                        {JSON.parse(rule.conditions).map((cond: Condition, idx: number) => (
                          <p key={idx} className="text-sm text-white">
                            • {cond.field} {cond.operator} "{cond.value}"
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Aktionen:</h4>
                      <div className="space-y-1">
                        {JSON.parse(rule.actions).map((act: Action, idx: number) => (
                          <p key={idx} className="text-sm text-white">
                            • {act.type.replace("_", " ")}: "{act.value}"
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
