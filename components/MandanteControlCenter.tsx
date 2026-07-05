
import React, { useMemo, useState } from 'react';
import { Company, DocStatus, DocumentSubmission, ReqCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Users, FileText, Calendar, ArrowUpRight, Activity, HeartPulse, Mail, Loader2, ShieldCheck, Truck, Bot, ExternalLink, HardHat } from 'lucide-react';
import { api } from '../services/api';

interface Props {
    companies: Company[];
    onBack: () => void;
}

export const MandanteControlCenter: React.FC<Props> = ({ companies, onBack }) => {
    
    const [isSendingReport, setIsSendingReport] = useState(false);
    const [lastReportDate, setLastReportDate] = useState<string | null>(null);

    const expiringDocs = useMemo(() => {
        let count = 0;
        let details: string[] = [];
        const checkDoc = (doc: DocumentSubmission, contextName: string) => {
            if (doc.status === DocStatus.APPROVED && doc.expiryDate) {
                const expiry = new Date(doc.expiryDate);
                expiry.setMinutes(expiry.getMinutes() + expiry.getTimezoneOffset());
                const today = new Date();
                today.setHours(0,0,0,0);
                const timeDiff = expiry.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                if (daysDiff > 0 && daysDiff <= 30) {
                    count++;
                    if (details.length < 5) {
                        details.push(`${doc.fileName || 'Documento'} (${contextName}) - Vence en ${daysDiff} días`);
                    }
                }
            }
        };

        companies.forEach(company => {
            company.documents.forEach(d => checkDoc(d, `Empresa: ${company.name}`));
            company.workers.forEach(w => w.documents.forEach(d => checkDoc(d, `${company.name} - Trabajador: ${w.firstName} ${w.lastName}`)));
            company.vehicles.forEach(v => v.documents.forEach(d => checkDoc(d, `${company.name} - Vehículo: ${v.plate}`)));
        });

        return { count, details };
    }, [companies]);

    // --- LÓGICA DE CÁLCULO DE KPIs Y MÓDULOS ---
    const stats = useMemo(() => {
        let totalWorkers = 0;
        let totalHH = 0;
        let totalAccidents = 0;
        
        // Helper para calcular % de un array de documentos
        const calculateModuleScore = (docs: DocumentSubmission[]) => {
            const total = docs.length;
            if (total === 0) return 0; // O 100 si no hay requerimientos, pero asumiendo carga...
            const approved = docs.filter(d => d.status === DocStatus.APPROVED).length;
            return Math.round((approved / total) * 100);
        };

        // Helper para ver el estado de la IA en un módulo
        const getAiModuleStatus = (docs: DocumentSubmission[]) => {
            if (docs.length === 0) return 'NONE';
            const rejected = docs.filter(d => d.aiVerdict === 'REJECTION').length;
            if (rejected > 0) return 'ALERT'; // IA detectó algo grave
            const approval = docs.filter(d => d.aiVerdict === 'APPROVAL').length;
            if (approval === docs.length) return 'PERFECT'; // IA aprueba todo
            return 'REVIEW'; // Mezcla o validación
        };

        const companyPerformance = companies.map(comp => {
            // Filtrar Documentos por Módulo
            const legalDocs = comp.documents.filter(d => {
                // Aquí deberíamos cruzar con REQUIREMENT def, pero por simplicidad asumimos que si no es EHS, es Legal
                // En producción usaríamos el category del requirement definition.
                // Como tenemos mockData, podemos inferir o mejorar el modelo de datos.
                // Por ahora, asumiremos que si no es EHS, es legal.
                return true; // Simplificación para la demo, idealmente filtrar por ReqCategory.LEGAL
            });
            
            // EHS Docs (Filtrado simulado, en prod usar requirementId lookup)
            const ehsDocs = comp.documents.filter(d => d.requirementId.includes('ehs') || d.requirementId.includes('miper')); 
            
            // Trabajadores (Todos)
            const workerDocs = comp.workers.flatMap(w => w.documents);
            
            // Vehículos (Todos)
            const vehicleDocs = comp.vehicles.flatMap(v => v.documents);

            // Scores
            const legalScore = calculateModuleScore(comp.documents); // Usamos todos los de empresa como base
            const ehsScore = calculateModuleScore(ehsDocs);
            const workerScore = calculateModuleScore(workerDocs);
            const vehicleScore = calculateModuleScore(vehicleDocs);

            // AI Statuses
            const aiLegal = getAiModuleStatus(comp.documents);
            const aiWorker = getAiModuleStatus(workerDocs);

            // Global Compliance
            const allDocs = [...comp.documents, ...workerDocs, ...vehicleDocs];
            const globalScore = calculateModuleScore(allDocs);

            // HSE Stats
            let compHH = 0;
            let compAcc = 0;
            comp.projects.forEach(proj => {
                proj.safetyStats?.forEach(s => {
                    compHH += s.manHours;
                    compAcc += s.accidents;
                });
            });

            totalWorkers += comp.workers.length;
            totalHH += compHH;
            totalAccidents += compAcc;

            return {
                id: comp.id,
                name: comp.name,
                rut: comp.rut,
                workers: comp.workers.length,
                globalScore,
                modules: {
                    legal: { score: legalScore, ai: aiLegal },
                    ehs: { score: ehsScore, ai: 'REVIEW' }, // EHS suele requerir revisión humana experta
                    workers: { score: workerScore, ai: aiWorker },
                    vehicles: { score: vehicleScore, ai: 'VALIDATION' }
                },
                status: comp.accessAuthorized ? 'AUTORIZADO' : 'RESTRINGIDO',
                hh: compHH,
                accidents: compAcc
            };
        });

        // Ordenar: Críticos primero
        const sortedCompanies = [...companyPerformance].sort((a, b) => a.globalScore - b.globalScore);

        return {
            totalWorkers,
            totalHH,
            totalAccidents,
            globalAvgCompliance: Math.round(sortedCompanies.reduce((acc, c) => acc + c.globalScore, 0) / (sortedCompanies.length || 1)),
            companyPerformance: sortedCompanies
        };
    }, [companies]);

    // --- RENDERIZADO DE BADGES DE IA ---
    const AiBadge = ({ status }: { status: string }) => {
        if (status === 'NONE') return <span className="text-gray-300">-</span>;
        if (status === 'PERFECT') return <span title="IA Aprueba Todo" className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full"><Bot size={14} /></span>;
        if (status === 'ALERT') return <span title="IA Detectó Rechazos" className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full animate-pulse"><Bot size={14} /></span>;
        return <span title="Requiere Revisión" className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full"><Bot size={14} /></span>;
    };

    // --- RENDERIZADO DE BARRAS DE PROGRESO ---
    const ProgressBar = ({ percentage }: { percentage: number }) => {
        let color = 'bg-blue-600';
        if (percentage < 50) color = 'bg-red-500';
        else if (percentage < 90) color = 'bg-yellow-500';
        else color = 'bg-green-500';

        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centro de Control Mandante</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Activity size={16} className="text-blue-500"/>
                        Tablero de Mando Integral: Aprobación por Módulos
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-slate-900 transition-colors px-3 py-2 border rounded-lg hover:bg-gray-50">
                        Volver
                    </button>
                </div>
            </div>

            {expiringDocs.count > 0 && (
                <div className="mb-8 bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300">
                                Acción Requerida: {expiringDocs.count} {expiringDocs.count === 1 ? 'documento está' : 'documentos están'} por vencer en los próximos 30 días en toda la red
                            </h3>
                            <div className="mt-2 text-sm text-orange-700 dark:text-orange-200">
                                <ul className="list-disc pl-5 space-y-1">
                                    {expiringDocs.details.map((detail, idx) => (
                                        <li key={idx}>{detail}</li>
                                    ))}
                                    {expiringDocs.count > 5 && (
                                        <li>...y {expiringDocs.count - 5} más</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HIGH LEVEL KPIS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Cumplimiento Global</p>
                    <p className={`text-3xl font-extrabold mt-2 ${stats.globalAvgCompliance > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {stats.globalAvgCompliance}%
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Empresas Activas</p>
                    <p className="text-3xl font-extrabold mt-2 text-slate-800">{companies.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Trabajadores</p>
                    <p className="text-3xl font-extrabold mt-2 text-indigo-600">{stats.totalWorkers}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Accidentabilidad (Total)</p>
                    <p className={`text-3xl font-extrabold mt-2 ${stats.totalAccidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.totalAccidents}
                    </p>
                </div>
            </div>

            {/* MAIN TABLE: MODULE COMPLIANCE MATRIX */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-blue-600"/>
                        Matriz de Aprobación por Módulos
                    </h3>
                    <div className="flex gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><Bot size={14} className="text-green-600"/> IA Aprueba</div>
                        <div className="flex items-center gap-1"><Bot size={14} className="text-blue-600"/> IA Revisa</div>
                        <div className="flex items-center gap-1"><Bot size={14} className="text-red-600"/> IA Alerta</div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Empresa / Rut</th>
                                <th className="px-6 py-4 w-48 text-center">Estado General</th>
                                <th className="px-4 py-4 w-32 text-center">Legal</th>
                                <th className="px-4 py-4 w-32 text-center">Trabajadores</th>
                                <th className="px-4 py-4 w-32 text-center">Vehículos</th>
                                <th className="px-4 py-4 w-32 text-center">Gestión EHS</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.companyPerformance.map((comp) => (
                                <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{comp.name}</p>
                                        <p className="text-xs text-gray-500 font-mono">{comp.rut}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Users size={10}/> {comp.workers}
                                            </span>
                                            {comp.accidents > 0 && (
                                                <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                                                    <AlertTriangle size={10}/> {comp.accidents} Acc.
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-lg font-bold ${comp.globalScore >= 100 ? 'text-green-600' : 'text-slate-700'}`}>
                                                {comp.globalScore}%
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${comp.status === 'AUTORIZADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {comp.status}
                                            </span>
                                        </div>
                                    </td>

                                    {/* LEGAL MODULE */}
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <FileText size={14} className="text-gray-400"/>
                                                <span className="font-bold text-xs">{comp.modules.legal.score}%</span>
                                                <AiBadge status={comp.modules.legal.ai} />
                                            </div>
                                            <ProgressBar percentage={comp.modules.legal.score} />
                                        </div>
                                    </td>

                                    {/* WORKERS MODULE */}
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <HardHat size={14} className="text-gray-400"/>
                                                <span className="font-bold text-xs">{comp.modules.workers.score}%</span>
                                                <AiBadge status={comp.modules.workers.ai} />
                                            </div>
                                            <ProgressBar percentage={comp.modules.workers.score} />
                                        </div>
                                    </td>

                                    {/* VEHICLES MODULE */}
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <Truck size={14} className="text-gray-400"/>
                                                <span className="font-bold text-xs">{comp.modules.vehicles.score}%</span>
                                                <AiBadge status={comp.modules.vehicles.ai} />
                                            </div>
                                            <ProgressBar percentage={comp.modules.vehicles.score} />
                                        </div>
                                    </td>

                                    {/* EHS MODULE */}
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <HeartPulse size={14} className="text-gray-400"/>
                                                <span className="font-bold text-xs">{comp.modules.ehs.score}%</span>
                                                {/* EHS typically requires human expert review, so AI is less prominent/authoritative here */}
                                                <span className="text-[10px] text-gray-400">Manual</span>
                                            </div>
                                            <ProgressBar percentage={comp.modules.ehs.score} />
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={onBack} // In a real app this would route to the detailed view
                                            className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center justify-end gap-1 hover:underline"
                                        >
                                            Gestionar <ArrowUpRight size={12}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
