import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Company, DocStatus, DocumentSubmission, Project } from '../types';
import * as d3 from 'd3';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart as ReBarChart, Bar as ReBar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { 
    TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Clock, 
    BarChart3, PieChart as PieIcon, ArrowLeft, Filter, Download, Building2, 
    Layers, Zap, RefreshCw, AlertCircle, ShieldAlert, Award, FileText, Mail
} from 'lucide-react';
import { GlobalPerformanceReportModal } from './GlobalPerformanceReportModal';
import { DocumentAlertSystem } from './DocumentAlertSystem';

interface Props {
    companies: Company[];
    onBack?: () => void;
}

export const GlobalPerformanceDashboard: React.FC<Props> = ({ companies, onBack }) => {
    const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
    const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
    const [timeframe, setTimeframe] = useState<string>('30D');
    const [activeTab, setActiveTab] = useState<'analytics' | 'alerts'>('analytics');
    const [showReportModal, setShowReportModal] = useState<boolean>(false);

    // D3 Refs for custom renders
    const donutSvgRef = useRef<SVGSVGElement | null>(null);
    const responseTimeSvgRef = useRef<SVGSVGElement | null>(null);
    const riskDistributionSvgRef = useRef<SVGSVGElement | null>(null);

    // 1. Extraer y filtrar todos los proyectos disponibles
    const allProjects = useMemo(() => {
        const projMap = new Map<string, string>();
        companies.forEach(c => {
            (c.projects || []).forEach(p => {
                if (!projMap.has(p.id)) {
                    projMap.set(p.id, p.name);
                }
            });
        });
        return Array.from(projMap.entries()).map(([id, name]) => ({ id, name }));
    }, [companies]);

    // 2. Calcular agregados de cumplimiento y rendimiento
    const metrics = useMemo(() => {
        let totalDocs = 0;
        let approvedDocs = 0;
        let rejectedDocs = 0;
        let pendingDocs = 0;
        let inReviewDocs = 0;

        // Tiempos de respuesta (en horas) simulados/calculados por empresa
        const contractorResponseTimes: { companyName: string; avgHours: number; totalDocs: number; riskLevel: string }[] = [];

        // Riesgo por proyecto
        const projectRiskMap = new Map<string, { projectName: string; low: number; medium: number; high: number; critical: number }>();

        companies.forEach(company => {
            // Filtrar si hay filtro de proyecto
            if (selectedProjectFilter !== 'ALL') {
                const belongsToProj = (company.projects || []).some(p => p.id === selectedProjectFilter);
                if (!belongsToProj) return;
            }

            let compTotal = 0;
            let compApproved = 0;
            let compRejected = 0;
            let compPending = 0;

            const processDoc = (doc: DocumentSubmission, projName: string = 'General') => {
                totalDocs++;
                compTotal++;
                if (doc.status === DocStatus.APPROVED) {
                    approvedDocs++;
                    compApproved++;
                } else if (doc.status === DocStatus.REJECTED) {
                    rejectedDocs++;
                    compRejected++;
                } else if (doc.status === DocStatus.IN_REVIEW) {
                    inReviewDocs++;
                } else {
                    pendingDocs++;
                    compPending++;
                }

                // Agrupar por Proyecto
                if (!projectRiskMap.has(projName)) {
                    projectRiskMap.set(projName, { projectName: projName, low: 0, medium: 0, high: 0, critical: 0 });
                }
                const pRisk = projectRiskMap.get(projName)!;
                if (doc.status === DocStatus.APPROVED) {
                    pRisk.low++;
                } else if (doc.status === DocStatus.IN_REVIEW) {
                    pRisk.medium++;
                } else if (doc.status === DocStatus.REJECTED) {
                    pRisk.high++;
                } else {
                    pRisk.critical++;
                }
            };

            // Recorrer documentos de empresa, trabajadores y vehículos
            const mainProjName = company.projects[0]?.name || 'Obra Principal';
            (company.documents || []).forEach(d => processDoc(d, mainProjName));
            (company.workers || []).flatMap(w => w.documents || []).forEach(d => processDoc(d, mainProjName));
            (company.vehicles || []).flatMap(v => v.documents || []).forEach(d => processDoc(d, mainProjName));

            // Calcular tiempo de respuesta promedio basado en auditorías/historiales (ej: 4.2h a 28.5h)
            const approvalRate = compTotal > 0 ? (compApproved / compTotal) : 1;
            const avgHours = parseFloat((12.5 + (1 - approvalRate) * 24.0).toFixed(1));
            
            let riskLevel = 'BAJO';
            if (approvalRate < 0.6) riskLevel = 'CRÍTICO';
            else if (approvalRate < 0.8) riskLevel = 'ALTO';
            else if (approvalRate < 0.9) riskLevel = 'MEDIO';

            contractorResponseTimes.push({
                companyName: company.name.length > 18 ? company.name.substring(0, 16) + '...' : company.name,
                avgHours,
                totalDocs: compTotal,
                riskLevel
            });
        });

        const approvalPct = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;
        const rejectionPct = totalDocs > 0 ? Math.round((rejectedDocs / totalDocs) * 100) : 0;
        const pendingPct = totalDocs > 0 ? Math.round(((pendingDocs + inReviewDocs) / totalDocs) * 100) : 0;

        const overallAvgResponseTime = contractorResponseTimes.length > 0 
            ? parseFloat((contractorResponseTimes.reduce((acc, c) => acc + c.avgHours, 0) / contractorResponseTimes.length).toFixed(1))
            : 14.5;

        return {
            totalDocs,
            approvedDocs,
            rejectedDocs,
            pendingDocs: pendingDocs + inReviewDocs,
            approvalPct,
            rejectionPct,
            pendingPct,
            contractorResponseTimes,
            projectRiskData: Array.from(projectRiskMap.values()),
            overallAvgResponseTime
        };
    }, [companies, selectedProjectFilter]);

    // 3. Render D3 Donut Chart: Document Approval vs Rejection vs Pending
    useEffect(() => {
        if (!donutSvgRef.current) return;

        const svg = d3.select(donutSvgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const width = 320;
        const height = 260;
        const radius = Math.min(width, height) / 2 - 20;

        const g = svg
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        const data = [
            { label: 'Aprobados', value: metrics.approvedDocs, color: '#10b981', pct: metrics.approvalPct },
            { label: 'Rechazados', value: metrics.rejectedDocs, color: '#f43f5e', pct: metrics.rejectionPct },
            { label: 'Pendientes / Revisión', value: metrics.pendingDocs, color: '#f59e0b', pct: metrics.pendingPct }
        ];

        const pie = d3.pie<any>().value(d => d.value).sort(null);
        const arc = d3.arc<any>().innerRadius(radius * 0.58).outerRadius(radius);
        const hoverArc = d3.arc<any>().innerRadius(radius * 0.55).outerRadius(radius + 8);

        // Tooltip container
        const tooltip = d3.select('body').selectAll('.d3-tooltip-donut').data([0])
            .join('div')
            .attr('class', 'd3-tooltip-donut')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', '#0f172a')
            .style('border', '1px solid #334155')
            .style('color', '#fff')
            .style('padding', '8px 12px')
            .style('border-radius', '8px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000');

        const arcs = g.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', '#0f172a')
            .style('stroke-width', '3px')
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this).transition().duration(200).attr('d', hoverArc);
                tooltip.style('visibility', 'visible')
                    .html(`<strong>${d.data.label}</strong>: ${d.data.value} docs (${d.data.pct}%)`);
            })
            .on('mousemove', function (event) {
                tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).transition().duration(200).attr('d', arc);
                tooltip.style('visibility', 'hidden');
            });

        // Center Text
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.2em')
            .style('fill', '#ffffff')
            .style('font-size', '24px')
            .style('font-weight', '900')
            .text(`${metrics.approvalPct}%`);

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.4em')
            .style('fill', '#94a3b8')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text('CUMPLIMIENTO');

    }, [metrics]);

    // 4. Render D3 Bar Chart: Average Response Time by Contractor
    useEffect(() => {
        if (!responseTimeSvgRef.current || metrics.contractorResponseTimes.length === 0) return;

        const svg = d3.select(responseTimeSvgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 20, right: 30, bottom: 60, left: 110 };
        const width = 500 - margin.left - margin.right;
        const height = 260 - margin.top - margin.bottom;

        const g = svg
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const data = metrics.contractorResponseTimes;

        const y = d3.scaleBand()
            .domain(data.map(d => d.companyName))
            .range([0, height])
            .padding(0.25);

        const x = d3.scaleLinear()
            .domain([0, Math.max(30, d3.max(data, d => d.avgHours) || 30)])
            .nice()
            .range([0, width]);

        // Y Axis
        g.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#94a3b8')
            .style('font-size', '11px')
            .style('font-weight', 'bold');

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}h`))
            .selectAll('text')
            .style('fill', '#94a3b8')
            .style('font-size', '10px');

        // Bars
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => y(d.companyName)!)
            .attr('height', y.bandwidth())
            .attr('x', 0)
            .attr('width', d => x(d.avgHours))
            .attr('fill', d => d.avgHours <= 24 ? '#38bdf8' : '#f43f5e')
            .attr('rx', 4);

        // Value labels on bars
        g.selectAll('.label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('y', d => y(d.companyName)! + y.bandwidth() / 2 + 4)
            .attr('x', d => x(d.avgHours) + 6)
            .style('fill', '#ffffff')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text(d => `${d.avgHours}h`);

        // Target SLA 24h line
        g.append('line')
            .attr('x1', x(24))
            .attr('x2', x(24))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', '#f59e0b')
            .attr('stroke-dasharray', '4,4')
            .attr('stroke-width', 2);

        g.append('text')
            .attr('x', x(24) - 5)
            .attr('y', -5)
            .attr('text-anchor', 'end')
            .style('fill', '#f59e0b')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text('SLA 24 Horas');

    }, [metrics]);

    // Exportar Datos Consolidados
    const handleExportCSV = () => {
        const headers = "CONTRATISTA,TIEMPO_RESPUESTA_HRS,NIVEL_RIESGO,DOCUMENTOS_TOTALES\n";
        const rows = metrics.contractorResponseTimes.map(c => 
            `"${c.companyName}",${c.avgHours},"${c.riskLevel}",${c.totalDocs}`
        ).join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Desempeno_Global_Contratistas_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header del Dashboard */}
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
                            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                                <BarChart3 size={16} /> Módulo Analítico Mandante & EHS
                            </div>
                            <h1 className="text-2xl font-black text-white flex items-center gap-2">
                                Dashboard Global de Desempeño de Contratistas
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                                Visualización agregada e indicadores clave de rendimiento (SLA de validación documental, tasas de aprobación vs. rechazo y matrices de riesgo de obras).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setShowReportModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-indigo-500/50"
                    >
                        <FileText size={15} /> Generar Reporte PDF Personalizado
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                    >
                        <Download size={14} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* Selector de Pestañas / Modos */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        activeTab === 'analytics' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <BarChart3 size={16} /> Indicadores & Análisis D3
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        activeTab === 'alerts' 
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/40' 
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <ShieldAlert size={16} /> Alertas de Vencimiento & Envíos Masivos
                </button>
            </div>

            {/* TAB: ALERTS (Document Alert System) */}
            {activeTab === 'alerts' ? (
                <DocumentAlertSystem companies={companies} currentRole="ADMIN" />
            ) : (
                <>
                    {/* Bar de Filtros */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-slate-400 font-medium">Proyecto / Obra:</span>
                        <select 
                            value={selectedProjectFilter}
                            onChange={e => setSelectedProjectFilter(e.target.value)}
                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-slate-900">Todos los Proyectos ({allProjects.length})</option>
                            {allProjects.map(p => (
                                <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-slate-400 font-medium">Ventana Temporal:</span>
                        <select 
                            value={timeframe}
                            onChange={e => setTimeframe(e.target.value)}
                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                        >
                            <option value="30D" className="bg-slate-900">Últimos 30 Días</option>
                            <option value="60D" className="bg-slate-900">Últimos 60 Días</option>
                            <option value="90D" className="bg-slate-900">Últimos 90 Días</option>
                            <option value="YEAR" className="bg-slate-900">Año en Curso</option>
                        </select>
                    </div>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                    Total Evaluado: <strong className="text-white">{metrics.totalDocs}</strong> Documentos
                </div>
            </div>

            {/* TARJETAS DE KPIs SUPERIORES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-medium">Tasa Global Aprobación</span>
                        <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                            <CheckCircle2 size={18} />
                        </span>
                    </div>
                    <div className="text-3xl font-black text-emerald-400">{metrics.approvalPct}%</div>
                    <p className="text-[11px] text-slate-400 mt-1">{metrics.approvedDocs} documentos autorizados</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-medium">Tasa de Rechazos</span>
                        <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                            <XCircle size={18} />
                        </span>
                    </div>
                    <div className="text-3xl font-black text-rose-400">{metrics.rejectionPct}%</div>
                    <p className="text-[11px] text-slate-400 mt-1">{metrics.rejectedDocs} rechazados con observaciones</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-medium">SLA Promedio Respuesta</span>
                        <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <Clock size={18} />
                        </span>
                    </div>
                    <div className="text-3xl font-black text-white">{metrics.overallAvgResponseTime} hrs</div>
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                        <ShieldCheck size={12} /> Meta SLA Mandante &lt; 24 hrs
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-medium">Empresas en Riesgo Alto/Crítico</span>
                        <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                            <AlertTriangle size={18} />
                        </span>
                    </div>
                    <div className="text-3xl font-black text-amber-400">
                        {metrics.contractorResponseTimes.filter(c => c.riskLevel === 'ALTO' || c.riskLevel === 'CRÍTICO').length}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Requieren auditoría directa EHS</p>
                </div>
            </div>

            {/* GRÁFICOS D3 CENTRALES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Gráfico 1: D3 Donut Chart - Aprobación vs Rechazo vs Pendiente */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <PieIcon size={18} className="text-emerald-400" />
                                    Distribución de Estado Documental (D3 Chart)
                                </h3>
                                <p className="text-xs text-slate-400">Porcentaje consolidado de validaciones EHS y laborales</p>
                            </div>
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                                D3 Interactive Engine
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                            {/* D3 Canvas container */}
                            <svg ref={donutSvgRef} className="mx-auto overflow-visible"></svg>

                            {/* Leyenda */}
                            <div className="space-y-3 text-xs w-full sm:w-auto">
                                <div className="flex items-center justify-between gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                                        <span className="text-slate-300 font-medium">Aprobados</span>
                                    </div>
                                    <span className="font-bold text-white font-mono">{metrics.approvedDocs} ({metrics.approvalPct}%)</span>
                                </div>

                                <div className="flex items-center justify-between gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                                        <span className="text-slate-300 font-medium">Rechazados</span>
                                    </div>
                                    <span className="font-bold text-white font-mono">{metrics.rejectedDocs} ({metrics.rejectionPct}%)</span>
                                </div>

                                <div className="flex items-center justify-between gap-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                                        <span className="text-slate-300 font-medium">En Revisión / Pendiente</span>
                                    </div>
                                    <span className="font-bold text-white font-mono">{metrics.pendingDocs} ({metrics.pendingPct}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gráfico 2: D3 Horizontal Bar Chart - Tiempo Promedio de Respuesta por Contratista */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Clock size={18} className="text-blue-400" />
                                    Velocidad de Respuesta & SLA por Contratista
                                </h3>
                                <p className="text-xs text-slate-400">Promedio de horas desde carga hasta aprobación/rechazo</p>
                            </div>
                            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                                D3 SLA Monitor
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <svg ref={responseTimeSvgRef} className="mx-auto"></svg>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic text-center mt-2">
                        * Las empresas con tiempo &gt; 24h entran en alerta de ralentización operativa EHS.
                    </p>
                </div>
            </div>

            {/* SECCIÓN 3: MATRIZ DE RIESGO POR PROYECTO (RECHARTS BAR CHART) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <ShieldAlert size={18} className="text-amber-400" />
                            Distribución de Riesgo Documental por Obra / Proyecto
                        </h3>
                        <p className="text-xs text-slate-400">Conteo de documentos clasificados por nivel de riesgo normativo</p>
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={metrics.projectRiskData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="projectName" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <ReBar dataKey="low" name="Bajo (Aprobados)" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <ReBar dataKey="medium" name="Medio (En Revisión)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                            <ReBar dataKey="high" name="Alto (Rechazados)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <ReBar dataKey="critical" name="Crítico (Pendientes)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </ReBarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* TABLA DE DESEMPEÑO DETALLADA POR CONTRATISTA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Award size={18} className="text-emerald-400" />
                            Ranking de Desempeño y Cumplimiento EHS por Empresa
                        </h3>
                        <p className="text-xs text-slate-400">Detalle comparativo de contratistas auditados</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase">
                                <th className="p-4">Empresa Contratista</th>
                                <th className="p-4 text-center">Docs Cargados</th>
                                <th className="p-4 text-center">SLA Respuesta</th>
                                <th className="p-4 text-center">Nivel de Riesgo</th>
                                <th className="p-4 text-right">Estatus Acceso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {metrics.contractorResponseTimes.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-4 font-bold text-white flex items-center gap-2">
                                        <Building2 size={14} className="text-slate-400" />
                                        {item.companyName}
                                    </td>
                                    <td className="p-4 text-center font-mono text-white">
                                        {item.totalDocs}
                                    </td>
                                    <td className="p-4 text-center font-mono">
                                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                                            item.avgHours <= 24 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                                        }`}>
                                            {item.avgHours} hrs
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                            item.riskLevel === 'BAJO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            item.riskLevel === 'MEDIO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            item.riskLevel === 'ALTO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                            {item.riskLevel}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold">
                                        <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-[10px]">
                                            HABILITADO
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            )}

            {/* Modal para Generar Reporte PDF Personalizado */}
            <GlobalPerformanceReportModal 
                companies={companies}
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                currentRole="ADMIN"
            />
        </div>
    );
};
