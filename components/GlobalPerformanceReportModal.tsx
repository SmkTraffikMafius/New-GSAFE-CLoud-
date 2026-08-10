import React, { useState, useMemo } from 'react';
import { Company, DocStatus, EntityType, ReqCategory, RequirementDef } from '../types';
import { REQUIREMENTS } from '../mockData';
import { 
    X, Download, Printer, FileText, Calendar, Building2, Filter, 
    CheckCircle2, AlertTriangle, ShieldCheck, PieChart, Layers, 
    Sliders, Sparkles, Award, FileSpreadsheet, Lock
} from 'lucide-react';

interface Props {
    companies: Company[];
    isOpen: boolean;
    onClose: () => void;
    currentRole?: 'ADMIN' | 'CONTRACTOR' | 'MASTER_ADMIN';
    userCompanyId?: string;
}

export const GlobalPerformanceReportModal: React.FC<Props> = ({ 
    companies, 
    isOpen, 
    onClose,
    currentRole = 'ADMIN',
    userCompanyId
}) => {
    // Reporting Filters
    const [dateRangePreset, setDateRangePreset] = useState<'30D' | '60D' | '90D' | 'YTD' | 'CUSTOM'>('30D');
    const [startDate, setStartDate] = useState<string>(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');
    const [reportTitle, setReportTitle] = useState<string>('Informe Ejecutivo de Desempeño y Cumplimiento Normativo EHS');
    const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

    // List of unique projects
    const allProjects = useMemo(() => {
        const pMap = new Map<string, string>();
        companies.forEach(c => {
            (c.projects || []).forEach(p => {
                pMap.set(p.id, p.name);
            });
        });
        return Array.from(pMap.entries()).map(([id, name]) => ({ id, name }));
    }, [companies]);

    // Categories
    const categories = [
        { id: 'ALL', name: 'Todas las Categorías' },
        { id: ReqCategory.LEGAL, name: 'Legales & Contratación (Art. 183)' },
        { id: ReqCategory.HEALTH, name: 'Salud Ocupacional & Exámenes' },
        { id: ReqCategory.TRAINING, name: 'Capacitación & Inducciones' },
        { id: ReqCategory.TECHNICAL, name: 'Técnicos & Certificaciones' },
        { id: ReqCategory.CRITICAL, name: 'Trabajos de Alto Riesgo' },
        { id: ReqCategory.EHS, name: 'Seguridad y Medio Ambiente (EHS)' }
    ];

    // Presets handler
    const handlePresetChange = (preset: '30D' | '60D' | '90D' | 'YTD' | 'CUSTOM') => {
        setDateRangePreset(preset);
        const now = new Date();
        if (preset === '30D') {
            setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (preset === '60D') {
            setStartDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (preset === '90D') {
            setStartDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (preset === 'YTD') {
            setStartDate(`${now.getFullYear()}-01-01`);
            setEndDate(now.toISOString().split('T')[0]);
        }
    };

    // Calculate report statistics based on filters
    const reportData = useMemo(() => {
        let totalDocs = 0;
        let approvedDocs = 0;
        let rejectedDocs = 0;
        let pendingDocs = 0;
        let inReviewDocs = 0;
        let expiringSoonDocs = 0;
        let overdueDocs = 0;

        const companyStats: { id: string; name: string; rut: string; total: number; approved: number; score: number }[] = [];

        const targetCompanies = userCompanyId 
            ? companies.filter(c => c.id === userCompanyId || c.parentCompanyId === userCompanyId)
            : companies;

        targetCompanies.forEach(comp => {
            if (selectedCompanyId !== 'ALL' && comp.id !== selectedCompanyId) return;

            let cTotal = 0;
            let cApproved = 0;

            const processDoc = (doc: any, reqCat?: string) => {
                // Category Filter
                if (selectedCategory !== 'ALL' && reqCat !== selectedCategory) return;

                totalDocs++;
                cTotal++;

                if (doc.status === DocStatus.APPROVED) {
                    approvedDocs++;
                    cApproved++;
                } else if (doc.status === DocStatus.REJECTED) {
                    rejectedDocs++;
                } else if (doc.status === DocStatus.IN_REVIEW) {
                    inReviewDocs++;
                } else {
                    pendingDocs++;
                }

                // Expiry checks
                if (doc.expiryDate) {
                    const exp = new Date(doc.expiryDate);
                    const today = new Date();
                    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    if (diffDays < 0) overdueDocs++;
                    else if (diffDays <= 30) expiringSoonDocs++;
                }
            };

            // Company level
            (comp.documents || []).forEach(d => {
                const req = REQUIREMENTS.find(r => r.id === d.requirementId);
                processDoc(d, req?.category);
            });

            // Workers
            (comp.workers || []).forEach(w => {
                (w.documents || []).forEach(d => {
                    const req = REQUIREMENTS.find(r => r.id === d.requirementId);
                    processDoc(d, req?.category);
                });
            });

            // Vehicles
            (comp.vehicles || []).forEach(v => {
                (v.documents || []).forEach(d => {
                    const req = REQUIREMENTS.find(r => r.id === d.requirementId);
                    processDoc(d, req?.category);
                });
            });

            const score = cTotal > 0 ? Math.round((cApproved / cTotal) * 100) : 100;
            if (cTotal > 0) {
                companyStats.push({
                    id: comp.id,
                    name: comp.name,
                    rut: comp.rut,
                    total: cTotal,
                    approved: cApproved,
                    score
                });
            }
        });

        const overallComplianceRate = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 100;

        return {
            totalDocs,
            approvedDocs,
            rejectedDocs,
            pendingDocs,
            inReviewDocs,
            expiringSoonDocs,
            overdueDocs,
            overallComplianceRate,
            companyStats: companyStats.sort((a, b) => b.score - a.score)
        };
    }, [companies, selectedCompanyId, selectedCategory, selectedProjectId, userCompanyId]);

    // Handle Print
    const handlePrintPDF = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:static print:overflow-visible">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:bg-white print:text-slate-900 print:w-full print:p-0">
                
                {/* Header Control Toolbar (Hidden in Print) */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                            <FileText size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Generador de Reportes PDF Personalizables
                            </h2>
                            <p className="text-xs text-slate-400">
                                Filtre por rango de fechas, sitio de proyecto y categoría para emitir el resumen ejecutivo.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrintPDF}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                            <Printer size={16} /> Descargar / Imprimir Reporte PDF
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Filter Controls (Hidden in Print) */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs print:hidden">
                    {/* Date Range Preset */}
                    <div>
                        <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                            <Calendar size={13} className="text-indigo-400" /> Rango de Fechas:
                        </label>
                        <div className="flex flex-wrap gap-1">
                            {(['30D', '60D', '90D', 'YTD'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => handlePresetChange(p)}
                                    className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                                        dateRangePreset === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start / End Date */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-slate-400 font-medium mb-1">Desde:</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => { setStartDate(e.target.value); setDateRangePreset('CUSTOM'); }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 font-medium mb-1">Hasta:</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => { setEndDate(e.target.value); setDateRangePreset('CUSTOM'); }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                        </div>
                    </div>

                    {/* Project Site */}
                    <div>
                        <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                            <Building2 size={13} className="text-indigo-400" /> Sitio / Proyecto:
                        </label>
                        <select 
                            value={selectedProjectId}
                            onChange={e => setSelectedProjectId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                            <option value="ALL">Todos los Proyectos y Obras</option>
                            {allProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Compliance Category */}
                    <div>
                        <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                            <Filter size={13} className="text-indigo-400" /> Categoría de Cumplimiento:
                        </label>
                        <select 
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* --- OFFICIAL DOCUMENT PREVIEW & PRINT CANVAS --- */}
                <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 print:p-0 print:shadow-none print:rounded-none">
                    
                    {/* Document Letterhead */}
                    <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest">
                                <ShieldCheck size={18} /> GSAFE COMPLIANCE MANAGER - SISTEMA DE AUDITORÍA
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                {reportTitle}
                            </h1>
                            <p className="text-xs text-slate-600 font-medium">
                                Certificado de Estado Normativo, Acreditación Laboral & Seguridad Ocupacional
                            </p>
                        </div>

                        <div className="text-right space-y-1 font-mono text-[11px] text-slate-600">
                            <div><strong>FOLIO:</strong> RPT-{Date.now().toString().slice(-8)}</div>
                            <div><strong>FECHA EMISIÓN:</strong> {new Date().toLocaleDateString('es-CL')}</div>
                            <div><strong>PERÍODO:</strong> {startDate} al {endDate}</div>
                            <div className="inline-block bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-bold text-slate-800 mt-1">
                                VERIFICADO LEY N° 20.123
                            </div>
                        </div>
                    </div>

                    {/* Filter Summary Stamp */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                            <span className="text-slate-500 block text-[10px] font-mono uppercase">Sitio / Proyecto</span>
                            <strong className="text-slate-800">{selectedProjectId === 'ALL' ? 'Consolidado General (Todas las Obras)' : allProjects.find(p => p.id === selectedProjectId)?.name}</strong>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-[10px] font-mono uppercase">Categoría Requisito</span>
                            <strong className="text-slate-800">{categories.find(c => c.id === selectedCategory)?.name}</strong>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-[10px] font-mono uppercase">Empresas Evaluadas</span>
                            <strong className="text-slate-800">{reportData.companyStats.length} Contratistas</strong>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-[10px] font-mono uppercase">Índice General de Cumplimiento</span>
                            <strong className={`font-black font-mono text-sm ${reportData.overallComplianceRate >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {reportData.overallComplianceRate}%
                            </strong>
                        </div>
                    </div>

                    {/* KPI Summary Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Documentos</span>
                            <div className="text-2xl font-black text-slate-900 mt-1">{reportData.totalDocs}</div>
                        </div>
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Aprobados / Vigentes</span>
                            <div className="text-2xl font-black text-emerald-700 mt-1">{reportData.approvedDocs}</div>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <span className="text-[10px] text-amber-800 font-bold uppercase block">Por Vencer (&lt;30d)</span>
                            <div className="text-2xl font-black text-amber-700 mt-1">{reportData.expiringSoonDocs}</div>
                        </div>
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                            <span className="text-[10px] text-rose-800 font-bold uppercase block">Vencidos / Rechazados</span>
                            <div className="text-2xl font-black text-rose-700 mt-1">{reportData.overdueDocs + reportData.rejectedDocs}</div>
                        </div>
                    </div>

                    {/* Contractor Breakdown Table */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                            Desglose por Empresa Contratista & Subcontratista
                        </h3>
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                    <th className="p-2.5">RUT</th>
                                    <th className="p-2.5">Razón Social</th>
                                    <th className="p-2.5 text-center">Total Requeridos</th>
                                    <th className="p-2.5 text-center">Aprobados</th>
                                    <th className="p-2.5 text-right">% Cumplimiento</th>
                                    <th className="p-2.5 text-center">Estado Acreditación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {reportData.companyStats.map(c => (
                                    <tr key={c.id}>
                                        <td className="p-2.5 font-mono text-slate-600">{c.rut}</td>
                                        <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                                        <td className="p-2.5 text-center font-mono">{c.total}</td>
                                        <td className="p-2.5 text-center font-mono text-emerald-700 font-bold">{c.approved}</td>
                                        <td className="p-2.5 text-right font-mono font-black">{c.score}%</td>
                                        <td className="p-2.5 text-center">
                                            {c.score >= 90 ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                                    HABILITADO
                                                </span>
                                            ) : c.score >= 70 ? (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                                                    OBSERVADO
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                                                    BLOQUEADO
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Official Signatures & Digital Seal */}
                    {includeSignatures && (
                        <div className="pt-8 mt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                            <div className="space-y-2">
                                <div className="h-12 border-b border-dashed border-slate-400 mx-auto w-48"></div>
                                <p className="font-bold text-slate-900">Firma Administrador de Contrato</p>
                                <p className="text-[10px] text-slate-500">Representante Mandante / EHS</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-12 border-b border-dashed border-slate-400 mx-auto w-48"></div>
                                <p className="font-bold text-slate-900">Sello de Validación Digital GSAFE</p>
                                <p className="text-[10px] text-slate-500 font-mono">HASH: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
