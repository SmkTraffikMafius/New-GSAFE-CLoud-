
import React, { useState } from 'react';
import { MonthlySafetyStats, Project, EHSDetails, IncidentDetail } from '../types';
import { X, Save, Activity, Clock, FileText, Info, AlertTriangle, AlertCircle, ShieldAlert, HeartPulse, Leaf, Truck, Users, CheckCircle2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onSaveStats: (projectId: string, stats: MonthlySafetyStats) => void;
}

// Definición de Parámetros para UI dinámica
const STAT_PARAMS: { key: keyof EHSDetails, label: string, icon: any, color: string, desc: string }[] = [
    { key: 'nearMisses', label: 'Cuasi Accidentes (Near Misses)', icon: AlertTriangle, color: 'text-yellow-600', desc: 'Incidentes sin daño real pero con potencial.' },
    { key: 'firstAid', label: 'Lesiones Primeros Auxilios', icon: HeartPulse, color: 'text-blue-500', desc: 'Atención básica en sitio, sin baja.' },
    { key: 'medicalTreatment', label: 'Tratamiento Médico', icon:  HeartPulse, color: 'text-orange-500', desc: 'Requiere atención profesional más allá de primeros auxilios.' },
    { key: 'lostTime', label: 'Lesiones con Tiempo Perdido (CTP)', icon:  ShieldAlert, color: 'text-red-600', desc: 'Resultan en días de ausencia laboral.' },
    { key: 'envIncidents', label: 'Incidentes Ambientales', icon: Leaf, color: 'text-green-600', desc: 'Derrames, emisiones o liberaciones no controladas.' },
    { key: 'propertyDamage', label: 'Daños a la Propiedad', icon: Truck, color: 'text-gray-600', desc: 'Daño material a equipos, instalaciones o vehículos.' },
    { key: 'fatalities', label: 'Muerte / Múltiples Hospitalizaciones', icon: AlertCircle, color: 'text-purple-600', desc: 'Fatalidades o accidentes graves múltiples.' },
    { key: 'publicDamage', label: 'Daños a Público / Vecinos', icon: Users, color: 'text-indigo-600', desc: 'Lesiones a terceros o daños a propiedades colindantes.' },
];

