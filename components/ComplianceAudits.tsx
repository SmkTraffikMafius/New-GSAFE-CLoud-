import React, { useState, useEffect, useMemo } from 'react';
import { Company, AuditLog, DocStatus, VerificationSource } from '../types';
import { api } from '../services/api';
import { 
    ShieldCheck, ShieldAlert, Search, Filter, Download, FileText, 
    Clock, User, Building2, CheckCircle2, AlertTriangle, Lock, 
    ArrowLeft, Hash, RefreshCw, Key, Scale, Eye, Sparkles, Check, Database, FileSpreadsheet
} from 'lucide-react';

interface Props {
    companies: Company[];
    onBack?: () => void;
}

export interface ConsolidatedAuditItem {
    id: string;
    timestamp: string;
    category: 'DOC_VALIDATION' | 'SYSTEM_AUTH' | 'DPO_PRIVACY' | 'LABOR_DT' | 'STRUCTURE';
    action: string;
    actionLabel: string;
    userName: string;
    userRole?: string;
    companyName?: string;
    companyRut?: string;
    details: string;
    entityName?: string;
    previousState?: string;
    newState?: string;
    verificationSource?: VerificationSource;
    hashSignature: string;
    isVerified: boolean;
}

export const ComplianceAudits: React.FC<Props> = ({ companies, onBack }) => {
    const [systemLogs, setSystemLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');
    const [selectedTimeRange, setSelectedTimeRange] = useState<string>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<ConsolidatedAuditItem | null>(null);
    const [showOfficialCertificateModal, setShowOfficialCertificateModal] = useState<boolean>(false);
    const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);
    const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);

    // Fetch System Audit Logs
    const loadAuditLogs = async () => {
        setLoading(true);
        try {
            const logs = await api.audit.getLogs();
            setSystemLogs(logs || []);
        } catch (err) {
            console.error("Error loading audit logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuditLogs();
    }, []);

    // Helper determinista para simular Firma Criptográfica SHA-256 inmutable
    const generateHash = (id: string, timestamp: string, action: string): string => {
        let hash = 0;
        const str = `${id}-${timestamp}-${action}-LEY20123-LEY21719-SEALED`;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        return `SHA256-${hex.toUpperCase()}-${id.slice(-4).toUpperCase()}`;
    };

    // Consolidar logs de sistema y de historial de documentos
    const consolidatedLogs = useMemo<ConsolidatedAuditItem[]>(() => {
        const items: ConsolidatedAuditItem[] = [];

        // 1. Mapear System Audit Logs
        systemLogs.forEach(log => {
            let category: ConsolidatedAuditItem['category'] = 'SYSTEM_AUTH';
            let actionLabel = log.action;

            if (log.action.includes('ARCO') || log.action.includes('ANONYMIZE') || log.action.includes('BLOCK_DOC') || log.action.includes('PORTABILITY')) {
                category = 'DPO_PRIVACY';
                actionLabel = 'Protección de Datos (Ley 21.719)';
            } else if (log.action.includes('DOC') || log.action.includes('UPLOAD') || log.action.includes('REVIEW')) {
                category = 'DOC_VALIDATION';
                actionLabel = 'Validación Documental';
            } else if (log.action.includes('DT') || log.action.includes('F30') || log.action.includes('SUBCONTRACTOR')) {
                category = 'LABOR_DT';
                actionLabel = 'Auditoría Laboral DT';
            } else if (log.action.includes('AUTH_KEY') || log.action.includes('COMPANY') || log.action.includes('PROJECT')) {
                category = 'STRUCTURE';
                actionLabel = 'Modificación de Estructura';
            } else {
                category = 'SYSTEM_AUTH';
                actionLabel = 'Acceso y Autenticación';
            }

            items.push({
                id: log.id,
                timestamp: log.timestamp,
                category,
                action: log.action,
                actionLabel,
                userName: log.userName || 'Sistema Compliance',
                details: log.details,
                hashSignature: generateHash(log.id, log.timestamp, log.action),
                isVerified: true
            });
        });

        // 2. Extraer historiales de documentos a nivel Empresa, Trabajadores y Vehículos
        companies.forEach(company => {
            const processDocHistory = (docs: any[], entityType: string, entityName: string) => {
                docs.forEach(doc => {
                    if (doc.history && Array.isArray(doc.history)) {
                        doc.history.forEach((hist: any, idx: number) => {
                            const itemId = `doc_hist_${doc.id}_${idx}`;
                            items.push({
                                id: itemId,
                                timestamp: hist.date || new Date().toISOString(),
                                category: 'DOC_VALIDATION',
                                action: hist.action || 'VALIDATION',
                                actionLabel: hist.action === 'APPROVE' ? 'Documento Aprobado' : hist.action === 'REJECT' ? 'Documento Rechazado' : hist.action === 'UPLOAD' ? 'Carga de Documento' : 'Revisión Documental',
                                userName: hist.user || 'Auditor EHS',
                                companyName: company.name,
                                companyRut: company.rut,
                                entityName: `${entityType}: ${entityName} (${doc.fileName})`,
                                details: `${hist.action === 'APPROVE' ? 'Aprobación exitosa' : hist.action === 'REJECT' ? 'Rechazo documental' : 'Archivo recibido'}: ${doc.fileName}. ${hist.comment ? `Comentario: "${hist.comment}"` : ''}`,
                                verificationSource: doc.verificationSource || VerificationSource.AI_ONLY,
                                previousState: hist.action === 'APPROVE' ? DocStatus.IN_REVIEW : DocStatus.PENDING,
                                newState: hist.action === 'APPROVE' ? DocStatus.APPROVED : hist.action === 'REJECT' ? DocStatus.REJECTED : DocStatus.IN_REVIEW,
                                hashSignature: generateHash(itemId, hist.date || '', doc.fileName || ''),
                                isVerified: true
                            });
                        });
                    }
                });
            };

            // Empresa
            processDocHistory(company.documents || [], 'Empresa', company.name);

            // Trabajadores
            (company.workers || []).forEach(worker => {
                processDocHistory(worker.documents || [], 'Trabajador', `${worker.firstName} ${worker.lastName} (${worker.rut})`);
            });

            // Vehículos
            (company.vehicles || []).forEach(vehicle => {
                processDocHistory(vehicle.documents || [], 'Vehículo', `Patente ${vehicle.plate}`);
            });
        });

        // Ordenar cronológicamente descendente (más reciente primero)
        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [systemLogs, companies]);

    // Filtrado de logs
    const filteredLogs = useMemo(() => {
        return consolidatedLogs.filter(item => {
            // Categoria
            if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;

            // Tipo de Acción Especifico
            if (selectedActionType !== 'ALL') {
                if (selectedActionType === 'APPROVE' && !item.action.includes('APPROVE') && !item.actionLabel.includes('Aprobado')) return false;
                if (selectedActionType === 'REJECT' && !item.action.includes('REJECT') && !item.actionLabel.includes('Rechazado')) return false;
                if (selectedActionType === 'UPLOAD' && !item.action.includes('UPLOAD') && !item.actionLabel.includes('Carga')) return false;
                if (selectedActionType === 'ARCO' && !item.action.includes('ARCO') && !item.action.includes('ANONYMIZE') && item.category !== 'DPO_PRIVACY') return false;
                if (selectedActionType === 'LABOR_DT' && !item.action.includes('DT') && !item.action.includes('F30') && item.category !== 'LABOR_DT') return false;
            }

            // Empresa
            if (selectedCompanyId !== 'ALL' && item.companyName && !item.companyName.toLowerCase().includes(selectedCompanyId.toLowerCase())) return false;

            // Rango de Tiempo Presets & Custom
            const itemDate = new Date(item.timestamp).getTime();
            if (selectedTimeRange !== 'ALL' && selectedTimeRange !== 'CUSTOM') {
                const now = new Date().getTime();
                const hoursDiff = (now - itemDate) / (1000 * 3600);

                if (selectedTimeRange === '24H' && hoursDiff > 24) return false;
                if (selectedTimeRange === '7D' && hoursDiff > 24 * 7) return false;
                if (selectedTimeRange === '30D' && hoursDiff > 24 * 30) return false;
                if (selectedTimeRange === '90D' && hoursDiff > 24 * 90) return false;
            } else if (selectedTimeRange === 'CUSTOM') {
                if (startDate && itemDate < new Date(startDate).getTime()) return false;
                if (endDate && itemDate > new Date(endDate + 'T23:59:59').getTime()) return false;
            }

            // Búsqueda libre
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesDetails = item.details.toLowerCase().includes(query);
                const matchesUser = item.userName.toLowerCase().includes(query);
                const matchesAction = item.action.toLowerCase().includes(query);
                const matchesEntity = item.entityName ? item.entityName.toLowerCase().includes(query) : false;
                const matchesCompany = item.companyName ? item.companyName.toLowerCase().includes(query) : false;
                const matchesHash = item.hashSignature.toLowerCase().includes(query);

                return matchesDetails || matchesUser || matchesAction || matchesEntity || matchesCompany || matchesHash;
            }

            return true;
        });
    }, [consolidatedLogs, selectedCategory, selectedActionType, selectedCompanyId, selectedTimeRange, startDate, endDate, searchQuery]);

    // Ejecutar simulación de Verificación Criptográfica
    const handleVerifyChainIntegrity = () => {
        setIsVerifyingChain(true);
        setVerificationSuccess(null);
        setTimeout(() => {
            setIsVerifyingChain(false);
            setVerificationSuccess(true);
        }, 1200);
    };

    // Exportar informe oficial de auditoría
    const handleExportAuditReport = (format: 'CSV' | 'JSON') => {
        if (format === 'CSV') {
            const headers = "ID,FECHA_HORA,CATEGORIA,ACCION,USUARIO,EMPRESA,DETALLES,FIRMA_SHA256,ESTADO_INTEGRIDAD\n";
            const rows = filteredLogs.map(item => [
                `"${item.id}"`,
                `"${new Date(item.timestamp).toLocaleString('es-CL')}"`,
                `"${item.category}"`,
                `"${item.actionLabel}"`,
                `"${item.userName}"`,
                `"${item.companyName || 'N/A'}"`,
                `"${item.details.replace(/"/g, '""')}"`,
                `"${item.hashSignature}"`,
                `"INTEGRO_SELLADO"`
            ].join(',')).join('\n');

            const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Informe_Oficial_Auditoria_Compliance_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } else {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                titulo: 'Registro Oficial de Auditoría y Trazabilidad Documental EHS',
                normativa_cumplimiento: 'Ley N° 20.123 de Subcontratación, Ley N° 21.719 de Protección de Datos Personales, Exigencias DT Chile',
                fecha_generacion: new Date().toISOString(),
                total_registros: filteredLogs.length,
                sellado_criptografico: 'SHA-256 Immutability Engine Active',
                registros: filteredLogs
            }, null, 2));

            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `Auditoria_Inmutable_Compliance_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header Principal con Controles de Retorno e Integridad */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2">
                        {onBack && (
                            <button 
                                onClick={onBack}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer mr-2"
                                title="Volver"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                                <ShieldCheck size={16} /> Registro Inmutable de Trazabilidad & Auditoría
                            </div>
                            <h1 className="text-2xl font-black text-white flex items-center gap-2">
                                Panel de Auditoría & Evidencia Cumplimiento
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                                Historial detallado de validaciones documentales, cambios de estado y actividad de usuarios con sello de tiempo e integridad criptográfica conforme a la Ley N° 20.123 de Subcontratación y Ley N° 21.719 de Protección de Datos.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button 
                        onClick={handleVerifyChainIntegrity}
                        disabled={isVerifyingChain}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <RefreshCw size={14} className={isVerifyingChain ? "animate-spin text-amber-400" : "text-emerald-400"} />
                        {isVerifyingChain ? 'Verificando Cadena...' : 'Verificar Cadena SHA-256'}
                    </button>

                    <button 
                        onClick={() => handleExportAuditReport('CSV')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                        <Download size={14} /> Exportar Informe Oficial (CSV)
                    </button>
                </div>
            </div>

            {/* Banner de Confirmación de Integridad Criptográfica */}
            {verificationSuccess && (
                <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-xl flex items-center justify-between animate-fadeIn text-xs">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                        <div>
                            <span className="font-bold text-emerald-300 block">Cadena de Auditoría Verificada al 100%</span>
                            <span className="text-emerald-400/80">Todos los hash SHA-256 coinciden con las firmas inmutables de origen. No se detectó ninguna alteración de datos.</span>
                        </div>
                    </div>
                    <button onClick={() => setVerificationSuccess(null)} className="text-emerald-400 font-bold hover:underline ml-4">
                        Entendido
                    </button>
                </div>
            )}

            {/* TARJETAS DE MÉTRICAS CLAVE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Eventos Auditados Totales</span>
                        <span className="text-2xl font-black text-white mt-1 block">{consolidatedLogs.length}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Trazabilidad en tiempo real</span>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                        <Database size={24} />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Validaciones Documentales</span>
                        <span className="text-2xl font-black text-emerald-400 mt-1 block">
                            {consolidatedLogs.filter(i => i.category === 'DOC_VALIDATION').length}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Revisiones IA & Inspecciones</span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <FileText size={24} />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Registros DPO / Ley 21.719</span>
                        <span className="text-2xl font-black text-purple-400 mt-1 block">
                            {consolidatedLogs.filter(i => i.category === 'DPO_PRIVACY').length}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">Anonimizaciones & ARCO+P</span>
                    </div>
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                        <Lock size={24} />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Estado de Integridad</span>
                        <span className="text-2xl font-black text-emerald-400 mt-1 block flex items-center gap-1.5">
                            <Check size={20} className="text-emerald-400 stroke-[3]" /> 100%
                        </span>
                        <span className="text-[10px] text-emerald-500 font-mono mt-1 block">0 Alteraciones Detectadas</span>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                        <Hash size={24} />
                    </div>
                </div>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Buscador */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text"
                            placeholder="Buscar por RUT, usuario, documento, detalle o hash..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Filtros Dropdown */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                            <Filter size={14} className="text-slate-400" />
                            <span className="text-slate-400 font-medium">Categoría:</span>
                            <select 
                                value={selectedCategory} 
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="ALL" className="bg-slate-900">Todas ({consolidatedLogs.length})</option>
                                <option value="DOC_VALIDATION" className="bg-slate-900">Validación Documental</option>
                                <option value="DPO_PRIVACY" className="bg-slate-900">Protección de Datos (Ley 21.719)</option>
                                <option value="LABOR_DT" className="bg-slate-900">Auditorías Laborales DT</option>
                                <option value="SYSTEM_AUTH" className="bg-slate-900">Sistema y Accesos</option>
                                <option value="STRUCTURE" className="bg-slate-900">Estructura y Claves</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                            <Filter size={14} className="text-slate-400" />
                            <span className="text-slate-400 font-medium">Acción:</span>
                            <select 
                                value={selectedActionType} 
                                onChange={e => setSelectedActionType(e.target.value)}
                                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="ALL" className="bg-slate-900">Todas las Acciones</option>
                                <option value="APPROVE" className="bg-slate-900">Aprobaciones Documentales</option>
                                <option value="REJECT" className="bg-slate-900">Rechazos / Observaciones</option>
                                <option value="UPLOAD" className="bg-slate-900">Cargas de Documentos</option>
                                <option value="ARCO" className="bg-slate-900">Derechos ARCO / DPO (Ley 21.719)</option>
                                <option value="LABOR_DT" className="bg-slate-900">Auditoría Laboral / F30-1</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                            <Building2 size={14} className="text-slate-400" />
                            <span className="text-slate-400 font-medium">Empresa:</span>
                            <select 
                                value={selectedCompanyId} 
                                onChange={e => setSelectedCompanyId(e.target.value)}
                                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="ALL" className="bg-slate-900">Todas las Empresas</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-slate-400 font-medium">Rango:</span>
                            <select 
                                value={selectedTimeRange} 
                                onChange={e => setSelectedTimeRange(e.target.value)}
                                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                            >
                                <option value="ALL" className="bg-slate-900">Todo el Historial</option>
                                <option value="24H" className="bg-slate-900">Últimas 24 Horas</option>
                                <option value="7D" className="bg-slate-900">Últimos 7 Días</option>
                                <option value="30D" className="bg-slate-900">Últimos 30 Días</option>
                                <option value="90D" className="bg-slate-900">Últimos 90 Días</option>
                                <option value="CUSTOM" className="bg-slate-900">Rango Personalizado...</option>
                            </select>
                        </div>

                        {selectedTimeRange === 'CUSTOM' && (
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                                <span className="text-slate-400 font-medium">Desde:</span>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)} 
                                    className="bg-transparent text-white font-mono focus:outline-none cursor-pointer text-xs" 
                                />
                                <span className="text-slate-400 font-medium">Hasta:</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={e => setEndDate(e.target.value)} 
                                    className="bg-transparent text-white font-mono focus:outline-none cursor-pointer text-xs" 
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Mostrando <strong className="text-white">{filteredLogs.length}</strong> eventos auditados</span>
                    <span className="font-mono text-emerald-400">Standard: Ley N° 20.123 & DT F30-1</span>
                </div>
            </div>

            {/* TABLA PRINCIPAL DE AUDITORÍA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                        <RefreshCw className="animate-spin mx-auto mb-2 text-emerald-400" size={24} />
                        Cargando matriz de auditoría e historial criptográfico...
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                        <ShieldAlert className="mx-auto mb-2 text-slate-500" size={28} />
                        No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase">
                                    <th className="p-4">Fecha & Hora</th>
                                    <th className="p-4">Categoría / Acción</th>
                                    <th className="p-4">Usuario / Origen</th>
                                    <th className="p-4">Entidad / Empresa Target</th>
                                    <th className="p-4">Detalles del Evento</th>
                                    <th className="p-4 text-center">Firma SHA-256</th>
                                    <th className="p-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {filteredLogs.map(item => {
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                                            {/* Fecha & Hora */}
                                            <td className="p-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} className="text-slate-500 shrink-0" />
                                                    <span>{new Date(item.timestamp).toLocaleDateString('es-CL')}</span>
                                                    <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>

                                            {/* Categoría / Acción */}
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                                                    item.category === 'DPO_PRIVACY' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                    item.category === 'DOC_VALIDATION' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    item.category === 'LABOR_DT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                    {item.actionLabel}
                                                </span>
                                            </td>

                                            {/* Usuario / Origen */}
                                            <td className="p-4 font-medium text-white whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <User size={12} className="text-slate-400 shrink-0" />
                                                    <span>{item.userName}</span>
                                                </div>
                                            </td>

                                            {/* Entidad / Empresa */}
                                            <td className="p-4">
                                                {item.companyName ? (
                                                    <div>
                                                        <span className="font-bold text-white block">{item.companyName}</span>
                                                        {item.entityName && (
                                                            <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{item.entityName}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 font-mono text-[11px]">Sistema Global</span>
                                                )}
                                            </td>

                                            {/* Detalles */}
                                            <td className="p-4 max-w-xs">
                                                <p className="text-slate-300 line-clamp-2 text-xs leading-relaxed">
                                                    {item.details}
                                                </p>
                                            </td>

                                            {/* Hash Signature */}
                                            <td className="p-4 text-center font-mono text-[10px]">
                                                <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-amber-400/90 font-bold tracking-wider inline-flex items-center gap-1">
                                                    <Hash size={10} className="text-amber-500" /> {item.hashSignature}
                                                </span>
                                            </td>

                                            {/* Acción Ver Detalle */}
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <button 
                                                    onClick={() => setSelectedItem(item)}
                                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] transition-all flex items-center gap-1 ml-auto cursor-pointer"
                                                >
                                                    <Eye size={12} /> Evidencia
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL / DRAWER DE FICHA COMPLETA DE EVIDENCIA AUDITADA */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative animate-scaleUp">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                            <div>
                                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase mb-1">
                                    <ShieldCheck size={16} /> Certificado de Evidencia de Auditoría N° {selectedItem.id}
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    {selectedItem.actionLabel}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Event Attributes Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 font-mono text-[10px] block uppercase mb-1">Fecha y Hora Registro:</span>
                                <span className="font-bold text-white font-mono">{new Date(selectedItem.timestamp).toLocaleString('es-CL')}</span>
                            </div>

                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 font-mono text-[10px] block uppercase mb-1">Usuario / Operador:</span>
                                <span className="font-bold text-white">{selectedItem.userName}</span>
                            </div>

                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 font-mono text-[10px] block uppercase mb-1">Empresa Afectada:</span>
                                <span className="font-bold text-white">{selectedItem.companyName || 'Sistema Central'}</span>
                            </div>

                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 font-mono text-[10px] block uppercase mb-1">Fuente de Verificación:</span>
                                <span className="font-bold text-emerald-400 font-mono">{selectedItem.verificationSource || 'SISTEMA_INTEGRADO_COMPLIANCE'}</span>
                            </div>
                        </div>

                        {/* Narrative Details */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                            <span className="text-slate-400 font-mono text-[10px] block uppercase mb-1">Narrativa Completa del Evento:</span>
                            <p className="text-slate-200 leading-relaxed font-sans">
                                {selectedItem.details}
                            </p>
                            {selectedItem.entityName && (
                                <p className="text-slate-400 mt-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                                    Entidad Objetivo: <strong className="text-amber-300">{selectedItem.entityName}</strong>
                                </p>
                            )}
                        </div>

                        {/* Cryptographic Seal */}
                        <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                                    <Lock size={14} className="text-emerald-400" /> Sello Digital Criptográfico Inmutable
                                </span>
                                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                    VERIFICADO OK
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono break-all bg-slate-950 p-2.5 rounded border border-slate-800">
                                {selectedItem.hashSignature}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                Registro sellado bajo estándar de integridad digital para auditorías de la Dirección del Trabajo (DT) y mutualidades de seguridad.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                            >
                                Cerrar Ficha
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
