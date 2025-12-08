import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Invoices from "./Invoices";
import Quotes from "./Quotes";

export default function Accounting() {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Buchhaltung</h1>
          <p className="text-muted-foreground mt-1">Verwalten Sie Rechnungen und Angebote</p>
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
