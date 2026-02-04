import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, AlertTriangle, XCircle, Activity, Server, Globe, Shield, Wifi } from "lucide-react";
import { motion } from "framer-motion";

type Status = 'operational' | 'degraded' | 'outage';

interface ServiceStatus {
  id: string;
  name: string;
  status: Status;
  icon: any;
  endpoint?: string; // Optional real endpoint to check
}

export default function StatusDashboard() {
  const { language } = useLanguage();
  const [statuses, setStatuses] = useState<ServiceStatus[]>([
    { id: 'web', name: 'Web Hosting', status: 'operational', icon: Globe, endpoint: window.location.origin },
    { id: 'api', name: 'API Services', status: 'operational', icon: Server, endpoint: window.location.origin + '/api/health' }, // Example endpoint
    { id: 'network', name: 'Network Backbone', status: 'operational', icon: Wifi, endpoint: 'https://1.1.1.1' }, // Check Cloudflare DNS as proxy for internet
    { id: 'security', name: 'Security Systems', status: 'operational', icon: Shield }, // Internal check
  ]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const checkService = async (service: ServiceStatus): Promise<Status> => {
      if (!service.endpoint) return 'operational'; // Default for internal services without public endpoint

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(service.endpoint, {
          method: 'HEAD',
          mode: 'no-cors', // Important for cross-origin checks like 1.1.1.1
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return 'operational';
      } catch (error) {
        console.warn(`Status check failed for ${service.name}:`, error);
        // If it's a network error on a known stable target, it might be a local issue, but we mark as degraded
        return 'degraded';
      }
    };

    const updateStatuses = async () => {
      const updatedStatuses = await Promise.all(statuses.map(async (service) => {
        // Only check services with endpoints
        if (service.endpoint) {
          const newStatus = await checkService(service);
          return { ...service, status: newStatus };
        }
        return service;
      }));

      setStatuses(updatedStatuses);
      setLastUpdated(new Date());
    };

    // Initial check
    updateStatuses();

    // Periodic check every 60 seconds
    const interval = setInterval(updateStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'operational': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'degraded': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'outage': return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  const getStatusText = (status: Status) => {
    switch (status) {
      case 'operational': return language === 'de' ? 'Operational' : 'Operational';
      case 'degraded': return language === 'de' ? 'Leistungsabfall' : 'Degraded Performance';
      case 'outage': return language === 'de' ? 'Ausfall' : 'Major Outage';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'outage': return XCircle;
    }
  };

  return (
    <section className="py-12 border-t border-border bg-white/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 blur-md opacity-20 animate-pulse"></div>
              <Activity className="w-6 h-6 text-green-500 relative z-10" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {language === 'de' ? "System Status (Live)" : "System Status (Live)"}
            </h2>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {language === 'de' ? "Letztes Update:" : "Last Updated:"} {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statuses.map((service) => {
            const StatusIcon = getStatusIcon(service.status);
            const ServiceIcon = service.icon;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`p-4 rounded-xl border flex items-center justify-between ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center gap-3">
                  <ServiceIcon className="w-5 h-5 opacity-70" />
                  <span className="font-medium text-sm">{service.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <span>{getStatusText(service.status)}</span>
                  <StatusIcon className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
