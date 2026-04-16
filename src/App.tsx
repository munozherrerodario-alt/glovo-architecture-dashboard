/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  Clock, 
  Database, 
  Zap, 
  Layers, 
  ShieldCheck, 
  AlertCircle, 
  Code2, 
  Table as TableIcon, 
  MonitorPlay,
  ArrowRight,
  Server,
  Cpu,
  Lock,
  RefreshCw,
  Terminal,
  ChevronRight,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  FileText,
  BarChart3,
  MapPin,
  Globe,
  TrendingUp,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

// --- Types & Constants ---

type TabType = 'architecture' | 'simulation' | 'report' | 'code' | 'comparison' | 'monitoring';

interface Incident {
  id: string;
  type: 'DELAY' | 'FAILURE' | 'CLAIM';
  zone: string;
  timestamp: Date;
  orderId: string;
}

interface SimulationLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  flow: 'A' | 'B';
}

const ZONES = ['Barcelona', 'Madrid', 'París', 'Milán', 'Londres', 'Berlín'];
const INCIDENT_TYPES = [
  { id: 'DELAY', label: 'Retraso', color: '#fbbf24', icon: Clock },
  { id: 'FAILURE', label: 'Fallo Entrega', color: '#ef4444', icon: AlertTriangle },
  { id: 'CLAIM', label: 'Reclamación', color: '#3b82f6', icon: FileText },
];

// --- Components ---

