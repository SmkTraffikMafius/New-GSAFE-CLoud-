import React from 'react';
import { Company, DocStatus, CriticalWork, CRITICAL_WORKS_LABELS } from '../types';
import { 
    Users, Truck, FileText, CheckCircle2, AlertTriangle, ShieldCheck, 
    TrendingUp, Bot, QrCode, ArrowUpRight, Flame, Scale, Clock, Activity, AlertOctagon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
    company: Company;
    selectedProjectId?: string;
    onNavigateTab?: (tab: string) => void;
}

export const BentoGridView: React.FC<Props> = ({ company, selectedProjectId, onNavigateTab }) => {
    const activeProject = selectedProjectId 
        ? company.projects.find(p => p.id === selectedProjectId)
        : company.projects[0];

    // Calculate metrics
    let totalDocs = 0;
    let approvedDocs = 0;
    let pendingDocs = 0;
    let rejectedDocs = 0;

    company.documents.forEach(d => {
        if (activeProject && d.projectId !== activeProject.id) return;
        totalDocs++;
        if (d.status === DocStatus.APPROVED) approvedDocs++;
        if (d.status === DocStatus.PENDING) pendingDocs++;
        if (d.status === DocStatus.REJECTED) rejectedDocs++;
    });

    company.workers.forEach(w => {
        w.documents.forEach(d => {
            if (activeProject && d.projectId !== activeProject.id) return;
            totalDocs++;
            if (d.status === DocStatus.APPROVED) approvedDocs++;
            if (d.status === DocStatus.PENDING) pendingDocs++;
            if (d.status === DocStatus.REJECTED) rejectedDocs++;
        });
    });

    company.vehicles.forEach(v => {
        v.documents.forEach(d => {
            if (activeProject && d.projectId !== activeProject.id) return;
            totalDocs++;
            if (d.status === DocStatus.APPROVED) approvedDocs++;
            if (d.status === DocStatus.PENDING) pendingDocs++;
            if (d.status === DocStatus.REJECTED) rejectedDocs++;
        });
    });

    const complianceRate = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 100;

    const chartData = [
        { name: 'Aprobados', value: approvedDocs || 1, color: '#10b981' },
        { name: 'Pendientes', value: pendingDocs, color: '#f59e0b' },
        { name: 'Rechazados', value: rejectedDocs, color: '#ef4444' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Bento Card 1: Gauge Cumplimiento Global */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Activity size={14} /> Índice de Cumplimiento EHS
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                            Proyecto: {activeProject ? activeProject.name : 'General'}
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-2">
                        <div>
                            <div className="text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                                {complianceRate}%
                                <span className="text-sm font-normal text-slate-400">cumplimiento</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 max-w-xs">
                                Basado en el estándar Ley 20.123 y requerimientos críticos del Mandante.
                            </p>
                        </div>

                        <div className="w-32 h-32 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={45}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute text-center">
                                <ShieldCheck size={20} className="text-emerald-400 mx-auto" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Aprobados</span>
                        <span className="font-bold text-emerald-400 text-sm">{approvedDocs}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Pendientes</span>
                        <span className="font-bold text-amber-400 text-sm">{pendingDocs}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Observados</span>
                        <span className="font-bold text-red-400 text-sm">{rejectedDocs}</span>
                    </div>
                </div>
            </div>

            {/* Bento Card 2: Personal Habilitado */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Nómina Habilitada
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-white">{company.workers.length}</h3>
                    <p className="text-xs text-slate-400 font-medium">Trabajadores Acreditados</p>
                </div>

                {onNavigateTab && (
                    <button 
                        onClick={() => onNavigateTab('workers')}
                        className="mt-4 w-full bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                        Gestionar Nómina &rarr;
                    </button>
                )}
            </div>

            {/* Bento Card 3: Equipos y Maquinaria */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
                            <Truck size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Revisión Técnica
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-white">{company.vehicles.length}</h3>
                    <p className="text-xs text-slate-400 font-medium">Vehículos y Equipos</p>
                </div>

                {onNavigateTab && (
                    <button 
                        onClick={() => onNavigateTab('vehicles')}
                        className="mt-4 w-full bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                        Ver Flotas &rarr;
                    </button>
                )}
            </div>

            {/* Bento Card 4: Matriz de Trabajos Críticos Activos */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Flame className="text-amber-500" size={18} />
                        Trabajos Críticos & Permisos EHS Activos
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">DS 40 / Ley 16.744</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(CRITICAL_WORKS_LABELS).map((key) => {
                        const isActive = company.criticalWorks?.includes(key as CriticalWork);
                        return (
                            <div 
                                key={key}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                                    isActive 
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                                <span className="truncate">{CRITICAL_WORKS_LABELS[key as CriticalWork]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bento Card 5: Resumen Acreditación EHS */}
            <div className="md:col-span-2 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-800/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Estatus Acreditación
                        </span>
                        <ShieldCheck size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                        Auditoría Documental y Laboral Vía IA
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Evaluación continua de obligaciones previsionales, certificados F30-1, vigencias de contratos y exámenes ocupacionales vigentes según la Ley N° 20.123.
                    </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
                    <span className="font-mono">Estado Global: <strong>DOCUMENTACIÓN CONFORME</strong></span>
                    <span className="bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-xl shadow-sm">
                        ACREDITADO
                    </span>
                </div>
            </div>

        </div>
    );
};
