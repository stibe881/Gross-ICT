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
}

export default function StatusDashboard() {
  const { language } = useLanguage();
  const [statuses, setStatuses] = useState<ServiceStatus[]>([
    { id: 'web', name: 'Web Hosting', status: 'operational', icon: Globe },
    { id: 'api', name: 'API Services', status: 'operational', icon: Server },
    { id: 'network', name: 'Network Backbone', status: 'operational', icon: Wifi },
    { id: 'security', name: 'Security Systems', status: 'operational', icon: Shield },
  ]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate fetching real status
  useEffect(() => {
    const fetchStatus = () => {
      // In a real app, this would fetch from an API
      // For now, we simulate a realistic status check
      // 95% chance of everything being operational
      const random = Math.random();
      if (random > 0.98) {
        setStatuses(prev => prev.map(s => s.id === 'network' ? { ...s, status: 'degraded' } : s));
      } else {
        setStatuses(prev => prev.map(s => ({ ...s, status: 'operational' })));
      }
      setLastUpdated(new Date());
    };

    const interval = setInterval(fetchStatus, 30000); // Update every 30s
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
    <section className="py-12 border-t border-white/5 bg-black/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 blur-md opacity-20 animate-pulse"></div>
              <Activity className="w-6 h-6 text-green-500 relative z-10" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {language === 'de' ? "System Status" : "System Status"}
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
