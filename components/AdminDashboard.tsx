
import React, { useMemo, useState, useEffect } from 'react';
import { Company, DocStatus, EntityType, ReqCategory, DocumentSubmission, AuditLog, Worker } from '../types';
import { DocumentList } from './DocumentList';
import { REQUIREMENTS } from '../mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ShieldCheck, ShieldAlert, Users, Building2, Truck, GraduationCap, HeartPulse, Scale, FolderOpen, Activity, AlertOctagon, CheckCircle2, AlertTriangle, FileText, Download, List, Printer } from 'lucide-react';
import { api } from '../services/api';

interface Props {
    company: Company;
    onStatusChange: (docId: string, newStatus: DocStatus, comment?: string, expiryDate?: string, startDate?: string) => void;
    onAuthorizeAccess: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ company, onStatusChange, onAuthorizeAccess }) => {
    // Estado para las Pestañas de Auditoría
    const [activeTab, setActiveTab] = useState<'company' | 'workers' | 'vehicles' | 'hse' | 'audit'>('company');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    
    // PROJECT SELECTION
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    useEffect(() => {
        if (company.projects && company.projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(company.projects[0].id);
        }
    }, [company.projects, selectedProjectId]);

    // Load Audit Logs when tab is selected
    useEffect(() => {
        if (activeTab === 'audit') {
            api.audit.getLogs().then(logs => setAuditLogs(logs));
        }
    }, [activeTab]);

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

        company.documents.forEach(d => checkDoc(d, 'Empresa'));
        company.workers.forEach(w => w.documents.forEach(d => checkDoc(d, `Trabajador: ${w.firstName} ${w.lastName}`)));
        company.vehicles.forEach(v => v.documents.forEach(d => checkDoc(d, `Vehículo: ${v.plate}`)));

        return { count, details };
    }, [company]);

    const currentProject = company.projects.find(p => p.id === selectedProjectId);

    // Categorización de Requirements
    const companyReqs = REQUIREMENTS.filter(r => r.entityType === EntityType.COMPANY);
    const vehicleReqs = REQUIREMENTS.filter(r => r.entityType === EntityType.VEHICLE);
    
    // Helper to get requirements for a specific worker
    const getWorkerRequirements = (worker: Worker) => {
        return REQUIREMENTS.filter(r => {
            if (r.entityType !== EntityType.WORKER) return false;
            
            // 1. Check critical works
            if (r.linkedCriticalWork && !company.criticalWorks?.includes(r.linkedCriticalWork)) {
                return false;
            }

            // 2. Check roles
            if (r.linkedRoles) {
                return r.linkedRoles.includes(worker.role);
            }

            return true;
        });
    };

    // Filter Helper
    const getProjectDocs = (docs: DocumentSubmission[]) => docs.filter(d => d.projectId === selectedProjectId);

    // Lógica para calcular estadísticas
    const stats = useMemo(() => {
        if (!selectedProjectId || !currentProject) return { approved: 0, rejected: 0, pending: 0, inReview: 0, totalReqs: 0, compliance: 0, hse: { hh: 0, acc: 0, inc: 0, nm: 0, dp: 0 } };

        let totalReqs = 0;
        let approved = 0;
        let rejected = 0;
        let pending = 0;
        let inReview = 0;

        const countDocs = (allDocs: DocumentSubmission[], reqsCount: number) => {
            totalReqs += reqsCount;
            // Filtramos los documentos que pertenecen a este proyecto
            const projectDocs = allDocs.filter(d => d.projectId === selectedProjectId);
            
            projectDocs.forEach(d => {
                if (d.status === DocStatus.APPROVED) approved++;
                if (d.status === DocStatus.REJECTED) rejected++;
                if (d.status === DocStatus.IN_REVIEW) inReview++;
            });
            // Pending es total requerido menos los que existen (en cualquier estado)
            pending += (reqsCount - projectDocs.length);
        };

        countDocs(company.documents, companyReqs.length);

        company.workers.forEach(w => {
            const reqs = getWorkerRequirements(w);
            countDocs(w.documents, reqs.length);
        });

        company.vehicles.forEach(v => {
            countDocs(v.documents, vehicleReqs.length);
        });

        const compliance = totalReqs > 0 ? Math.round((approved / totalReqs) * 100) : 0;

        // HSE Stats aggregation
        let hh = 0, acc = 0, inc = 0, nm = 0, dp = 0;
        if (currentProject.safetyStats) {
            currentProject.safetyStats.forEach(s => {
                hh += s.manHours;
                acc += s.accidents;
                inc += s.incidents;
                nm += s.nearMisses;
                dp += s.propertyDamage;
            });
        }

        return { approved, rejected, pending, inReview, totalReqs, compliance, hse: { hh, acc, inc, nm, dp } };
    }, [company, companyReqs.length, vehicleReqs.length, selectedProjectId]);

    const chartData = [
        { name: 'Aprobado', value: stats.approved, color: '#10B981' }, 
        { name: 'En Revisión', value: stats.inReview, color: '#F59E0B' }, 
        { name: 'Rechazado', value: stats.rejected, color: '#EF4444' }, 
        { name: 'Pendiente', value: stats.pending, color: '#9CA3AF' }, 
    ].filter(d => d.value > 0);

    const isFullyCompliant = stats.compliance === 100 && stats.rejected === 0 && stats.pending === 0 && stats.inReview === 0;

    const handleExportReport = () => {
        // Flatten data for CSV
        const reportData = [];
        // Company Docs
        company.documents.forEach(d => reportData.push({ Entity: 'Company', Name: company.name, Doc: d.fileName, Status: d.status, Expiry: d.expiryDate }));
        // Worker Docs
        company.workers.forEach(w => w.documents.forEach(d => reportData.push({ Entity: 'Worker', Name: `${w.firstName} ${w.lastName}`, Doc: d.fileName, Status: d.status, Expiry: d.expiryDate })));
        
        api.reports.generateCSV(reportData, `Reporte_Cumplimiento_${company.name}_${new Date().toISOString().slice(0,10)}`);
    };

    if (!currentProject) return <div className="p-8 text-center text-gray-500">Seleccione un contrato para auditar...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header del Dashboard */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Control de Acceso Mandante</h1>
                    <p className="text-gray-500 mt-1">Auditando Empresa: <span className="font-semibold text-gray-700 text-lg">{company.name}</span></p>
                </div>

                {/* PROJECT SELECTOR */}
                <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                        <FolderOpen size={20} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Auditando Contrato</label>
                        <select 
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="mt-1 block w-64 pl-2 pr-8 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md font-semibold text-gray-900"
                        >
                            {company.projects.map(p => (
                                <option key={p.id} value={p.id}>{p.contractNumber} - {p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleExportReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Download size={16}/> Exportar Informe
                    </button>
                    <button
                        onClick={onAuthorizeAccess}
                        disabled={!isFullyCompliant}
                        className={`px-6 py-3 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-all
                            ${isFullyCompliant 
                                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer ring-2 ring-green-300' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'}`}
                    >
                        {company.accessAuthorized ? <ShieldCheck /> : <ShieldAlert />}
                        {company.accessAuthorized ? 'Acceso Vigente' : 'Autorizar Ingreso'}
                    </button>
                </div>
            </div>

            {expiringDocs.count > 0 && (
                <div className="mb-6 bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300">
                                Acción Requerida: {expiringDocs.count} {expiringDocs.count === 1 ? 'documento está' : 'documentos están'} por vencer en los próximos 30 días
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

            {/* KPI Cards (Documental) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Cumplimiento {currentProject.contractNumber}</p>
                        <p className={`text-3xl font-bold ${stats.compliance >= 90 ? 'text-green-600' : stats.compliance >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {stats.compliance}%
                        </p>
                    </div>
                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center">
                        <PieChart className="text-gray-400" size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-yellow-400">
                    <p className="text-sm font-medium text-gray-500">Por Validar</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.inReview}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-sm font-medium text-gray-500">Rechazados</p>
                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Documentos</p>
                    <p className="text-3xl font-bold text-gray-700">{stats.totalReqs}</p>
                </div>
            </div>

            {/* NEW: SAFETY STATS SUMMARY ROW */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                 <div className="bg-slate-800 rounded-lg p-3 text-white shadow flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">HH Totales</span>
                    <span className="text-xl font-mono font-bold text-blue-300">{stats.hse.hh.toLocaleString()}</span>
                 </div>
                 <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><AlertTriangle size={12}/> Accidentes</span>
                    <span className={`text-xl font-bold ${stats.hse.acc > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.hse.acc}</span>
                 </div>
                 <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Incidentes</span>
                    <span className="text-xl font-bold text-orange-600">{stats.hse.inc}</span>
                 </div>
                 <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Near Miss</span>
                    <span className="text-xl font-bold text-yellow-600">{stats.hse.nm}</span>
                 </div>
                 <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Daño Prop.</span>
                    <span className="text-xl font-bold text-gray-700">{stats.hse.dp}</span>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Gráfico */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Estados</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Panel de Auditoría Completa (Tabs) */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
                     <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">Panel de Auditoría de Documentos</h3>
                        <p className="text-sm text-gray-500">Filtrado por Contrato: <strong>{currentProject.name}</strong></p>
                     </div>

                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 px-6">
                        <nav className="-mb-px flex space-x-8">
                            <button onClick={() => setActiveTab('company')} className={`${activeTab === 'company' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}><Building2 size={18} />Empresa</button>
                            <button onClick={() => setActiveTab('workers')} className={`${activeTab === 'workers' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}><Users size={18} />Trabajadores</button>
                            <button onClick={() => setActiveTab('vehicles')} className={`${activeTab === 'vehicles' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}><Truck size={18} />Vehículos</button>
                            <button onClick={() => setActiveTab('hse')} className={`${activeTab === 'hse' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 text-green-700`}><Activity size={18} />Gestión HSE</button>
                            <button onClick={() => setActiveTab('audit')} className={`${activeTab === 'audit' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}><List size={18} />Logs Auditoría</button>
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 overflow-y-auto max-h-[600px] bg-slate-50">
                         {activeTab === 'company' && (
                            <section className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h4 className="text-md font-bold text-gray-800 mb-4">Documentación Corporativa</h4>
                                <DocumentList 
                                    requirements={companyReqs} 
                                    documents={getProjectDocs(company.documents)} 
                                    entityId={company.id}
                                    readOnly={true} // Mode Admin
                                    onUpload={() => {}}
                                    onStatusChange={onStatusChange}
                                />
                            </section>
                        )}

                        {activeTab === 'workers' && (
                            <div className="space-y-6">
                                {company.workers.map(worker => {
                                    // Calculate requirements dynamically for this worker
                                    const workerReqs = getWorkerRequirements(worker);
                                    const workerReqsLegal = workerReqs.filter(r => r.category === ReqCategory.LEGAL || !r.category);
                                    const workerReqsHealth = workerReqs.filter(r => r.category === ReqCategory.HEALTH);
                                    const workerReqsTraining = workerReqs.filter(r => r.category === ReqCategory.TRAINING);
                                    const workerReqsCritical = workerReqs.filter(r => r.category === ReqCategory.CRITICAL);

                                    return (
                                        <div key={worker.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-md font-bold text-gray-900">{worker.firstName} {worker.lastName}</h3>
                                                    <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                                                        {worker.role} 
                                                        {(worker.role.includes('Conductor') || worker.role.includes('Operador')) && <span className="bg-blue-100 text-blue-700 px-1 rounded text-[10px] font-bold">Licencia Requerida</span>}
                                                    </p>
                                                </div>
                                                <div className="text-xs bg-white px-2 py-1 rounded border">RUT: {worker.rut}</div>
                                            </div>

                                            <div className="p-4 space-y-4">
                                                {/* Critical Requirements (If any) */}
                                                {workerReqsCritical.length > 0 && (
                                                    <div className="bg-red-50 p-3 rounded border border-red-100">
                                                        <h5 className="flex items-center gap-2 text-xs font-bold text-red-600 mb-2 uppercase"><AlertTriangle size={14}/> Críticos</h5>
                                                        <DocumentList requirements={workerReqsCritical} documents={getProjectDocs(worker.documents)} entityId={worker.id} readOnly={true} onUpload={() => {}} onStatusChange={onStatusChange}/>
                                                    </div>
                                                )}

                                                <div><h5 className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase"><Scale size={14}/> Legal y Contractual</h5><DocumentList requirements={workerReqsLegal} documents={getProjectDocs(worker.documents)} entityId={worker.id} readOnly={true} onUpload={() => {}} onStatusChange={onStatusChange}/></div>
                                                
                                                {(workerReqsHealth.length > 0 || workerReqsTraining.length > 0) && (
                                                    <div className="flex flex-col gap-4">
                                                        {workerReqsHealth.length > 0 && (
                                                            <div><h5 className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase"><HeartPulse size={14}/> Salud</h5><DocumentList requirements={workerReqsHealth} documents={getProjectDocs(worker.documents)} entityId={worker.id} readOnly={true} onUpload={() => {}} onStatusChange={onStatusChange}/></div>
                                                        )}
                                                        {workerReqsTraining.length > 0 && (
                                                            <div><h5 className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 uppercase"><GraduationCap size={14}/> Capacitación</h5><DocumentList requirements={workerReqsTraining} documents={getProjectDocs(worker.documents)} entityId={worker.id} readOnly={true} onUpload={() => {}} onStatusChange={onStatusChange}/></div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'vehicles' && (
                            <div className="space-y-6">
                                {company.vehicles.map(vehicle => (
                                    <div key={vehicle.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="text-md font-bold text-gray-900">{vehicle.model}</h3>
                                                <p className="text-sm text-gray-500">Patente: {vehicle.plate} | {vehicle.type}</p>
                                            </div>
                                        </div>
                                        <DocumentList 
                                            requirements={vehicleReqs} 
                                            documents={getProjectDocs(vehicle.documents)} 
                                            entityId={vehicle.id}
                                            readOnly={true}
                                            onUpload={() => {}}
                                            onStatusChange={onStatusChange}
                                        />
                                    </div>
                                ))}
                                {company.vehicles.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No hay vehículos registrados para esta empresa.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'hse' && (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Activity className="text-green-500"/> Registro Histórico de Seguridad</h4>
                                    
                                    {!currentProject.safetyStats || currentProject.safetyStats.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 italic bg-gray-50 rounded border border-dashed">
                                            La empresa no ha reportado estadísticas de seguridad para este contrato.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Período</th>
                                                        <th className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">HH</th>
                                                        <th className="px-6 py-3 text-center text-xs font-bold text-red-600 uppercase tracking-wider" title="Accidentes">ACC</th>
                                                        <th className="px-6 py-3 text-center text-xs font-bold text-orange-600 uppercase tracking-wider" title="Incidentes">INC</th>
                                                        <th className="px-6 py-3 text-center text-xs font-bold text-yellow-600 uppercase tracking-wider" title="Near Miss">NM</th>
                                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider" title="Daño Propiedad">DP</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Última Act.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentProject.safetyStats.map((stat) => (
                                                        <tr key={stat.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {stat.month}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono text-gray-600">
                                                                {stat.manHours.toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                                <span className={`px-2 py-1 rounded-full font-bold ${stat.accidents > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {stat.accidents}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                                                {stat.incidents}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                                                {stat.nearMisses}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                                                {stat.propertyDamage}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-right text-gray-400">
                                                                {new Date(stat.updatedAt).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Historial de Actividad (Audit Log)</h4>
                                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {auditLogs.map((log, index) => (
                                                <tr key={`${log.id}-${index}`}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-700">{log.action}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">{log.userName}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-600">{log.details}</td>
                                                </tr>
                                            ))}
                                            {auditLogs.length === 0 && (
                                                <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-400 italic">No hay registros de auditoría aún.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
