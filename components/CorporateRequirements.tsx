
import React, { useRef } from 'react';
import { CorporateRequirement, RequirementStatus } from '../types';
import { CheckCircle2, Circle, FileText, Upload, Clock, AlertCircle, Paperclip } from 'lucide-react';

interface Props {
    requirements: CorporateRequirement[];
    onUpdate: (reqId: string, updates: { status?: RequirementStatus, isChecked?: boolean, evidenceFile?: File }) => void;
}

interface RowProps {
    req: CorporateRequirement;
    onUpdate: (reqId: string, updates: { status?: RequirementStatus, isChecked?: boolean, evidenceFile?: File }) => void;
}

const RequirementRow: React.FC<RowProps> = ({ req, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUpdate(req.id, { evidenceFile: e.target.files[0] });
        }
    };

    const getStatusColor = (status: RequirementStatus) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-200';
            case 'VALIDATED': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-4">
                <button 
                    onClick={() => onUpdate(req.id, { isChecked: !req.isChecked })}
                    className={`mt-1 flex-shrink-0 transition-colors ${req.isChecked ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    {req.isChecked ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div>
                    <h4 className={`font-medium text-sm ${req.isChecked ? 'text-gray-900' : 'text-gray-700'}`}>{req.name}</h4>
                    {req.evidenceName && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                            <Paperclip size={12} />
                            <span className="truncate max-w-[200px]">{req.evidenceName}</span>
                            <span className="text-gray-400 ml-1">• {new Date(req.updatedAt || '').toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Status Selector */}
                <select
                    value={req.status}
                    onChange={(e) => onUpdate(req.id, { status: e.target.value as RequirementStatus })}
                    className={`text-xs font-bold px-2 py-1 rounded border cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none ${getStatusColor(req.status)}`}
                >
                    <option value="PENDING">Pendiente</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="VALIDATED" disabled>Validado (Admin)</option>
                </select>

                {/* Upload Button */}
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.png"
                    />
                    <button 
                        onClick={handleFileClick}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Subir Evidencia"
                    >
                        <Upload size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CorporateRequirements: React.FC<Props> = ({ requirements, onUpdate }) => {
    // Group by category
    const programs = requirements.filter(r => r.category === 'PROGRAM');
    const controls = requirements.filter(r => r.category === 'CONTROL');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Intro */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                <div>
                    <h3 className="text-sm font-bold text-blue-800">Requerimientos de Cumplimiento Corporativo</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Gestione los programas y controles obligatorios definidos en los estándares de la empresa.
                        Suba la evidencia correspondiente para validar el cumplimiento.
                    </p>
                </div>
            </div>

            {/* Programs Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="text-indigo-500" size={20} />
                    Desarrollo de Programas
                </h3>
                <div className="space-y-3">
                    {programs.map(req => <RequirementRow key={req.id} req={req} onUpdate={onUpdate} />)}
                    {programs.length === 0 && <p className="text-sm text-gray-400 italic">No hay programas asignados.</p>}
                </div>
            </div>

            {/* Controls Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="text-orange-500" size={20} />
                    Controles y Documentación
                </h3>
                <div className="space-y-3">
                    {controls.map(req => <RequirementRow key={req.id} req={req} onUpdate={onUpdate} />)}
                    {controls.length === 0 && <p className="text-sm text-gray-400 italic">No hay controles asignados.</p>}
                </div>
            </div>
        </div>
    );
};
