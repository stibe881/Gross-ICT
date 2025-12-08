import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Invoices from "./Invoices";
import Quotes from "./Quotes";
import { RevenueTrendChart } from "@/components/RevenueTrendChart";

export default function Accounting() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
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
              <h1 className="text-3xl font-bold">Buchhaltung</h1>
              <p className="text-muted-foreground mt-1">Verwalten Sie Rechnungen und Angebote</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/reporting')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Reporting
          </Button>
        </div>

        {/* Revenue Trend Chart */}
        <div className="mb-8">
          <RevenueTrendChart />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="invoices">Rechnungen</TabsTrigger>
            <TabsTrigger value="quotes">Angebote</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-0">
            <Invoices />
          </TabsContent>

          <TabsContent value="quotes" className="mt-0">
            <Quotes />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
