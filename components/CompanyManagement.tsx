
import React, { useMemo, useState, useRef } from 'react';
import { Company, User, Project, DocStatus, CriticalWork, CRITICAL_WORKS_LABELS } from '../types';
import { Plus, Save, Building, Mail, Lock, CheckCircle, Copy, X, Edit2, Trash2, ArrowRight, FolderPlus, FileText, Users, Truck, AlertOctagon, TrendingUp, PieChart as PieIcon, LayoutDashboard, Download, Upload, Database, AlertTriangle, ShieldCheck, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { api } from '../services/api';

interface Props {
    companies: Company[];
    onAddCompany: (company: Company, adminUser: User) => void;
    onUpdateCompany?: (id: string, data: Partial<Company>) => void;
    onDeleteCompany?: (id: string) => void;
    onSelectCompany: (id: string) => void;
    onAddProject: (companyId: string, project: Project) => void;
    onGoToControlCenter?: () => void;
    onGoToAudits?: () => void;
    onGoToGlobalPerformance?: () => void;
}

export const CompanyManagement: React.FC<Props> = ({ 
    companies, 
    onAddCompany, 
    onUpdateCompany, 
    onDeleteCompany, 
    onSelectCompany,
    onAddProject,
    onGoToControlCenter,
    onGoToAudits,
    onGoToGlobalPerformance
}) => {
    // --- ESTADOS LOCALES ---
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [showProjectModal, setShowProjectModal] = useState<string | null>(null);
    const fileImportRef = useRef<HTMLInputElement>(null);
    
    // Form States
    const [name, setName] = useState('');
    const [rut, setRut] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [projName, setProjName] = useState('');
    const [projContract, setProjContract] = useState('');
    const [selectedCriticalWorks, setSelectedCriticalWorks] = useState<CriticalWork[]>([]); // Estado para trabajos críticos
    const [createdCreds, setCreatedCreds] = useState<{name: string, email: string, pass: string} | null>(null);

    // --- CONFIGURACIÓN Y DIAGNÓSTICO SMTP ---
    const [showSmtpModal, setShowSmtpModal] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const handleTestSmtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail) return;
        setTestStatus('sending');
        setTestMessage('');
        try {
            await api.email.send(
                testEmail,
                "Compliance Cloud - Prueba de Conexión de Correo SMTP",
                `¡Hola!\n\nEste es un correo de prueba enviado desde la plataforma de control de contratistas Compliance Cloud (www.contractorehscontrol.com).\n\nSi estás recibiendo este mensaje, significa que el servidor emisor de correos y tus credenciales SMTP están correctamente configuradas y son completamente funcionales.\n\n¡Felicidades! Tu aplicación está lista para enviar credenciales reales a los nuevos contratistas registrados.\n\nFecha de envío: ${new Date().toLocaleString()}`
            );
            setTestStatus('success');
            setTestMessage("¡Correo de prueba enviado con éxito! Verifique la bandeja de entrada (y la carpeta de spam o correo no deseado).");
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(error.message || "Error al conectar con el servidor SMTP o credenciales inválidas.");
        }
    };

    // --- CÁLCULO DE ESTADÍSTICAS GLOBALES ---
    const stats = useMemo(() => {
        let totalWorkers = 0;
        let totalVehicles = 0;
        let authorizedCompanies = 0;
        let totalDocs = 0;
        let validDocs = 0;
        
        companies.forEach(comp => {
            totalWorkers += comp.workers.length;
            totalVehicles += comp.vehicles.length;
            if (comp.accessAuthorized) authorizedCompanies++;

            // Docs count (simple approximation across all entities)
            const countDocs = (list: any[]) => {
                list.forEach(d => {
                    totalDocs++;
                    if (d.status === DocStatus.APPROVED) validDocs++;
                });
            };
            countDocs(comp.documents);
            comp.workers.forEach(w => countDocs(w.documents));
            comp.vehicles.forEach(v => countDocs(v.documents));
        });

        const globalCompliance = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 0;

        return {
            totalCompanies: companies.length,
            totalWorkers,
            totalVehicles,
            authorizedCompanies,
            unauthorizedCompanies: companies.length - authorizedCompanies,
            globalCompliance
        };
    }, [companies]);

    // Data for Charts
    const statusData = [
        { name: 'Autorizadas', value: stats.authorizedCompanies, color: '#10B981' }, // Emerald 500
        { name: 'Pendientes', value: stats.unauthorizedCompanies, color: '#F59E0B' }, // Amber 500
    ].filter(d => d.value > 0);

    // --- MANEJADORES DEL FORMULARIO ---
    const resetForm = () => {
        setName(''); setRut(''); setEmail(''); setPassword('');
        setProjName(''); setProjContract('');
        setSelectedCriticalWorks([]);
        setShowForm(false); setIsEditing(false); setEditId(null);
    };

    const handleOpenCreate = () => { resetForm(); setShowForm(true); };

    const handleOpenEdit = (company: Company) => {
        setName(company.name); setRut(company.rut); setEmail(company.contactEmail);
        setSelectedCriticalWorks(company.criticalWorks || []);
        setPassword(''); setEditId(company.id); setIsEditing(true); setShowForm(true);
    };

    const toggleCriticalWork = (work: CriticalWork) => {
        setSelectedCriticalWorks(prev => 
            prev.includes(work) ? prev.filter(w => w !== work) : [...prev, work]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && editId && onUpdateCompany) {
            onUpdateCompany(editId, { 
                name, 
                rut, 
                contactEmail: email,
                criticalWorks: selectedCriticalWorks 
            });
            alert('Datos actualizados. Los requerimientos EHS se han ajustado según los riesgos seleccionados.');
            resetForm();
        } else {
            const newCompanyId = `comp_${Date.now()}`;
            const initialProject: Project = { id: `proj_${Date.now()}`, name: projName, contractNumber: projContract, isActive: true };
            
            const newCompany: Company = {
                id: newCompanyId, name, rut, contactEmail: email, accessAuthorized: false,
                criticalWorks: selectedCriticalWorks,
                projects: [initialProject], documents: [], workers: [], vehicles: [],
                hasSubcontractors: false // Default to false
            };
            const newUser: User = {
                id: `u_${Date.now()}`, email: email.trim(), password: password.trim(),
                name: `Admin ${name}`, role: 'CONTRACTOR', companyId: newCompanyId
            };
            onAddCompany(newCompany, newUser);
            setCreatedCreds({ name, email, pass: password });
            resetForm();
        }
    };

    const handleAddProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showProjectModal) return;
        const newProject: Project = { id: `proj_${Date.now()}`, name: projName, contractNumber: projContract, isActive: true };
        onAddProject(showProjectModal, newProject);
        setShowProjectModal(null); setProjName(''); setProjContract('');
        alert("Contrato agregado.");
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Eliminar empresa ${name}?`)) onDeleteCompany?.(id);
    };

    const copyToClipboard = () => {
        if (createdCreds) {
            navigator.clipboard.writeText(`Empresa: ${createdCreds.name}\nUsuario: ${createdCreds.email}\nClave: ${createdCreds.pass}`);
            alert("Copiado.");
        }
    };

    // --- BACKUP & RESTORE ---
    const handleExportDB = async () => {
        const json = await api.db.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("ADVERTENCIA: Importar una base de datos sobrescribirá TODA la información actual en este computador. ¿Desea continuar?")) {
            if (fileImportRef.current) fileImportRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const success = await api.db.importData(content);
            if (success) {
                alert("Base de datos importada correctamente. La página se recargará.");
                window.location.reload();
            } else {
                alert("Error al importar el archivo. Formato inválido.");
            }
        };
        reader.readAsText(file);
    };

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

    // --- RENDER ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {expiringDocs.count > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
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

            {/* 1. HEADER & ACTIONS */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Contratistas</h1>
                    <p className="text-gray-500 mt-1">Administración y alta de empresas proveedoras.</p>
                </div>
                {!showForm && !createdCreds && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 mr-2 bg-gray-100 p-1 rounded-lg">
                            <button onClick={handleExportDB} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all shadow-sm" title="Guardar copia en este PC">
                                <Download size={14}/> Exportar BD
                            </button>
                            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all shadow-sm cursor-pointer" title="Cargar copia desde otro PC">
                                <Upload size={14}/> Importar BD
                                <input type="file" ref={fileImportRef} onChange={handleImportDB} accept=".json" className="hidden" />
                            </label>
                            <button onClick={() => setShowSmtpModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-white rounded-md transition-all shadow-sm cursor-pointer" title="Configuración de Servidor de Correos (SMTP)">
                                <Mail size={14} className="text-blue-500" /> Configuración SMTP
                            </button>
                        </div>

                         {onGoToControlCenter && (
                            <button onClick={onGoToControlCenter} className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2.5 rounded-lg hover:bg-blue-50 shadow-sm transition-all font-bold cursor-pointer">
                                <LayoutDashboard size={20} /> Dashboard Ejecutivo
                            </button>
                        )}
                        {onGoToGlobalPerformance && (
                            <button onClick={onGoToGlobalPerformance} className="flex items-center gap-2 bg-indigo-950/80 text-indigo-300 border border-indigo-800 px-4 py-2.5 rounded-lg hover:bg-indigo-900/60 shadow-sm transition-all font-bold cursor-pointer">
                                <BarChart3 size={20} className="text-indigo-400" /> Desempeño Global (D3)
                            </button>
                        )}
                        {onGoToAudits && (
                            <button onClick={onGoToAudits} className="flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-4 py-2.5 rounded-lg hover:bg-emerald-900/60 shadow-sm transition-all font-bold cursor-pointer">
                                <ShieldCheck size={20} className="text-emerald-400" /> Auditorías & Trazabilidad
                            </button>
                        )}
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5 font-medium">
                            <Plus size={20} /> Registrar Nueva Empresa
                        </button>
                    </div>
                )}
            </div>

            {/* 2. GLOBAL DASHBOARD CARDS */}
            {!showForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Workers */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Trabajadores</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalWorkers}</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                    </div>

                    {/* Card 2: Vehicles */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Flota Total</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalVehicles}</p>
                        </div>
                        <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Truck size={24} />
                        </div>
                    </div>

                    {/* Card 3: Compliance */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cumplimiento Global</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className={`text-2xl font-bold ${stats.globalCompliance > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {stats.globalCompliance}%
                                </p>
                                <span className="text-xs text-gray-400">promedio</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                    </div>

                     {/* Card 4: Alerts */}
                     <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Sin Autorización</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.unauthorizedCompanies}</p>
                        </div>
                        <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertOctagon size={24} />
                        </div>
                    </div>
                </div>
            )}

            {/* 3. CHARTS & LISTS LAYOUT */}
            {!showForm && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Companies Status Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <PieIcon size={16}/> Estado de Empresas
                        </h3>
                        <div className="h-48 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="ml-4 space-y-2">
                                {statusData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                                        <span className="font-medium text-gray-600">{d.name}: {d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700 border border-blue-100">
                            <strong>Nota:</strong> Para ver los datos en otro computador, utilice el botón "Exportar BD" y luego "Importar BD" en el equipo de destino.
                        </div>
                    </div>

                    {/* Right: The Company List (Existing Logic Enhanced) */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Base de Datos Contratistas</h3>
                            <span className="text-xs bg-white border border-gray-300 px-2 py-1 rounded-full text-gray-500">{stats.totalCompanies} Registros</span>
                        </div>
                        <div className="overflow-y-auto max-h-[500px]">
                            <ul className="divide-y divide-gray-100">
                                {companies.map((company) => (
                                    <li key={company.id} className="hover:bg-blue-50/30 transition-colors">
                                        <div className="px-6 py-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                {/* Info Principal */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${company.accessAuthorized ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                                                        <p className="text-md font-bold text-slate-800 truncate">{company.name}</p>
                                                    </div>
                                                    <div className="mt-1 flex items-center text-xs text-gray-500 gap-3">
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">{company.rut}</span>
                                                        <span className="flex items-center gap-1"><Mail size={12}/> {company.contactEmail}</span>
                                                    </div>
                                                    {company.criticalWorks && company.criticalWorks.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {company.criticalWorks.map(w => (
                                                                <span key={w} className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-bold">
                                                                    {CRITICAL_WORKS_LABELS[w].split(' ')[0]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Contratos */}
                                                <div className="flex-1">
                                                     <div className="flex flex-wrap gap-2">
                                                        {company.projects && company.projects.map(proj => (
                                                            <div key={proj.id} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium rounded px-2 py-1">
                                                                {proj.contractNumber}
                                                            </div>
                                                        ))}
                                                        <button 
                                                            onClick={() => { setProjName(''); setProjContract(''); setShowProjectModal(company.id); }}
                                                            className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-[10px] flex items-center transition-colors"
                                                        >
                                                            <Plus size={10} className="mr-1"/> Contrato
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleOpenEdit(company)} className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-gray-100 rounded transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(company.id, company.name)} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-gray-100 rounded transition-colors"><Trash2 size={16} /></button>
                                                    <button onClick={() => onSelectCompany(company.id)} className="ml-2 text-white bg-blue-600 hover:bg-blue-700 font-medium text-xs px-3 py-1.5 rounded shadow-sm transition-all flex items-center gap-1">
                                                        Auditar <ArrowRight size={12}/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {companies.length === 0 && <li className="px-6 py-12 text-center text-gray-400 italic">No hay empresas en el sistema.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION CARD (Success Creation) */}
            {createdCreds && (
                <div className="bg-white border border-green-200 rounded-xl p-6 shadow-xl max-w-2xl mx-auto relative animate-in zoom-in-95 duration-300">
                    <button onClick={() => setCreatedCreds(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">¡Empresa Registrada!</h3>
                        <p className="text-gray-500 mt-2">Comparta estas credenciales con el contratista.</p>
                        
                        <div className="mt-6 bg-slate-50 p-6 rounded-xl border border-slate-200 text-left">
                            <div className="grid grid-cols-[80px_1fr] gap-y-3 gap-x-4 text-sm">
                                <span className="text-gray-500 font-medium">Empresa:</span><span className="font-bold text-gray-900">{createdCreds.name}</span>
                                <span className="text-gray-500 font-medium">Usuario:</span><span className="font-mono text-blue-700 bg-white border px-2 py-0.5 rounded w-fit">{createdCreds.email}</span>
                                <span className="text-gray-500 font-medium">Clave:</span><span className="font-mono text-blue-700 bg-white border px-2 py-0.5 rounded w-fit">{createdCreds.pass}</span>
                            </div>
                        </div>
                        <button onClick={copyToClipboard} className="mt-6 w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors">
                            <Copy size={18} /> Copiar al Portapapeles
                        </button>
                    </div>
                </div>
            )}

            {/* FORMULARIO CREAR/EDITAR */}
            {showForm && (
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-2xl relative animate-in slide-in-from-bottom-4">
                    <button onClick={resetForm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Building size={24}/></div>
                        {isEditing ? 'Editar Datos' : 'Alta de Contratista'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Información Legal</p>
                                <div><label className="text-sm font-medium text-gray-700">Razón Social</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" /></div>
                                <div><label className="text-sm font-medium text-gray-700">RUT</label><input required value={rut} onChange={e => setRut(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" /></div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Acceso Sistema</p>
                                <div><label className="text-sm font-medium text-gray-700">Email Contacto</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" /></div>
                                {!isEditing && (
                                    <div><label className="text-sm font-medium text-gray-700">Contraseña Inicial</label><input required value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" /></div>
                                )}
                            </div>
                        </div>

                        {/* SECCIÓN TRABAJOS CRÍTICOS (TRIGGER DE REQUISITOS EHS) */}
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                                    <AlertTriangle size={14}/> Trabajos de Alto Riesgo (Trigger)
                                </p>
                                <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-red-100 text-red-500">Configuración Crítica</span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-4">
                                Al seleccionar un riesgo, se habilitarán automáticamente los <strong className="text-gray-700">Planes de Emergencia</strong> y <strong className="text-gray-700">Procedimientos Específicos</strong> correspondientes en el módulo de Gestión HSE de la empresa.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(CRITICAL_WORKS_LABELS).map(([key, label]) => (
                                    <label key={key} className={`flex items-center space-x-3 p-3 bg-white rounded-lg border transition-all cursor-pointer ${selectedCriticalWorks.includes(key as CriticalWork) ? 'border-red-400 shadow-sm ring-1 ring-red-100' : 'border-red-100 hover:border-red-300'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedCriticalWorks.includes(key as CriticalWork)}
                                            onChange={() => toggleCriticalWork(key as CriticalWork)}
                                            className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-800 font-bold">{label}</span>
                                            <span className="text-[10px] text-gray-400">Activa requisitos de {label.split(' ')[0]}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {!isEditing && (
                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mt-4">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={16}/> Primer Contrato / Orden de Servicio</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="text-sm font-medium text-gray-700">Nombre Proyecto</label><input required value={projName} onChange={e => setProjName(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm p-2 border bg-white" placeholder="Ej: Mantención Norte" /></div>
                                    <div><label className="text-sm font-medium text-gray-700">N° Contrato</label><input required value={projContract} onChange={e => setProjContract(e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm p-2 border bg-white" placeholder="CTR-2024-X" /></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancelar</button>
                            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-medium flex items-center gap-2">
                                <Save size={18}/> {isEditing ? 'Guardar Cambios' : 'Crear Empresa'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ADD PROJECT MODAL */}
            {showProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><FolderPlus size={20} className="text-blue-600"/> Nuevo Contrato</h3>
                        <form onSubmit={handleAddProjectSubmit}>
                            <div className="space-y-4 mb-6">
                                <div><label className="block text-sm font-medium text-gray-700">Nombre del Proyecto</label><input required value={projName} onChange={e => setProjName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 border" /></div>
                                <div><label className="block text-sm font-medium text-gray-700">N° Contrato / OS</label><input required value={projContract} onChange={e => setProjContract(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 border" /></div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowProjectModal(null)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">Agregar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* INTERACTIVE SMTP SETTINGS & DIAGNOSTICS MODAL */}
            {showSmtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-8 relative animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <button onClick={() => { setShowSmtpModal(false); setTestStatus('idle'); setTestMessage(''); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        
                        <div className="flex items-center gap-3 border-b pb-4 mb-6">
                            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Configuración y Diagnóstico SMTP</h3>
                                <p className="text-sm text-gray-500">Requerimientos y pruebas para el envío real de correos electrónicos.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-2 flex-grow">
                            {/* Left: Settings Instructions */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">1. Variables de Entorno Requeridas</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                        Para que la aplicación envíe correos electrónicos reales a los contratistas al momento de su creación, debes configurar las siguientes variables en tu entorno de servidor o archivo <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px] font-bold">.env</code>:
                                    </p>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2 text-slate-800">
                                        <div><span className="text-blue-600 font-bold">SMTP_HOST</span>=smtp.hostinger.com <span className="text-gray-400 italic text-[11px]">// O smtp.gmail.com</span></div>
                                        <div><span className="text-blue-600 font-bold">SMTP_PORT</span>=587 <span className="text-gray-400 italic text-[11px]">// 587 (STARTTLS) o 465 (SSL)</span></div>
                                        <div><span className="text-blue-600 font-bold">SMTP_USER</span>=tu_correo@contractorehscontrol.com</div>
                                        <div><span className="text-blue-600 font-bold">SMTP_PASS</span>=tu_contraseña_real_o_token</div>
                                        <div><span className="text-blue-600 font-bold">SMTP_FROM</span>=tu_correo@contractorehscontrol.com</div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">2. Guía de Configuración por Proveedor</h4>
                                    <div className="space-y-3 text-xs text-gray-600">
                                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <strong className="text-blue-800">Opción A: Hostinger / cPanel (Recomendado)</strong>
                                            <ol className="list-decimal pl-4 mt-1 space-y-1">
                                                <li>Ingresa a tu panel de Hostinger y crea una cuenta de correo (ej: <code className="font-bold text-gray-800">soporte@contractorehscontrol.com</code>).</li>
                                                <li>Usa <code className="font-bold">smtp.hostinger.com</code> como Host, puerto <code className="font-bold">465</code> (SSL) o <code className="font-bold">587</code> (STARTTLS).</li>
                                                <li>El usuario y contraseña son exactamente los de la cuenta de correo creada.</li>
                                            </ol>
                                        </div>
                                        <div className="p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
                                            <strong className="text-yellow-800">Opción B: Correo Gmail Personal</strong>
                                            <ol className="list-decimal pl-4 mt-1 space-y-1">
                                                <li>Activa "Verificación en Dos Pasos" en tu cuenta de correo.</li>
                                                <li>Ingresa a "Seguridad" y genera una <strong>"Contraseña de aplicación"</strong>.</li>
                                                <li>Usa <code className="font-bold">smtp.gmail.com</code>, puerto <code className="font-bold">587</code>, y como contraseña ingresa el token de 16 letras generado por tu proveedor de correo (sin espacios).</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Test delivery panel */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between h-fit">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
                                        <ShieldCheck className="text-green-600" size={16} /> Diagnóstico y Envío de Prueba
                                    </h4>
                                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                        Ingresa una dirección de correo para enviar un mensaje de prueba real y comprobar si la plataforma puede conectarse exitosamente con tu servidor SMTP actual.
                                    </p>

                                    <form onSubmit={handleTestSmtp} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Destinatario</label>
                                            <input 
                                                required 
                                                type="email" 
                                                value={testEmail} 
                                                onChange={e => setTestEmail(e.target.value)} 
                                                placeholder="ejemplo@correo.com" 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={testStatus === 'sending'}
                                            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm text-white shadow-md transition-colors ${testStatus === 'sending' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                        >
                                            {testStatus === 'sending' ? 'Enviando...' : 'Enviar Correo de Prueba'}
                                        </button>
                                    </form>
                                </div>

                                {testStatus !== 'idle' && (
                                    <div className={`mt-6 p-4 rounded-xl border text-xs leading-relaxed ${
                                        testStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                                        testStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                        'bg-blue-50 border-blue-100 text-blue-800 animate-pulse'
                                    }`}>
                                        <div className="font-bold mb-1 flex items-center gap-1">
                                            {testStatus === 'success' && "✓ Conexión SMTP Exitosa"}
                                            {testStatus === 'error' && "✗ Fallo de Conexión / Credenciales"}
                                            {testStatus === 'sending' && "Conectando con Servidor SMTP..."}
                                        </div>
                                        <p>{testMessage || "Se está enviando el paquete SMTP a través del puerto configurado."}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end border-t pt-4 mt-6">
                            <button 
                                onClick={() => { setShowSmtpModal(false); setTestStatus('idle'); setTestMessage(''); }} 
                                className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
