
import React from 'react';
import { DocStatus, VerificationSource } from '../types';
import { CheckCircle2, XCircle, Clock, AlertCircle, ShieldCheck, Building, UserCheck, Car } from 'lucide-react';

interface Props {
    status: DocStatus;
    showLabel?: boolean;
    source?: VerificationSource;
}

export const StatusBadge: React.FC<Props> = ({ status, showLabel = true, source }) => {
    
    // Si está aprobado, miramos la fuente de validación
    if (status === DocStatus.APPROVED) {
        let SourceIcon = ShieldCheck;
        let sourceLabel = "Validado";
        let colorClass = "bg-green-100 text-green-800 border-green-200";

        if (source === VerificationSource.DT_GOB) {
            SourceIcon = Building;
            sourceLabel = "Validado en DT";
            colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        } else if (source === VerificationSource.REGISTRO_CIVIL) {
            SourceIcon = UserCheck;
            sourceLabel = "Validado en RC";
            colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
        } else if (source === VerificationSource.PRT_CL) {
            SourceIcon = Car;
            sourceLabel = "Validado PRT";
            colorClass = "bg-orange-100 text-orange-800 border-orange-200";
        } else if (source === VerificationSource.AI_ONLY) {
            SourceIcon = CheckCircle2;
            sourceLabel = "Validado IA";
        }

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                <SourceIcon size={14} />
                {showLabel && sourceLabel}
            </span>
        );
    }

    switch (status) {
        case DocStatus.REJECTED:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    <XCircle size={14} />
                    {showLabel && "Rechazado"}
                </span>
            );
        case DocStatus.IN_REVIEW:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Clock size={14} />
                    {showLabel && "En Revisión"}
                </span>
            );
        case DocStatus.PENDING:
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    <AlertCircle size={14} />
                    {showLabel && "Pendiente"}
                </span>
            );
    }
};
