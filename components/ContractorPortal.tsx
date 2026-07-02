
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Company, DocStatus, DocumentSubmission, EntityType, RequirementDef, ReqCategory, MonthlySafetyStats, CriticalWork, CRITICAL_WORKS_LABELS, Worker } from '../types';
import { DocumentList } from './DocumentList';
import { REQUIREMENTS } from '../mockData';
import { Users, Building2, Truck, AlertTriangle, GraduationCap, HeartPulse, Scale, Plus, X, Save, FolderOpen, CheckCircle, Clock, AlertOctagon, ArrowUpRight, FileText, Activity, LayoutDashboard, ChevronRight, Calendar as CalendarIcon, Upload as UploadIcon, QrCode, Download, FileDown, ClipboardCheck, ShieldAlert, UserCog } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { SafetyStatsModule } from './SafetyStatsModule';
import { ComplianceCalendar } from './ComplianceCalendar';
import { api } from '../services/api';

interface Props {
    company: Company;
    onUpload: (reqId: string, entityId: string, file: File, projectId: string, startDate: string, expiryDate: string) => void;
    onAddWorker: (worker: {firstName: string, lastName: string, rut: string, role: string}) => void;
    onAddVehicle: (vehicle: {plate: string, model: string, type: string}) => void;
    onRefresh?: () => void;
}

const WORKER_ROLES = [
    "Generico / Ayudante",
    "Conductor",
    "Operador de Equipos",
    "Operador de Maquinaria Pesada",
    "Soldador",
    "Eléctrico",
    "Mecánico",
    "Rigger",
    "Supervisor",
    "Prevencionista"
];

