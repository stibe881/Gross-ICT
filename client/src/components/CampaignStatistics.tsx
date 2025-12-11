import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Mail,
  AlertTriangle,
  UserMinus,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";

interface CampaignStatisticsProps {
  campaignId: number;
  campaignName?: string;
}

export default function CampaignStatistics({
  campaignId,
  campaignName,
}: CampaignStatisticsProps) {
  const [, setLocation] = useLocation();

  // Fetch campaign statistics
  const { data: stats, isLoading } =
    trpc.newsletterTracking.getCampaignStats.useQuery({ campaignId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Lade Statistiken...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Keine Statistiken verfügbar
          </p>
          <Button
            onClick={() => setLocation("/newsletter")}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Gesendet",
      value: stats.totalSent,
      icon: Mail,
      color: "blue",
      description: "Gesamt versendete E-Mails",
    },
    {
      title: "Zugestellt",
      value: stats.totalDelivered,
      icon: TrendingUp,
      color: "green",
      description: `${((stats.totalDelivered / stats.totalSent) * 100).toFixed(1)}% Zustellrate`,
    },
    {
      title: "Geöffnet",
      value: stats.uniqueOpens,
      icon: Mail,
      color: "purple",
      description: `${stats.openRate.toFixed(1)}% Öffnungsrate`,
    },
    {
      title: "Geklickt",
      value: stats.uniqueClicks,
      icon: MousePointerClick,
      color: "indigo",
      description: `${stats.clickRate.toFixed(1)}% Click-Rate`,
    },
    {
      title: "Bounced",
      value: stats.totalBounced,
      icon: AlertTriangle,
      color: "red",
      description: `${stats.bounceRate.toFixed(1)}% Bounce-Rate`,
    },
    {
      title: "Abgemeldet",
      value: stats.totalUnsubscribed,
      icon: UserMinus,
      color: "gray",
      description: `${stats.unsubscribeRate.toFixed(1)}% Abmelderate`,
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          border: "border-blue-500/20",
        };
      case "green":
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          border: "border-green-500/20",
        };
      case "purple":
        return {
          bg: "bg-purple-500/10",
          text: "text-purple-600",
          border: "border-purple-500/20",
        };
      case "indigo":
        return {
          bg: "bg-indigo-500/10",
          text: "text-indigo-600",
          border: "border-indigo-500/20",
        };
      case "red":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          border: "border-red-500/20",
        };
      case "gray":
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          border: "border-gray-500/20",
        };
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600",
          border: "border-gray-500/20",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => setLocation("/newsletter")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Kampagnen-Statistiken
                </h1>
              </div>
              {campaignName && (
                <p className="text-gray-600 dark:text-gray-400">
                  {campaignName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card) => {
            const colors = getColorClasses(card.color);
            const Icon = card.icon;

            return (
              <Card
                key={card.title}
                className={`p-6 border-2 ${colors.border} bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${colors.bg} rounded-lg`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Engagement Metrics */}
        <Card className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Engagement-Metriken
          </h2>
          <div className="space-y-6">
            {/* Open Rate Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Öffnungsrate
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {stats.openRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.openRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.uniqueOpens} von {stats.totalSent} Empfängern haben die
                E-Mail geöffnet
              </p>
            </div>

            {/* Click Rate Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Click-Rate
                </span>
                <span className="text-sm font-bold text-indigo-600">
                  {stats.clickRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.clickRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.uniqueClicks} von {stats.totalSent} Empfängern haben auf
                einen Link geklickt
              </p>
            </div>

            {/* Bounce Rate Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bounce-Rate
                </span>
                <span className="text-sm font-bold text-red-600">
                  {stats.bounceRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.bounceRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalBounced} E-Mails konnten nicht zugestellt werden
              </p>
            </div>

            {/* Unsubscribe Rate Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Abmelderate
                </span>
                <span className="text-sm font-bold text-gray-600">
                  {stats.unsubscribeRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-gray-500 to-gray-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.unsubscribeRate, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalUnsubscribed} Empfänger haben sich abgemeldet
              </p>
            </div>
          </div>
        </Card>

        {/* Performance Summary */}
        <Card className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 mt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Performance-Zusammenfassung
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Gesamt-Interaktionen
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Gesamt-Öffnungen:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.totalOpened}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Einzigartige Öffnungen:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.uniqueOpens}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Gesamt-Klicks:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.totalClicked}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Einzigartige Klicks:
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.uniqueClicks}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Zustellungs-Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Zugestellt:
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    {stats.totalDelivered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Bounced:
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {stats.totalBounced}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Abgemeldet:
                  </span>
                  <span className="text-sm font-bold text-gray-600">
                    {stats.totalUnsubscribed}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
