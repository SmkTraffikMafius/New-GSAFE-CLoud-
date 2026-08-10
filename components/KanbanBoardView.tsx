import React, { useState } from 'react';
import { Company, DocStatus, DocumentSubmission, Worker, Vehicle } from '../types';
import { REQUIREMENTS } from '../mockData';
import { 
    Clock, CheckCircle2, XCircle, AlertOctagon, FileText, 
    Bot, User, Truck, Building2, Search, Filter, ShieldCheck, ArrowRight
} from 'lucide-react';

interface Props {
    company: Company;
    selectedProjectId?: string;
    onReviewClick?: (doc: DocumentSubmission, entityName: string) => void;
}

export const KanbanBoardView: React.FC<Props> = ({ company, selectedProjectId, onReviewClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [entityFilter, setEntityFilter] = useState<'ALL' | 'COMPANY' | 'WORKER' | 'VEHICLE'>('ALL');

    const activeProject = selectedProjectId 
        ? company.projects.find(p => p.id === selectedProjectId)
        : company.projects[0];

    // Collect all documents into Kanban columns
    const allItems: Array<{
        id: string;
        title: string;
        entityName: string;
        entityType: 'COMPANY' | 'WORKER' | 'VEHICLE';
        status: DocStatus | 'MISSING' | 'EXPIRED';
        doc?: DocumentSubmission;
        expiryDate?: string;
    }> = [];

    // 1. Company docs
    company.documents.forEach(doc => {
        if (activeProject && doc.projectId !== activeProject.id) return;
        const req = REQUIREMENTS.find(r => r.id === doc.requirementId);
        allItems.push({
            id: doc.id,
            title: req ? req.name : 'Documento Empresa',
            entityName: company.name,
            entityType: 'COMPANY',
            status: doc.status,
            doc,
            expiryDate: doc.expiryDate
        });
    });

    // 2. Worker docs
    company.workers.forEach(worker => {
        worker.documents.forEach(doc => {
            if (activeProject && doc.projectId !== activeProject.id) return;
            const req = REQUIREMENTS.find(r => r.id === doc.requirementId);
            allItems.push({
                id: doc.id,
                title: req ? req.name : 'Documento Trabajador',
                entityName: `${worker.firstName} ${worker.lastName} (${worker.rut})`,
                entityType: 'WORKER',
                status: doc.status,
                doc,
                expiryDate: doc.expiryDate
            });
        });
    });

    // 3. Vehicle docs
    company.vehicles.forEach(vehicle => {
        vehicle.documents.forEach(doc => {
            if (activeProject && doc.projectId !== activeProject.id) return;
            const req = REQUIREMENTS.find(r => r.id === doc.requirementId);
            allItems.push({
                id: doc.id,
                title: req ? req.name : 'Documento Vehículo',
                entityName: `Patente ${vehicle.plate} (${vehicle.model})`,
                entityType: 'VEHICLE',
                status: doc.status,
                doc,
                expiryDate: doc.expiryDate
            });
        });
    });

    // Filtering
    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.entityName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = entityFilter === 'ALL' || item.entityType === entityFilter;
        return matchesSearch && matchesType;
    });

    const columns = [
        {
            id: 'PENDING',
            title: 'Pendiente de Carga',
            badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            icon: <Clock size={16} className="text-amber-400" />,
            items: filteredItems.filter(i => i.status === DocStatus.PENDING)
        },
        {
            id: 'IN_REVIEW',
            title: 'En Revisión IA Gemini',
            badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            icon: <Bot size={16} className="text-blue-400 animate-pulse" />,
            items: filteredItems.filter(i => i.status === DocStatus.IN_REVIEW)
        },
        {
            id: 'APPROVED',
            title: 'Aprobados & Vigentes',
            badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            icon: <CheckCircle2 size={16} className="text-emerald-400" />,
            items: filteredItems.filter(i => i.status === DocStatus.APPROVED)
        },
        {
            id: 'REJECTED',
            title: 'Observados / Rechazados',
            badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
            icon: <XCircle size={16} className="text-red-400" />,
            items: filteredItems.filter(i => i.status === DocStatus.REJECTED)
        }
    ];

    return (
        <div className="space-y-6">
            
            {/* Control Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Buscar documento o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Filter size={14} /> Filtrar:
                    </span>
                    <button 
                        onClick={() => setEntityFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${entityFilter === 'ALL' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => setEntityFilter('COMPANY')}
                        className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1 ${entityFilter === 'COMPANY' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                    >
                        <Building2 size={12} /> Empresa
                    </button>
                    <button 
                        onClick={() => setEntityFilter('WORKER')}
                        className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1 ${entityFilter === 'WORKER' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                    >
                        <User size={12} /> Personal
                    </button>
                    <button 
                        onClick={() => setEntityFilter('VEHICLE')}
                        className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1 ${entityFilter === 'VEHICLE' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                    >
                        <Truck size={12} /> Equipos
                    </button>
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map(col => (
                    <div key={col.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col h-[600px]">
                        
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                                {col.icon}
                                <span>{col.title}</span>
                            </div>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
                                {col.items.length}
                            </span>
                        </div>

                        {/* Column Items */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {col.items.length === 0 ? (
                                <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500 font-medium">
                                    Sin registros
                                </div>
                            ) : (
                                col.items.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 shadow-sm transition-all hover:scale-[1.01] flex flex-col justify-between gap-2"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                                                    {item.entityType}
                                                </span>
                                                {item.doc?.aiAudited && (
                                                    <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                                                        <Bot size={10} /> Auditado IA
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-xs text-slate-100 line-clamp-2">
                                                {item.title}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                                {item.entityName}
                                            </p>
                                        </div>

                                        {item.expiryDate && (
                                            <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                                                <span>Vence:</span>
                                                <span className="font-bold text-slate-200">{item.expiryDate}</span>
                                            </div>
                                        )}

                                        {item.doc && onReviewClick && (
                                            <button 
                                                onClick={() => onReviewClick(item.doc!, item.entityName)}
                                                className="w-full mt-1 bg-slate-900 hover:bg-slate-800 text-blue-400 text-[11px] font-bold py-1.5 rounded-lg border border-slate-800 transition-colors flex items-center justify-center gap-1"
                                            >
                                                Ver Detalle &rarr;
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
};