export const SafetyStatsModule: React.FC<Props> = ({ isOpen, onClose, project, onSaveStats }) => {
    // Form State
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [manHours, setManHours] = useState('');
    
    // Detailed State Object
    const [details, setDetails] = useState<EHSDetails>({
        nearMisses: { count: 0, reference: '' },
        firstAid: { count: 0, reference: '' },
        medicalTreatment: { count: 0, reference: '' },
        lostTime: { count: 0, reference: '' },
        envIncidents: { count: 0, reference: '' },
        propertyDamage: { count: 0, reference: '' },
        fatalities: { count: 0, reference: '' },
        publicDamage: { count: 0, reference: '' },
    });

    if (!isOpen) return null;

    const handleDetailChange = (key: keyof EHSDetails, field: 'count' | 'reference', value: string | number) => {
        setDetails(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Calcular Agregados para Dashboards existentes
        const totalAccidents = details.medicalTreatment.count + details.lostTime.count + details.fatalities.count;
        const totalIncidents = details.envIncidents.count + details.publicDamage.count;
        const totalNearMisses = details.nearMisses.count;
        const totalPropDamage = details.propertyDamage.count;

        const newStats: MonthlySafetyStats = {
            id: `stat_${Date.now()}`,
            month,
            manHours: Number(manHours),
            
            // Campos Agregados (Legacy Support)
            accidents: totalAccidents,
            incidents: totalIncidents,
            nearMisses: totalNearMisses,
            propertyDamage: totalPropDamage,
            
            // Detalle Granular
            detailedStats: details,
            
            updatedAt: new Date().toISOString()
        };

        onSaveStats(project.id, newStats);
        
        // Reset inputs visualmente
        setManHours('');
        setDetails({
            nearMisses: { count: 0, reference: '' },
            firstAid: { count: 0, reference: '' },
            medicalTreatment: { count: 0, reference: '' },
            lostTime: { count: 0, reference: '' },
            envIncidents: { count: 0, reference: '' },
            propertyDamage: { count: 0, reference: '' },
            fatalities: { count: 0, reference: '' },
            publicDamage: { count: 0, reference: '' },
        });
        alert("Reporte mensual de estadísticas EHS guardado correctamente.");
        onClose(); // NUEVO: Cerrar modal automáticamente
    };

    // Helper to get previous stats
    const history = project.safetyStats || [];

    // Generador de opciones numéricas 0-50
    const numberOptions = Array.from({ length: 51 }, (_, i) => i);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="text-green-400" size={24} />
                            Reporte Estadístico EHS
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Ingreso mensual de indicadores de desempeño - Contrato: <span className="text-white font-mono">{project.contractNumber}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50">
                    
                    {/* LEFT: INPUT FORM */}
                    <div className="w-full lg:w-[60%] bg-white p-6 border-r border-gray-200 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* 1. SECCIÓN GENERAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Período de Reporte</label>
                                    <input 
                                        type="month" 
                                        required 
                                        value={month} 
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                                        <Clock size={16}/> Horas Hombre (HH) Totales
                                    </label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        placeholder="Ej: 4500"
                                        value={manHours} 
                                        onChange={(e) => setManHours(e.target.value)}
                                        className="w-full border-blue-300 rounded-lg shadow-sm p-2 font-mono text-blue-900 placeholder-blue-300 focus:ring-blue-500 focus:border-blue-500 border bg-white"
                                    />
                                </div>
                            </div>

                            {/* 2. SECCIÓN INCIDENTES DETALLADOS */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <FileText size={16} className="text-gray-500"/> Detalle de Incidentes del Período
                                </h4>
                                
                                <div className="space-y-3">
                                    {/* HEADERS */}
                                    <div className="grid grid-cols-12 gap-4 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <div className="col-span-5 md:col-span-5">Parámetro EHS</div>
                                        <div className="col-span-2 md:col-span-2 text-center">Cantidad</div>
                                        <div className="col-span-5 md:col-span-5">Referencia / Observación</div>
                                    </div>

                                    {STAT_PARAMS.map((param) => (
                                        <div key={param.key} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                            {/* Label & Desc */}
                                            <div className="col-span-5 md:col-span-5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <param.icon size={18} className={param.color} />
                                                    <span className="text-sm font-bold text-gray-700 leading-tight">{param.label}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 pl-6 leading-tight hidden md:block">{param.desc}</p>
                                            </div>

                                            {/* Quantity Dropdown */}
                                            <div className="col-span-2 md:col-span-2">
                                                <select
                                                    value={details[param.key].count}
                                                    onChange={(e) => handleDetailChange(param.key, 'count', Number(e.target.value))}
                                                    className={`w-full text-center font-bold rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1.5 border cursor-pointer ${details[param.key].count > 0 ? 'bg-white text-gray-900 border-blue-300' : 'bg-gray-100 text-gray-400'}`}
                                                >
                                                    {numberOptions.map(num => (
                                                        <option key={num} value={num}>{num}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Reference Input */}
                                            <div className="col-span-5 md:col-span-5 relative">
                                                <input 
                                                    type="text"
                                                    placeholder={details[param.key].count > 0 ? "Ej: INC-001, Caída mismo nivel..." : "Sin incidentes"}
                                                    disabled={details[param.key].count === 0}
                                                    value={details[param.key].reference}
                                                    onChange={(e) => handleDetailChange(param.key, 'reference', e.target.value)}
                                                    className="w-full border-gray-300 rounded-md text-sm p-1.5 pl-2 border focus:ring-blue-500 focus:border-blue-500 disabled:bg-transparent disabled:border-transparent disabled:placeholder-gray-300 transition-all"
                                                />
                                                {details[param.key].count > 0 && !details[param.key].reference && (
                                                    <div title="Ingrese referencia requerida" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 animate-pulse">
                                                        <Info size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-95">
                                <Save size={20}/> Guardar Reporte Mensual
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: HISTORY LIST */}
                    <div className="flex-1 p-6 overflow-y-auto bg-gray-100 border-l border-gray-200">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Historial de Reportes</h4>
                        
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                <Activity size={48} className="mb-2 opacity-50"/>
                                <p>No hay estadísticas registradas.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((stat) => (
                                    <div key={stat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="bg-slate-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                            <span className="font-bold text-slate-800">{stat.month}</span>
                                            <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">HH: {stat.manHours.toLocaleString()}</span>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                            
                                            {/* Si tiene detalle granular, mostrarlo resumido */}
                                            {stat.detailedStats ? (
                                                <>
                                                    {Object.entries(stat.detailedStats).map(([key, val]) => {
                                                        const detail = val as IncidentDetail;
                                                        const p = STAT_PARAMS.find(x => x.key === key);
                                                        if (detail.count === 0) return null;
                                                        return (
                                                            <div key={key} className="col-span-2 flex justify-between items-start border-b border-gray-50 pb-1 last:border-0">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                    {p ? <p.icon size={12} className={p.color}/> : null}
                                                                    <span>{p ? p.label : key}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="font-bold text-gray-900 mx-2">{detail.count}</span>
                                                                    <span className="block text-[10px] text-gray-400 italic max-w-[120px] truncate">{detail.reference}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* Si todo es 0 */}
                                                    {Object.values(stat.detailedStats).every(v => (v as IncidentDetail).count === 0) && (
                                                        <div className="col-span-2 text-center text-xs text-green-600 font-medium py-2 flex items-center justify-center gap-1">
                                                            <CheckCircle2 size={12}/> Sin incidentes reportados
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                /* Fallback legacy stats */
                                                <>
                                                    <div className="flex justify-between"><span className="text-gray-500">Accidentes:</span> <span className="font-bold">{stat.accidents}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Incidentes:</span> <span className="font-bold">{stat.incidents}</span></div>
                                                </>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 px-4 py-2 text-[10px] text-gray-400 text-right">
                                            Actualizado: {new Date(stat.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