export const ContractorPortal: React.FC<Props> = ({ company, onUpload, onAddWorker, onAddVehicle, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'company' | 'ehs' | 'workers' | 'vehicles' | 'calendar'>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [showWorkerForm, setShowWorkerForm] = useState(false);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [showSafetyModule, setShowSafetyModule] = useState(false);
    const [showQRModal, setShowQRModal] = useState<string | null>(null);
    const [newWorker, setNewWorker] = useState({ firstName: '', lastName: '', rut: '', role: WORKER_ROLES[0] });
    const [newVehicle, setNewVehicle] = useState({ plate: '', model: '', type: '' });
    
    // EHS States
    const [hasSubcontractors, setHasSubcontractors] = useState<boolean>(company.hasSubcontractors || false);
    const [activeCriticalWorks, setActiveCriticalWorks] = useState<CriticalWork[]>(company.criticalWorks || []);

    const workerCsvRef = useRef<HTMLInputElement>(null);
    const vehicleCsvRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHasSubcontractors(company.hasSubcontractors || false);
        setActiveCriticalWorks(company.criticalWorks || []);
    }, [company]);

    useEffect(() => {
        if (company.projects && company.projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(company.projects[0].id);
        }
    }, [company.projects, selectedProjectId]);

    const currentProject = company.projects.find(p => p.id === selectedProjectId);

    // Filter Logic for Worker Requirements based on Role
    const getWorkerRequirements = (worker: Worker) => {
        return REQUIREMENTS.filter(r => {
            if (r.entityType !== EntityType.WORKER) return false;
            
            // 1. Check if linked to critical work active in company
            if (r.linkedCriticalWork && !company.criticalWorks?.includes(r.linkedCriticalWork)) {
                return false;
            }

            // 2. Check if linked to specific role (Drivers/Operators)
            if (r.linkedRoles) {
                return r.linkedRoles.includes(worker.role);
            }

            return true;
        });
    };

    const dashboardStats = useMemo(() => {
        if (!currentProject) return null;

        let totalReqs = 0;
        let approved = 0;
        let rejected = 0;
        let inReview = 0;

        const countStats = (docs: DocumentSubmission[], requiredCount: number) => {
            const projectDocs = docs.filter(d => d.projectId === selectedProjectId);
            
            projectDocs.forEach(d => {
                if (d.status === DocStatus.APPROVED) approved++;
                if (d.status === DocStatus.REJECTED) rejected++;
                if (d.status === DocStatus.IN_REVIEW) inReview++;
            });
            totalReqs += requiredCount;
        };

        const companyReqsCount = REQUIREMENTS.filter(r => r.entityType === EntityType.COMPANY).length;
        const vehicleReqsCount = REQUIREMENTS.filter(r => r.entityType === EntityType.VEHICLE).length;

        countStats(company.documents, companyReqsCount);
        
        // Count for workers based on individual roles
        company.workers.forEach(w => {
            const reqs = getWorkerRequirements(w);
            countStats(w.documents, reqs.length);
        });
        
        company.vehicles.forEach(v => countStats(v.documents, vehicleReqsCount));

        const totalItems = 1 + company.workers.length + company.vehicles.length; 
        
        // Recalculate potential total based on specific worker roles
        let totalPotentialReqs = companyReqsCount + (company.vehicles.length * vehicleReqsCount);
        company.workers.forEach(w => {
             totalPotentialReqs += getWorkerRequirements(w).length;
        });

        const compliance = totalPotentialReqs > 0 ? Math.round((approved / totalPotentialReqs) * 100) : 0;

        return { approved, rejected, inReview, totalPotentialReqs, compliance, totalItems };
    }, [company, selectedProjectId]);

    const chartData = dashboardStats ? [
        { name: 'OK', value: dashboardStats.approved, color: '#10B981' },
        { name: 'Pend', value: dashboardStats.totalPotentialReqs - dashboardStats.approved, color: '#E5E7EB' }
    ] : [];

    const companyReqs = REQUIREMENTS.filter(r => r.entityType === EntityType.COMPANY && r.category !== ReqCategory.EHS);
    const vehicleReqs = REQUIREMENTS.filter(r => r.entityType === EntityType.VEHICLE);
    
    // Strict Filtering Logic for EHS Module
    const ehsReqs = REQUIREMENTS.filter(r => {
        if (r.entityType !== EntityType.COMPANY || r.category !== ReqCategory.EHS) return false;
        if (r.linkedCriticalWork) return activeCriticalWorks.includes(r.linkedCriticalWork);
        if (r.specialCondition === 'HAS_SUBCONTRACTORS') return hasSubcontractors;
        return true;
    });

    const getProjectDocs = (docs: DocumentSubmission[]) => docs.filter(d => d.projectId === selectedProjectId);
    const handleUploadWrapper = (reqId: string, entityId: string, file: File, startDate: string, expiryDate: string) => {
        if (selectedProjectId) onUpload(reqId, entityId, file, selectedProjectId, startDate, expiryDate);
        else alert("Seleccione un proyecto activo.");
    };

    const handleWorkerSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 
        onAddWorker(newWorker); 
        setNewWorker({ firstName: '', lastName: '', rut: '', role: WORKER_ROLES[0] }); 
        setShowWorkerForm(false);
    };
    const handleVehicleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); onAddVehicle(newVehicle); setNewVehicle({ plate: '', model: '', type: '' }); setShowVehicleForm(false);
    };

    const toggleSubcontractors = async () => {
        const newValue = !hasSubcontractors;
        setHasSubcontractors(newValue);
        await api.companies.update(company.id, { hasSubcontractors: newValue });
        if (onRefresh) onRefresh();
    };

    const toggleCriticalWork = async (work: CriticalWork) => {
        let newWorks = [...activeCriticalWorks];
        if (newWorks.includes(work)) {
            newWorks = newWorks.filter(w => w !== work);
        } else {
            newWorks.push(work);
        }
        setActiveCriticalWorks(newWorks);
        await api.companies.update(company.id, { criticalWorks: newWorks });
        if (onRefresh) onRefresh();
    };

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>, type: 'WORKER' | 'VEHICLE') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csv = event.target?.result as string;
            const lines = csv.split('\n').slice(1);
            
            let count = 0;
            for (const line of lines) {
                if (!line.trim()) continue;
                const cols = line.split(',');
                if (type === 'WORKER' && cols.length >= 4) {
                    await onAddWorker({ firstName: cols[0], lastName: cols[1], rut: cols[2], role: cols[3] });
                    count++;
                } else if (type === 'VEHICLE' && cols.length >= 3) {
                    await onAddVehicle({ plate: cols[0], model: cols[1], type: cols[2] });
                    count++;
                }
            }
            alert(`Importación completada: ${count} registros agregados.`);
            if(onRefresh) onRefresh();
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = (type: 'WORKER' | 'VEHICLE') => {
        const headers = type === 'WORKER' ? 'Nombre,Apellido,RUT,Cargo' : 'Patente,Modelo,Tipo';
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\nEjemplo,Usuario,12345678-9,Soldador";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `plantilla_${type.toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveStats = async (projectId: string, stats: MonthlySafetyStats) => {
        try {
            await api.companies.addProjectStats(company.id, projectId, stats);
            setShowSafetyModule(false); 
            if (onRefresh) onRefresh();
        } catch (e) {
            console.error(e);
            alert("Error al guardar estadísticas.");
        }
    };

    const allDocs = useMemo(() => {
        let docs = [...company.documents];
        company.workers.forEach(w => docs.push(...w.documents));
        company.vehicles.forEach(v => docs.push(...v.documents));
        return docs;
    }, [company]);

    if (!currentProject) return <div className="p-8 text-center text-gray-500">Cargando datos...</div>;

    const SidebarItem = ({ id, label, icon: Icon, count }: { id: typeof activeTab, label: string, icon: any, count?: number }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all duration-200 ${
                activeTab === id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={20} className={activeTab === id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                <span className="font-medium text-sm">{label}</span>
            </div>
            {count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-300'
                }`}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sticky top-24">
                        <div className="mb-6 px-2">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Navegación</h2>
                        </div>
                        <nav className="space-y-2">
                            <SidebarItem id="dashboard" label="Resumen" icon={LayoutDashboard} />
                            <div className="my-2 border-t border-gray-100 dark:border-slate-700"></div>
                            <SidebarItem id="ehs" label="Gestión EHS" icon={ShieldAlert} />
                            <SidebarItem id="calendar" label="Vencimientos" icon={CalendarIcon} />
                            <div className="my-2 border-t border-gray-100 dark:border-slate-700"></div>
                            <SidebarItem id="company" label="Empresa" icon={Building2} />
                            <SidebarItem id="workers" label="Trabajadores" icon={Users} count={company.workers.length} />
                            <SidebarItem id="vehicles" label="Vehículos" icon={Truck} count={company.vehicles.length} />
                        </nav>
                        
                        <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
                            <h4 className="text-blue-800 dark:text-blue-300 font-bold text-sm mb-2">Estado General</h4>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${company.accessAuthorized ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{company.accessAuthorized ? 'Autorizado' : 'Restringido'}</span>
                            </div>
                            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5 mb-1">
                                <div className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full" style={{ width: `${dashboardStats?.compliance}%` }}></div>
                            </div>
                            <p className="text-[10px] text-blue-600 dark:text-blue-300 text-right">{dashboardStats?.compliance}% Cumplimiento</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-6">
                    
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentProject.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600">{currentProject.contractNumber}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">• {company.name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FolderOpen size={16} className="text-gray-400" />
                                </div>
                                <select 
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full appearance-none cursor-pointer font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                >
                                    {company.projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.contractNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={() => setShowSafetyModule(true)}
                                className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                            >
                                <Activity size={16} className="text-green-400" />
                                Stats HSE
                            </button>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        
                        {activeTab === 'dashboard' && dashboardStats && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between md:col-span-2 relative overflow-hidden">
                                        <div className="z-10">
                                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cumplimiento Global</p>
                                            <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{dashboardStats.compliance}%</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">De {dashboardStats.totalPotentialReqs} requisitos totales</p>
                                            
                                            <div className="flex gap-4 mt-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{dashboardStats.approved} Aprobados</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-slate-600"></div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{dashboardStats.totalPotentialReqs - dashboardStats.approved} Pendientes</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-32 w-32 mr-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={chartData} innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                                                        {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-center space-y-6">
                                        <div>
                                            <p className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-1"><AlertOctagon size={14}/> Rechazados</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{dashboardStats.rejected}</p>
                                            <p className="text-xs text-gray-400">Requieren corrección</p>
                                        </div>
                                        <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                                            <p className="text-xs font-bold text-yellow-500 uppercase tracking-wide flex items-center gap-1"><Clock size={14}/> En Revisión</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{dashboardStats.inReview}</p>
                                            <p className="text-xs text-gray-400">Esperando validación</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <button onClick={() => setActiveTab('ehs')} className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left">
                                        <div className="bg-teal-50 dark:bg-teal-900/30 w-10 h-10 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors"><ShieldAlert size={20}/></div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Gestión EHS</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MIPER, Procedimientos, SSO</p>
                                        <div className="mt-3 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">Gestionar <ChevronRight size={14} className="ml-1"/></div>
                                    </button>
                                    <button onClick={() => setActiveTab('company')} className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left">
                                        <div className="bg-blue-50 dark:bg-blue-900/30 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Building2 size={20}/></div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Carpeta Empresa</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contratos, Pólizas, RIOHS</p>
                                        <div className="mt-3 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">Gestionar <ChevronRight size={14} className="ml-1"/></div>
                                    </button>
                                    <button onClick={() => setActiveTab('workers')} className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left">
                                        <div className="bg-indigo-50 dark:bg-indigo-900/30 w-10 h-10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Users size={20}/></div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Trabajadores</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contratos, ODI, EPP, Exámenes</p>
                                        <div className="mt-3 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">Gestionar <ChevronRight size={14} className="ml-1"/></div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'calendar' && (
                             <ComplianceCalendar documents={allDocs} title="Calendario de Vencimientos" />
                        )}

                        {activeTab === 'ehs' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <ShieldAlert className="text-red-600"/> Configuración de Riesgos y Servicio
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-bold text-sm text-slate-700 mb-2">Estructura del Servicio</h4>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    id="hasSubcontractors"
                                                    checked={hasSubcontractors}
                                                    onChange={toggleSubcontractors}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                                                />
                                                <label htmlFor="hasSubcontractors" className="text-sm text-gray-700 cursor-pointer">
                                                    ¿Incorpora Subcontratos?
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 ml-8">
                                                Al marcar esta opción, se habilitará el requerimiento de carga del "Reglamento Especial para Empresas Contratistas".
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-bold text-sm text-slate-700 mb-2">Trabajos de Alto Riesgo (Críticos)</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(CRITICAL_WORKS_LABELS).map(([key, label]) => (
                                                    <label key={key} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={activeCriticalWorks.includes(key as CriticalWork)}
                                                            onChange={() => toggleCriticalWork(key as CriticalWork)}
                                                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                                                        />
                                                        <span className="text-xs text-gray-700">{label.split('(')[0].trim()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Seleccionar un riesgo habilitará la carga de Procedimientos Específicos y Planes de Emergencia.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <FileText className="text-blue-500"/> Documentación EHS Requerida
                                    </h2>
                                    <div className="mb-4 flex gap-2">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Basales</span>
                                        {hasSubcontractors && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Subcontratos</span>}
                                        {activeCriticalWorks.length > 0 && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Riesgos Críticos</span>}
                                    </div>
                                    <DocumentList 
                                        requirements={ehsReqs} 
                                        documents={getProjectDocs(company.documents)} 
                                        entityId={company.id}
                                        onUpload={handleUploadWrapper}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'company' && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <FileText className="text-blue-500"/> Carpeta Legal de la Empresa
                                </h2>
                                <DocumentList 
                                    requirements={companyReqs} 
                                    documents={getProjectDocs(company.documents)} 
                                    entityId={company.id}
                                    onUpload={handleUploadWrapper}
                                />
                            </div>
                        )}

                        {activeTab === 'workers' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Nómina de Personal</h2>
                                        <p className="text-sm text-gray-500">Gestione la documentación por trabajador.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <label className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
                                            <FileDown size={16} /> Carga Masiva (CSV)
                                            <input type="file" ref={workerCsvRef} onChange={(e) => handleCSVImport(e, 'WORKER')} accept=".csv" className="hidden"/>
                                        </label>
                                        <button onClick={() => handleDownloadTemplate('WORKER')} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                            <Download size={16} /> Plantilla
                                        </button>
                                        <button onClick={() => setShowWorkerForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                            <Plus size={16} /> Agregar Trabajador
                                        </button>
                                    </div>
                                </div>

                                {showWorkerForm && (
                                    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-lg relative animate-in zoom-in-95">
                                        <button onClick={() => setShowWorkerForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                                        <h3 className="text-md font-bold text-gray-800 mb-4">Nuevo Registro</h3>
                                        <form onSubmit={handleWorkerSubmit}>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <input required placeholder="Nombres" value={newWorker.firstName} onChange={e => setNewWorker({...newWorker, firstName: e.target.value})} className="border border-gray-300 rounded-md p-2 text-sm" />
                                                <input required placeholder="Apellidos" value={newWorker.lastName} onChange={e => setNewWorker({...newWorker, lastName: e.target.value})} className="border border-gray-300 rounded-md p-2 text-sm" />
                                                <input required placeholder="RUT" value={newWorker.rut} onChange={e => setNewWorker({...newWorker, rut: e.target.value})} className="border border-gray-300 rounded-md p-2 text-sm" />
                                                <div className="relative">
                                                    <select 
                                                        required 
                                                        value={newWorker.role} 
                                                        onChange={e => setNewWorker({...newWorker, role: e.target.value})} 
                                                        className="w-full border border-gray-300 rounded-md p-2 text-sm appearance-none bg-white"
                                                    >
                                                        {WORKER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Guardar</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="grid gap-6">
                                    {company.workers.map(worker => {
                                        // Filter requirements per worker role
                                        const workerReqs = getWorkerRequirements(worker);
                                        const workerReqsLegal = workerReqs.filter(r => r.category === ReqCategory.LEGAL || !r.category);
                                        const workerReqsHealth = workerReqs.filter(r => r.category === ReqCategory.HEALTH);
                                        const workerReqsTraining = workerReqs.filter(r => r.category === ReqCategory.TRAINING);
                                        const workerReqsCritical = workerReqs.filter(r => r.category === ReqCategory.CRITICAL);

                                        return (
                                            <div key={worker.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                                            {worker.firstName.charAt(0)}{worker.lastName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-md font-bold text-gray-900">{worker.firstName} {worker.lastName}</h3>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <span className="bg-white border px-1.5 py-0.5 rounded">{worker.rut}</span>
                                                                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{worker.role}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setShowQRModal(worker.id)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors" title="Ver Pase QR">
                                                        <QrCode size={20} />
                                                    </button>
                                                </div>
                                                <div className="p-6 space-y-6">
                                                    {workerReqsCritical.length > 0 && (
                                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                                            <h4 className="flex items-center gap-2 text-xs font-bold text-red-600 mb-3 uppercase tracking-wider">
                                                                <AlertTriangle size={14}/> Requisitos Críticos (Especiales)
                                                            </h4>
                                                            <DocumentList requirements={workerReqsCritical} documents={getProjectDocs(worker.documents)} entityId={worker.id} onUpload={handleUploadWrapper}/>
                                                        </div>
                                                    )}

                                                    <div><h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider"><Scale size={14}/> Legal y Contractual</h4><DocumentList requirements={workerReqsLegal} documents={getProjectDocs(worker.documents)} entityId={worker.id} onUpload={handleUploadWrapper}/></div>
                                                    
                                                    {workerReqsHealth.length > 0 && (
                                                        <div><h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider"><HeartPulse size={14}/> Salud Ocupacional</h4><DocumentList requirements={workerReqsHealth} documents={getProjectDocs(worker.documents)} entityId={worker.id} onUpload={handleUploadWrapper}/></div>
                                                    )}
                                                    
                                                    {workerReqsTraining.length > 0 && (
                                                        <div><h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider"><GraduationCap size={14}/> Capacitación</h4><DocumentList requirements={workerReqsTraining} documents={getProjectDocs(worker.documents)} entityId={worker.id} onUpload={handleUploadWrapper}/></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'vehicles' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Flota Autorizada</h2>
                                        <p className="text-sm text-gray-500">Documentación de vehículos y maquinaria.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <label className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
                                            <FileDown size={16} /> Carga Masiva
                                            <input type="file" ref={vehicleCsvRef} onChange={(e) => handleCSVImport(e, 'VEHICLE')} accept=".csv" className="hidden"/>
                                        </label>
                                        <button onClick={() => handleDownloadTemplate('VEHICLE')} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                            <Download size={16} /> Plantilla
                                        </button>
                                        <button onClick={() => setShowVehicleForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                            <Plus size={16} /> Nuevo Vehículo
                                        </button>
                                    </div>
                                </div>
                                 {showVehicleForm && (
                                    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-lg relative animate-in zoom-in-95">
                                        <button onClick={() => setShowVehicleForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                                        <h3 className="text-md font-bold text-gray-800 mb-4">Nuevo Vehículo</h3>
                                        <form onSubmit={handleVehicleSubmit}>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input required placeholder="Patente" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} className="border border-gray-300 rounded-md p-2 text-sm" />
                                                <input required placeholder="Modelo" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} className="border border-gray-300 rounded-md p-2 text-sm" />
                                                <input required placeholder="Tipo (Camioneta, Camión...)" value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})} className="border border-gray-300 rounded-md p-2 text-sm" />
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Guardar</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-6">
                                    {company.vehicles.map(vehicle => (
                                        <div key={vehicle.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                                            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{vehicle.plate}</h3>
                                                    <p className="text-sm text-gray-500">{vehicle.model} - {vehicle.type}</p>
                                                </div>
                                                <div className="bg-gray-100 p-2 rounded-full text-gray-500"><Truck size={20}/></div>
                                            </div>
                                            <DocumentList requirements={vehicleReqs} documents={getProjectDocs(vehicle.documents)} entityId={vehicle.id} onUpload={handleUploadWrapper}/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SafetyStatsModule 
                isOpen={showSafetyModule}
                onClose={() => setShowSafetyModule(false)}
                project={currentProject}
                onSaveStats={handleSaveStats}
            />

            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
                     <div className="bg-white rounded-xl shadow-2xl p-6 text-center max-w-sm w-full relative animate-in zoom-in-95">
                        <button onClick={() => setShowQRModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        <h3 className="text-lg font-bold mb-4">Pase de Acceso Digital</h3>
                        {(() => {
                            const w = company.workers.find(w => w.id === showQRModal);
                            return w ? (
                                <>
                                    <img src={w.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${w.rut}`} alt="QR" className="mx-auto border-4 border-white shadow-lg rounded-lg mb-4" />
                                    <p className="font-bold text-xl">{w.firstName} {w.lastName}</p>
                                    <p className="text-gray-500">{w.role}</p>
                                    <p className="text-sm font-mono mt-1 bg-gray-100 inline-block px-2 py-1 rounded">{w.rut}</p>
                                </>
                            ) : null;
                        })()}
                     </div>
                </div>
            )}
        </div>
    );
};
