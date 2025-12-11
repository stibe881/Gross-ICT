import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Plus,
  Mail,
  Clock,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function AutomationManagement() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, refetch } = trpc.newsletterAutomation.list.useQuery({
    page,
    pageSize,
  });

  const toggleStatusMutation = trpc.newsletterAutomation.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success("Automation status updated");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const deleteMutation = trpc.newsletterAutomation.delete.useMutation({
    onSuccess: () => {
      toast.success("Automation deleted");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete automation");
    },
  });

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete automation "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    switch (triggerType) {
      case "welcome":
        return "Welcome Email";
      case "birthday":
        return "Birthday";
      case "re_engagement":
        return "Re-Engagement";
      case "custom":
        return "Custom Trigger";
      default:
        return triggerType;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/newsletter">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Email Automations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage automated email workflows and sequences
              </p>
            </div>
          </div>
          <Link href="/admin/automation/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Automation
            </Button>
          </Link>
        </div>

        {/* Automations List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Loading automations...
            </p>
          </div>
        ) : data?.automations.length === 0 ? (
          <Card className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No automations yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first automation to start sending automated emails
            </p>
            <Link href="/admin/automation/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {data?.automations.map((automation: any) => (
              <Card key={automation.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {automation.name}
                      </h3>
                      <Badge
                        variant={automation.status === "active" ? "default" : "secondary"}
                      >
                        {automation.status}
                      </Badge>
                      <Badge variant="outline">
                        {getTriggerLabel(automation.triggerType)}
                      </Badge>
                    </div>

                    {automation.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {automation.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{automation.stepCount || 0} steps</span>
                      </div>
                      {automation.segmentId && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Segment #{automation.segmentId}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Created {new Date(automation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleToggleStatus(automation.id, automation.status)
                      }
                      disabled={toggleStatusMutation.isPending}
                    >
                      {automation.status === "active" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Link href={`/admin/automation/edit/${automation.id}`}>
                      <Button variant="outline">Edit</Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(automation.id, automation.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination - Hidden since API doesn't return pagination */}
        {false && data && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={false}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