const CodeBlock = ({ code, language }: { code: string; language: string }) => (
  <div className="bg-[#0a0a0a] text-[#E4E3E0] p-4 rounded-lg font-mono text-xs overflow-x-auto border border-white/10">
    <div className="flex justify-between items-center mb-2 opacity-40 uppercase tracking-widest text-[10px]">
      <span>{language}</span>
      <Terminal className="w-3 h-3" />
    </div>
    <pre><code>{code}</code></pre>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('architecture');
  
  // Simulation State
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isServiceDown, setIsServiceDown] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [idempotencyStore, setIdempotencyStore] = useState<Record<string, string>>({});
  const [batchProgress, setBatchProgress] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-generator effect
  useEffect(() => {
    let interval: any;
    if (isAutoGenerating) {
      interval = setInterval(() => {
        const randomZone = ZONES[Math.floor(Math.random() * ZONES.length)];
        const randomType = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)].id as Incident['type'];
        const orderId = `G-${Math.floor(1000 + Math.random() * 9000)}`;
        triggerEvent(randomType, orderId, randomZone);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoGenerating, isServiceDown]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (flow: 'A' | 'B', type: SimulationLog['type'], message: string) => {
    const newLog: SimulationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      flow
    };
    setLogs(prev => [...prev.slice(-19), newLog]);
  };

  // --- Flow A Simulation ---
  const triggerEvent = async (type: Incident['type'], orderId: string, zone: string) => {
    const idemKey = `idem:${orderId}:${type}`;
    addLog('A', 'INFO', `📥 Evento [${zone}]: ${type} para Pedido ${orderId}`);
    
    // 1. Idempotency Check
    await new Promise(r => setTimeout(r, 400));
    if (idempotencyStore[idemKey] === 'COMPLETED') {
      addLog('A', 'WARNING', `♻️ Idempotencia: ${idemKey} ya procesado.`);
      return;
    }

    setIdempotencyStore(prev => ({ ...prev, [idemKey]: 'PROCESSING' }));

    // 2. Processing
    await new Promise(r => setTimeout(r, 600));
    if (isServiceDown) {
      addLog('A', 'ERROR', `🚫 Circuit Breaker: Fallo en ${zone}. Enviado a DLQ.`);
      setIdempotencyStore(prev => ({ ...prev, [idemKey]: 'FAILED' }));
      return;
    }

    // 3. Success
    const newIncident: Incident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      zone,
      orderId,
      timestamp: new Date()
    };
    setIncidents(prev => [newIncident, ...prev].slice(0, 100));
    addLog('A', 'SUCCESS', `✅ Procesado en ${zone}: Ticket CRM creado.`);
    setIdempotencyStore(prev => ({ ...prev, [idemKey]: 'COMPLETED' }));
  };

  // --- Flow B Simulation ---
  const runBatch = async () => {
    if (isBatchRunning) return;
    setIsBatchRunning(true);
    setBatchProgress(0);
    addLog('B', 'INFO', `🕒 Iniciando Job Cron Diario (03:00 UTC)`);
    
    await new Promise(r => setTimeout(r, 800));
    addLog('B', 'INFO', `🔒 Adquiriendo bloqueo distribuido...`);
    
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 600));
      setBatchProgress(i);
      if (i < 100) addLog('B', 'INFO', `📊 Consolidando Zona: ${ZONES[i/20] || 'Finalizando'}`);
    }

    addLog('B', 'SUCCESS', `📁 Reporte generado exitosamente.`);
    setIsBatchRunning(false);
    setActiveTab('report');
  };

  // --- Data for Charts ---
  const zoneData = useMemo(() => {
    return ZONES.map(zone => ({
      name: zone,
      count: incidents.filter(inc => inc.zone === zone).length,
      delays: incidents.filter(inc => inc.zone === zone && inc.type === 'DELAY').length,
      failures: incidents.filter(inc => inc.zone === zone && inc.type === 'FAILURE').length,
      claims: incidents.filter(inc => inc.zone === zone && inc.type === 'CLAIM').length,
    }));
  }, [incidents]);

  const typeData = useMemo(() => {
    return INCIDENT_TYPES.map(t => ({
      name: t.label,
      value: incidents.filter(inc => inc.type === t.id).length,
      color: t.color
    }));
  }, [incidents]);

  const flowACode = `
# FLUJO A: Consumer Asíncrono (Event-Driven)
import redis
from kafka import KafkaConsumer
from circuitbreaker import circuit

r = redis.Redis(host='localhost', port=6379, db=0)

@circuit(failure_threshold=5, recovery_timeout=60)
def call_downstream_service(payload):
    # Simulación de llamada a CRM o Logística
    pass

def process_event(event):
    idem_key = generate_idempotency_key(event.value)
    if not r.set(f"idem:{idem_key}", "PROCESSING", nx=True, ex=86400):
        if r.get(f"idem:{idem_key}") == b"COMPLETED": return

    try:
        call_downstream_service(event.value)
        r.set(f"idem:{idem_key}", "COMPLETED", ex=86400)
    except Exception as e:
        r.set(f"idem:{idem_key}", "FAILED", ex=3600)
        send_to_dlq(event.value, str(e))
`;

  const flowBCode = `
# FLUJO B: Batch Job (Cron-based)
import redis
import psycopg2

lock_client = redis.Redis(host='localhost', port=6379, db=1)

def run_daily_consolidation():
    if not lock_client.set("lock:daily", "LOCKED", nx=True, ex=7200):
        return # Ya está en ejecución

    try:
        # Consulta desde Réplica de Lectura
        # Cutoff Temporal Estricto
        data = fetch_from_replica(cutoff="23:59:59")
        
        # UPSERT en Destino Particionado
        save_to_s3_parquet(data, partition="YYYY-MM-DD")
    finally:
        lock_client.delete("lock:daily")
`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 p-6 flex justify-between items-center bg-black/50 backdrop-blur-xl sticky top-0 z-[60]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase">
              Glovo <span className="font-light italic opacity-50">Ops Center</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Sistema Online · Arquitectura Moderna v2.0</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex gap-8">
          <div className="text-right">
            <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest mb-1">Eventos en Tiempo Real</p>
            <p className="text-xl font-bold font-mono text-green-400">{incidents.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest mb-1">Zonas Activas</p>
            <p className="text-xl font-bold font-mono text-blue-400">{ZONES.length}</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-20 md:w-64 border-r border-white/10 min-h-[calc(100vh-88px)] bg-black/20 sticky top-[88px]">
          <nav className="p-4 space-y-2">
            {[
              { id: 'architecture', label: 'Arquitectura', icon: Activity },
              { id: 'simulation', label: 'Simulación Live', icon: Play },
              { id: 'report', label: 'Informe Diario', icon: BarChart3 },
              { id: 'code', label: 'Implementación', icon: Code2 },
              { id: 'comparison', label: 'Comparativa', icon: TableIcon },
              { id: 'monitoring', label: 'IA Monitoreo', icon: MonitorPlay },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-black' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="hidden md:block text-xs font-bold uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'architecture' && (
              <motion.div 
                key="arch"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-8 border border-white/10 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl relative overflow-hidden group">
                    <Zap className="absolute -right-8 -top-8 w-48 h-48 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                    <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Flujo A</h2>
                    <p className="text-green-400 font-mono text-[10px] uppercase tracking-widest mb-6">Arquitectura Basada en Eventos</p>
                    <ul className="space-y-4 text-sm opacity-70">
                      <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-green-500" /> Latencia ultra-baja (&lt;2s)</li>
                      <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-green-500" /> Escalabilidad elástica por zona</li>
                      <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-green-500" /> Idempotencia garantizada vía Redis</li>
                    </ul>
                  </div>
                  <div className="p-8 border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent rounded-3xl relative overflow-hidden group">
                    <Clock className="absolute -right-8 -top-8 w-48 h-48 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                    <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Flujo B</h2>
                    <p className="text-blue-400 font-mono text-[10px] uppercase tracking-widest mb-6">Procesamiento Batch Programado</p>
                    <ul className="space-y-4 text-sm opacity-70">
                      <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-blue-500" /> Procesamiento diario consolidado</li>
                      <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-blue-500" /> Aislamiento de carga analítica</li>
                      <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-blue-500" /> Integridad de datos histórica</li>
                    </ul>
                  </div>
                </div>

                <div className="p-8 border border-white/10 bg-white/5 rounded-3xl">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2 opacity-50">
                    <Globe className="w-4 h-4" />
                    Mapa de Integración Global
                  </h3>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center space-y-4 w-full md:w-1/3">
                      <div className="w-20 h-20 mx-auto border border-white/20 flex items-center justify-center rounded-2xl bg-white/5">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-[10px] font-mono uppercase opacity-40">Sistemas Logísticos Zonales</p>
                    </div>
                    <div className="h-px md:h-px md:flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />
                    <div className="text-center space-y-4 w-full md:w-1/3">
                      <div className="w-24 h-24 mx-auto border-2 border-white/40 flex items-center justify-center rounded-3xl bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <Server className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-[10px] font-mono uppercase font-bold tracking-widest">Message Broker Central</p>
                    </div>
                    <div className="h-px md:h-px md:flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />
                    <div className="text-center space-y-4 w-full md:w-1/3">
                      <div className="w-20 h-20 mx-auto border border-white/20 flex items-center justify-center rounded-2xl bg-white/5">
                        <Database className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-[10px] font-mono uppercase opacity-40">DWH Distribuido / S3</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'simulation' && (
              <motion.div 
                key="sim"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left: Zone Grid */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ZONES.map(zone => {
                      const zoneIncidents = incidents.filter(i => i.zone === zone);
                      const lastIncident = zoneIncidents[0];
                      return (
                        <motion.div 
                          key={zone}
                          whileHover={{ scale: 1.02 }}
                          className="p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">{zone}</h4>
                            <MapPin className="w-4 h-4 opacity-20" />
                          </div>
                          <div className="text-3xl font-mono font-bold mb-2">
                            {zoneIncidents.length}
                          </div>
                          <p className="text-[9px] font-mono uppercase opacity-40">Incidencias Hoy</p>
                          
                          {lastIncident && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                lastIncident.type === 'FAILURE' ? 'bg-red-500' : 
                                lastIncident.type === 'DELAY' ? 'bg-amber-500' : 'bg-blue-500'
                              }`} />
                              <span className="text-[9px] font-mono opacity-60 truncate">Última: {lastIncident.type}</span>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="p-8 border border-white/10 bg-white/5 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Controles de Simulación</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsAutoGenerating(!isAutoGenerating)}
                          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isAutoGenerating ? 'bg-green-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {isAutoGenerating ? 'Auto-Gen ON' : 'Auto-Gen OFF'}
                        </button>
                        <button 
                          onClick={() => setIsServiceDown(!isServiceDown)}
                          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isServiceDown ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {isServiceDown ? 'Servicio DOWN' : 'Servicio UP'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {INCIDENT_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => triggerEvent(type.id as any, `G-${Math.floor(1000+Math.random()*9000)}`, ZONES[Math.floor(Math.random()*ZONES.length)])}
                          className="p-4 border border-white/10 bg-white/5 rounded-xl hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
                        >
                          <type.icon className="w-6 h-6" style={{ color: type.color }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{type.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <button 
                        onClick={runBatch}
                        disabled={isBatchRunning}
                        className="w-full p-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isBatchRunning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <History className="w-5 h-5" />}
                        Ejecutar Cierre Diario (Batch)
                      </button>
                      {isBatchRunning && (
                        <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${batchProgress}%` }}
                            className="h-full bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Terminal */}
                <div className="lg:col-span-5 flex flex-col h-[700px]">
                  <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 font-mono text-[11px] overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-white/40" />
                        <span className="uppercase tracking-[0.3em] text-[9px] text-white/40">Stream en Tiempo Real</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                      <AnimatePresence initial={false}>
                        {logs.length === 0 && (
                          <div className="h-full flex items-center justify-center opacity-10 italic uppercase tracking-widest text-[10px]">
                            Escuchando eventos...
                          </div>
                        )}
                        {logs.map((log) => (
                          <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-4 border-l-2 border-white/5 pl-4 py-1"
                          >
                            <span className="opacity-20 shrink-0 text-[9px]">{log.timestamp}</span>
                            <span className={`shrink-0 font-bold text-[9px] ${log.flow === 'A' ? 'text-green-500' : 'text-blue-500'}`}>
                              {log.flow === 'A' ? 'EVT' : 'BTC'}
                            </span>
                            <span className={`
                              ${log.type === 'SUCCESS' ? 'text-white' : ''}
                              ${log.type === 'WARNING' ? 'text-amber-400' : ''}
                              ${log.type === 'ERROR' ? 'text-red-500' : ''}
                              opacity-80
                            `}>
                              {log.message}
                            </span>
                          </motion.div>
                        ))}
                        <div ref={logEndRef} />
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'report' && (
              <motion.div 
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-bold tracking-tighter uppercase">Informe Diario</h2>
                    <p className="text-xs font-mono opacity-40 uppercase tracking-widest mt-2">Consolidación de Incidencias por Zona · 16 Abril 2026</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('simulation')}
                    className="px-6 py-3 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Volver a Live
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Summary Cards */}
                  <div className="p-8 border border-white/10 bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mb-2">Total Incidencias</p>
                    <p className="text-5xl font-bold font-mono">{incidents.length}</p>
                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold">+12% vs Ayer</span>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 p-8 border border-white/10 bg-white/5 rounded-3xl flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Distribución por Tipo</p>
                    </div>
                    <div className="h-32 w-full flex items-center gap-8">
                      {typeData.map(t => (
                        <div key={t.name} className="flex-1 space-y-2">
                          <div className="flex justify-between text-[10px] font-mono uppercase opacity-60">
                            <span>{t.name}</span>
                            <span>{t.value}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(t.value / (incidents.length || 1)) * 100}%` }}
                              className="h-full"
                              style={{ backgroundColor: t.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Chart */}
                <div className="p-8 border border-white/10 bg-white/5 rounded-3xl h-[400px]">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-8 opacity-50">Incidencias por Zona</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff40" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ dy: 10 }}
                      />
                      <YAxis 
                        stroke="#ffffff40" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ dx: -10 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#ffffff05' }}
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '12px', fontSize: '10px' }}
                      />
                      <Bar dataKey="delays" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="failures" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="claims" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeTab === 'code' && (
              <motion.div 
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    Consumer Tiempo Real (A)
                  </h3>
                  <CodeBlock code={flowACode} language="python" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Job Batch Diario (B)
                  </h3>
                  <CodeBlock code={flowBCode} language="python" />
                </div>
              </motion.div>
            )}

            {activeTab === 'comparison' && (
              <motion.div 
                key="comp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-white/10 bg-white/5 rounded-3xl overflow-hidden"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-mono uppercase tracking-[0.2em]">
                      <th className="p-6 border-b border-white/10">Dimensión</th>
                      <th className="p-6 border-b border-white/10">Evento (Tiempo Real)</th>
                      <th className="p-6 border-b border-white/10">Cron (Batch)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono opacity-70">
                    <tr className="border-b border-white/5">
                      <td className="p-6 font-bold uppercase tracking-tighter">Latencia</td>
                      <td className="p-6 text-green-400">&lt; 2 Segundos</td>
                      <td className="p-6">D+1 (24h)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-6 font-bold uppercase tracking-tighter">Trigger</td>
                      <td className="p-6">Push (Webhook/Stream)</td>
                      <td className="p-6">Pull (Scheduler/Cron)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-6 font-bold uppercase tracking-tighter">Idempotencia</td>
                      <td className="p-6">Redis SETNX (Atómico)</td>
                      <td className="p-6">UPSERT / Particiones</td>
                    </tr>
                    <tr>
                      <td className="p-6 font-bold uppercase tracking-tighter">Uso Principal</td>
                      <td className="p-6">Operativa Crítica</td>
                      <td className="p-6">BI & Reporting</td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'monitoring' && (
              <motion.div 
                key="mon"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="p-12 border border-white/10 bg-gradient-to-br from-white/10 to-transparent rounded-3xl relative overflow-hidden">
                  <MonitorPlay className="absolute -right-12 -top-12 w-64 h-64 opacity-5" />
                  <h2 className="text-3xl font-bold uppercase tracking-tighter mb-6 flex items-center gap-4">
                    <ShieldCheck className="w-10 h-10 text-green-400" />
                    Prompt de Observabilidad IA
                  </h2>
                  <div className="bg-black/40 p-8 rounded-2xl border border-white/5 font-mono text-xs leading-relaxed">
                    <p className="text-white/40 mb-4"># SYSTEM_PROMPT_V2</p>
                    <p className="mb-2">Actúa como un SRE de IA especializado en Glovo Ops.</p>
                    <p className="mb-2">1. MONITOREA picos de latencia en Kafka por zona.</p>
                    <p className="mb-2">2. DETECTA 'Event Storms' si Idempotency Hits &gt; 20%.</p>
                    <p className="mb-2">3. VERIFICA que el Batch Job B no solape con ventanas de mantenimiento.</p>
                    <p className="mt-4 text-green-400"># OUTPUT: JSON(severity, zone_impact, remediation)</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 p-6 bg-black/50 flex justify-between items-center font-mono text-[9px] opacity-30 uppercase tracking-[0.4em]">
        <div className="flex items-center gap-4">
          <span>Arquitectura Glovo v2.0</span>
          <div className="w-1 h-1 bg-white rounded-full" />
          <span>Distributed Systems Lab</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          <span>Seguro e Idempotente</span>
        </div>
      </footer>
    </div>
  );
}
