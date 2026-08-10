import React, { useState, useMemo } from 'react';
import { Company, DocStatus, DocumentSubmission, EntityType, RequirementDef, Worker, Vehicle } from '../types';
import { REQUIREMENTS } from '../mockData';
import { 
    AlertTriangle, AlertCircle, CheckCircle2, Mail, Send, Filter, Search, 
    CalendarClock, Building2, User, Truck, ShieldAlert, ArrowLeft, Download, 
    CheckSquare, Square, RefreshCw, Sparkles, Clock, FileText, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export interface AlertDocumentItem {
    id: string;
    docId?: string;
    companyId: string;
    companyName: string;
    contactEmail: string;
    entityId: string;
    entityName: string;
    entityType: EntityType;
    requirementId: string;
    requirementName: string;
    fileName: string;
    expiryDate: string;
    daysUntilExpiry: number;
    alertType: 'OVERDUE' | 'EXPIRING_SOON' | 'COMPLIANT';
    status: DocStatus;
    projectName: string;
}

interface Props {
    companies: Company[];
    onBack?: () => void;
    currentRole?: 'ADMIN' | 'CONTRACTOR' | 'MASTER_ADMIN';
    userCompanyId?: string;
}

export const DocumentAlertSystem: React.FC<Props> = ({ 
    companies, 
    onBack, 
    currentRole = 'ADMIN',
    userCompanyId 
}) => {
    const [selectedAlertType, setSelectedAlertType] = useState<'ALL' | 'OVERDUE' | 'EXPIRING_SOON'>('ALL');
    const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
    const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Modal para envío masivo de emails
    const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
    const [emailSubject, setEmailSubject] = useState<string>('URGENTE: Regularización y Actualización de Documentos de Cumplimiento');
    const [emailMessage, setEmailMessage] = useState<string>(
        'Estimado Contratista / Proveedor,\n\nLe informamos que a través de nuestro Sistema de Gestión y Cumplimiento EHS hemos detectado documentos vencidos o próximos a vencer en un plazo menor a 30 días. Para mantener su acreditación activa y evitar restricciones de ingreso a obra, le solicitamos regularizar la documentación cargando los archivos vigentes a la brevedad.\n\nAtentamente,\nDepartamento de Control de Contratistas & EHS Mandante.'
    );
    const [isSending, setIsSending] = useState<boolean>(false);
    const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);

    // Filter companies if current role is Contractor
    const filteredCompanies = useMemo(() => {
        if (userCompanyId) {
            return companies.filter(c => c.id === userCompanyId || c.parentCompanyId === userCompanyId);
        }
        return companies;
    }, [companies, userCompanyId]);

    // Gather all document alert items
    const alertItems = useMemo(() => {
        const items: AlertDocumentItem[] = [];
        const today = new Date();

        filteredCompanies.forEach(company => {
            const mainProjectName = company.projects[0]?.name || 'Proyecto Principal';

            const processDoc = (
                doc: DocumentSubmission, 
                entityId: string, 
                entityName: string, 
                entityType: EntityType
            ) => {
                if (!doc.expiryDate) return;

                const expiry = new Date(doc.expiryDate);
                const diffTime = expiry.getTime() - today.getTime();
                const daysUntilExpiry = Math.ceil(diffTime / (1000 * 3600 * 24));

                let alertType: 'OVERDUE' | 'EXPIRING_SOON' | 'COMPLIANT' = 'COMPLIANT';
                if (daysUntilExpiry < 0) {
                    alertType = 'OVERDUE';
                } else if (daysUntilExpiry <= 30) {
                    alertType = 'EXPIRING_SOON';
                } else {
                    return; // Skip compliant in this alert focus
                }

                const reqDef = REQUIREMENTS.find(r => r.id === doc.requirementId);

                items.push({
                    id: `${company.id}_${entityId}_${doc.id || doc.requirementId}`,
                    docId: doc.id,
                    companyId: company.id,
                    companyName: company.name,
                    contactEmail: company.contactEmail || 'contacto@empresa.cl',
                    entityId,
                    entityName,
                    entityType,
                    requirementId: doc.requirementId,
                    requirementName: reqDef?.name || doc.fileName || 'Documento Requerido',
                    fileName: doc.fileName,
                    expiryDate: doc.expiryDate,
                    daysUntilExpiry,
                    alertType,
                    status: doc.status,
                    projectName: mainProjectName
                });
            };

            // Process company level docs
            (company.documents || []).forEach(d => processDoc(d, company.id, company.name, EntityType.COMPANY));

            // Process workers
            (company.workers || []).forEach(w => {
                const wName = `${w.firstName} ${w.lastName} (${w.rut})`;
                (w.documents || []).forEach(d => processDoc(d, w.id, w.Name || wName, EntityType.WORKER));
            });

            // Process vehicles
            (company.vehicles || []).forEach(v => {
                const vName = `Vehículo ${v.plate} (${v.model})`;
                (v.documents || []).forEach(d => processDoc(d, v.id, vName, EntityType.VEHICLE));
            });
        });

        // Sort: Overdue first, then closest to expiry
        return items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    }, [filteredCompanies]);

    // Filter items based on selections
    const filteredItems = useMemo(() => {
        return alertItems.filter(item => {
            if (selectedAlertType !== 'ALL' && item.alertType !== selectedAlertType) return false;
            if (selectedCompanyFilter !== 'ALL' && item.companyId !== selectedCompanyFilter) return false;
            if (selectedEntityFilter !== 'ALL' && item.entityType !== selectedEntityFilter) return false;
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchName = item.companyName.toLowerCase().includes(q) || 
                                  item.entityName.toLowerCase().includes(q) || 
                                  item.requirementName.toLowerCase().includes(q) ||
                                  item.contactEmail.toLowerCase().includes(q);
                if (!matchName) return false;
            }
            return true;
        });
    }, [alertItems, selectedAlertType, selectedCompanyFilter, selectedEntityFilter, searchQuery]);

    // Counts
    const overdueCount = useMemo(() => alertItems.filter(i => i.alertType === 'OVERDUE').length, [alertItems]);
    const expiringSoonCount = useMemo(() => alertItems.filter(i => i.alertType === 'EXPIRING_SOON').length, [alertItems]);

    // Selection handlers
    const handleToggleSelectAll = () => {
        if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
            setSelectedItems(new Set());
        } else {
            const allIds = new Set(filteredItems.map(i => i.id));
            setSelectedItems(allIds);
        }
    };

    const handleToggleSelectItem = (id: string) => {
        const next = new Set(selectedItems);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedItems(next);
    };

    // Trigger Bulk Email Reminder
    const handleSendBulkEmail = async () => {
        setIsSending(true);
        try {
            // Group selected items by company email
            const selectedList = alertItems.filter(i => selectedItems.has(i.id));
            const itemsToUse = selectedList.length > 0 ? selectedList : filteredItems;

            const companyMap = new Map<string, { email: string; name: string; docCount: number; docs: string[] }>();
            
            itemsToUse.forEach(item => {
                if (!companyMap.has(item.companyId)) {
                    companyMap.set(item.companyId, { 
                        email: item.contactEmail, 
                        name: item.companyName, 
                        docCount: 0, 
                        docs: [] 
                    });
                }
                const entry = companyMap.get(item.companyId)!;
                entry.docCount++;
                entry.docs.push(`${item.requirementName} (${item.entityName}) - ${item.alertType === 'OVERDUE' ? 'VENCIDO' : 'Por Vencer en ' + item.daysUntilExpiry + 'd'}`);
            });

            // Dispatch notification log
            for (const [compId, info] of companyMap.entries()) {
                await api.notifications.create({
                    userId: compId,
                    type: 'WARNING',
                    title: emailSubject,
                    message: `${emailMessage}\n\nDocumentos Afectados (${info.docCount}):\n- ${info.docs.slice(0, 5).join('\n- ')}`
                });
            }

            // Log audit
            await api.audit.log(
                'BULK_EMAIL_REMINDER', 
                currentRole, 
                'Sistema de Alertas Automatizadas', 
                `Enviados ${companyMap.size} correos de recordatorio masivo para ${itemsToUse.length} documentos con alertas (Rojas/Amarillas).`
            );

            setIsSending(false);
            setShowEmailModal(false);
            setSendSuccessToast(`¡Recordatorios masivos enviados con éxito a ${companyMap.size} empresas contratistas!`);
            setTimeout(() => setSendSuccessToast(null), 5000);
            setSelectedItems(new Set());
        } catch (error) {
            console.error("Error sending bulk email reminders", error);
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                            <ShieldAlert size={16} /> Módulo de Alertas Automatizadas & Control Vencimientos
                        </div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            Consola de Vencimientos & Recordatorios Masivos
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Semáforo de cumplimiento: Documentos <strong className="text-rose-400">Vencidos (Rojo)</strong> y <strong className="text-amber-400">Próximos a Vencer &lt; 30 Días (Amarillo)</strong>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowEmailModal(true)}
                        disabled={filteredItems.length === 0}
                        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                        <Mail size={16} /> Enviar Recordatorio Masivo ({selectedItems.size > 0 ? selectedItems.size : filteredItems.length})
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {sendSuccessToast && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-emerald-400" />
                        <span className="text-sm font-bold">{sendSuccessToast}</span>
                    </div>
                </div>
            )}

            {/* KPI Cards (Semáforo) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                    onClick={() => setSelectedAlertType('OVERDUE')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        selectedAlertType === 'OVERDUE' 
                        ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/50' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                            <AlertCircle size={16} /> Documentos Vencidos (Fuera de Regla)
                        </span>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px] font-mono font-bold">ROJO</span>
                    </div>
                    <div className="text-3xl font-black text-rose-400">{overdueCount}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Requieren actualización inmediata para acceso a obra</p>
                </div>

                <div 
                    onClick={() => setSelectedAlertType('EXPIRING_SOON')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        selectedAlertType === 'EXPIRING_SOON' 
                        ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <CalendarClock size={16} /> Por Vencer en &lt; 30 Días
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-mono font-bold">AMARILLO</span>
                    </div>
                    <div className="text-3xl font-black text-amber-400">{expiringSoonCount}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Sujetos a alerta preventiva y correo masivo</p>
                </div>

                <div 
                    onClick={() => setSelectedAlertType('ALL')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        selectedAlertType === 'ALL' 
                        ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/50' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                            <ShieldAlert size={16} /> Total Alertas Activas
                        </span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-mono font-bold">CONSOLIDADOS</span>
                    </div>
                    <div className="text-3xl font-black text-white">{alertItems.length}</div>
                    <p className="text-[11px] text-slate-400 mt-1">Alertas monitoreadas continuamente por el sistema</p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto">
                    {/* Free Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Buscar por empresa, trabajador, doc..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500 transition-all text-xs"
                        />
                    </div>

                    {/* Filter Company */}
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                        <Building2 size={14} className="text-slate-400" />
                        <select 
                            value={selectedCompanyFilter}
                            onChange={e => setSelectedCompanyFilter(e.target.value)}
                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-slate-900">Todas las Empresas</option>
                            {filteredCompanies.map(c => (
                                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Entity Type */}
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                        <Filter size={14} className="text-slate-400" />
                        <select 
                            value={selectedEntityFilter}
                            onChange={e => setSelectedEntityFilter(e.target.value)}
                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-slate-900">Todas las Entidades</option>
                            <option value={EntityType.COMPANY} className="bg-slate-900">Documentos Empresa</option>
                            <option value={EntityType.WORKER} className="bg-slate-900">Trabajadores</option>
                            <option value={EntityType.VEHICLE} className="bg-slate-900">Vehículos / Maquinaria</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    <button 
                        onClick={handleToggleSelectAll}
                        className="text-slate-300 hover:text-white flex items-center gap-1.5 font-bold cursor-pointer bg-slate-800 px-3 py-2 rounded-xl border border-slate-700"
                    >
                        {selectedItems.size === filteredItems.length && filteredItems.length > 0 ? (
                            <><CheckSquare size={14} className="text-amber-400" /> Desseleccionar Todo</>
                        ) : (
                            <><Square size={14} /> Seleccionar Todo ({filteredItems.length})</>
                        )}
                    </button>
                </div>
            </div>

            {/* Document Alert Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase">
                                <th className="p-4 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItems.size === filteredItems.length && filteredItems.length > 0} 
                                        onChange={handleToggleSelectAll}
                                        className="cursor-pointer accent-amber-500"
                                    />
                                </th>
                                <th className="p-4">Alerta / Estado</th>
                                <th className="p-4">Empresa Contratista</th>
                                <th className="p-4">Entidad Afectada</th>
                                <th className="p-4">Documento Requerido</th>
                                <th className="p-4 text-center">Fecha Vencimiento</th>
                                <th className="p-4 text-right">Días Restantes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                                        <p className="font-bold text-white text-sm">No hay documentos con alertas para los filtros seleccionados</p>
                                        <p className="text-xs mt-1">Todos los documentos se encuentran en estado vigente dentro de norma.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const isSelected = selectedItems.has(item.id);
                                    const isOverdue = item.alertType === 'OVERDUE';

                                    return (
                                        <tr 
                                            key={item.id} 
                                            className={`transition-all ${
                                                isOverdue 
                                                ? 'bg-rose-950/20 hover:bg-rose-950/40 border-l-4 border-l-rose-500' 
                                                : 'bg-amber-950/20 hover:bg-amber-950/40 border-l-4 border-l-amber-500'
                                            } ${isSelected ? 'ring-1 ring-amber-400/50' : ''}`}
                                        >
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectItem(item.id)}
                                                    className="cursor-pointer accent-amber-500"
                                                />
                                            </td>
                                            <td className="p-4">
                                                {isOverdue ? (
                                                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                                                        <AlertCircle size={12} /> VENCIDO (Fuera de Plazo)
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                                                        <CalendarClock size={12} /> POR VENCER ({item.daysUntilExpiry} Días)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 font-bold text-white">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-slate-400" />
                                                    <div>
                                                        <div>{item.companyName}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{item.contactEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-200">
                                                <div className="flex items-center gap-2">
                                                    {item.entityType === EntityType.COMPANY && <Building2 size={14} className="text-blue-400" />}
                                                    {item.entityType === EntityType.WORKER && <User size={14} className="text-emerald-400" />}
                                                    {item.entityType === EntityType.VEHICLE && <Truck size={14} className="text-purple-400" />}
                                                    <span>{item.entityName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-white">
                                                <div className="flex items-center gap-1.5">
                                                    <FileText size={14} className="text-slate-400" />
                                                    <span>{item.requirementName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-mono font-bold">
                                                {new Date(item.expiryDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right font-mono font-black">
                                                {isOverdue ? (
                                                    <span className="text-rose-400">Hace {Math.abs(item.daysUntilExpiry)} días</span>
                                                ) : (
                                                    <span className="text-amber-400">En {item.daysUntilExpiry} días</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL ENVÍO REMITENTE MASIVO DE EMAILS */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Mail size={20} />
                                <h3 className="text-lg font-bold text-white">Despacho de Recordatorio Masivo por Correo</h3>
                            </div>
                            <button 
                                onClick={() => setShowEmailModal(false)}
                                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-300">
                                <span>Destinatarios Seleccionados:</span>
                                <strong className="text-amber-400 font-mono text-sm">
                                    {selectedItems.size > 0 ? selectedItems.size : filteredItems.length} Alertas Afectadas
                                </strong>
                            </div>

                            <div>
                                <label className="block text-slate-400 font-medium mb-1">Asunto del Correo Electrónico:</label>
                                <input 
                                    type="text" 
                                    value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 font-medium mb-1">Cuerpo del Mensaje (Automatizado):</label>
                                <textarea 
                                    rows={6}
                                    value={emailMessage}
                                    onChange={e => setEmailMessage(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                                />
                            </div>

                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-start gap-2">
                                <Sparkles size={16} className="shrink-0 text-amber-400 mt-0.5" />
                                <div>
                                    El sistema adjuntará automáticamente el desglose de documentos vencidos y/o por vencer asociados a cada empresa contratista, junto con el enlace directo al portal de carga.
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                            <button 
                                onClick={() => setShowEmailModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer font-bold text-xs"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSendBulkEmail}
                                disabled={isSending}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                            >
                                {isSending ? (
                                    <><RefreshCw size={14} className="animate-spin" /> Despachando Correos...</>
                                ) : (
                                    <><Send size={14} /> Confirmar & Enviar Correos Masivos</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
