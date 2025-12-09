import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractTemplateManagement } from "@/components/ContractTemplateManagement";
import { useLocation } from "wouter";
import { ContractManagement } from "@/components/ContractManagement";

export default function Contracts() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin')}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Button
            onClick={() => setLocation('/contract-dashboard')}
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        <Tabs defaultValue="contracts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contracts">Verträge</TabsTrigger>
            <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          </TabsList>

          <TabsContent value="contracts">
            <ContractManagement />
          </TabsContent>

          <TabsContent value="templates">
            <ContractTemplateManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
