
import React, { useState } from 'react';
import { DocumentSubmission, DocStatus } from '../types';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Props {
    documents: DocumentSubmission[];
    title: string;
}

export const ComplianceCalendar: React.FC<Props> = ({ documents, title }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getDocsForDay = (day: number) => {
        return documents.filter(doc => {
            if (!doc.expiryDate) return false;
            // Parse expiry date. Assuming YYYY-MM-DD format from inputs
            // Note: Date parsing can be tricky with timezones. Using simple string split is safer for YYYY-MM-DD
            const [y, m, d] = doc.expiryDate.split('-').map(Number);
            return y === currentDate.getFullYear() && m === (currentDate.getMonth() + 1) && d === day;
        });
    };

    const renderCells = () => {
        const cells = [];
        // Empty cells for days before start of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const docs = getDocsForDay(d);
            const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            
            cells.push(
                <div key={d} className={`h-24 border border-gray-100 p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}>
                    <span className={`text-xs font-bold ${isToday ? 'text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full' : 'text-gray-400'}`}>{d}</span>
                    
                    <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                        {docs.map((doc, idx) => (
                            <div key={`${doc.id}-${idx}`} className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 truncate" title={`${doc.fileName} - Vence hoy`}>
                                Vence: {doc.fileName.substring(0, 10)}...
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return cells;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Clock size={18} className="text-blue-500"/> {title}
                </h3>
                <div className="flex items-center gap-4">
                    <button onClick={prevMonth} className="p-1 hover:bg-white rounded hover:shadow-sm"><ChevronLeft size={20}/></button>
                    <span className="text-sm font-bold text-gray-800 w-32 text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    <button onClick={nextMonth} className="p-1 hover:bg-white rounded hover:shadow-sm"><ChevronRight size={20}/></button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 py-2 border-b border-gray-200 bg-white">
                <div>DOM</div><div>LUN</div><div>MAR</div><div>MIE</div><div>JUE</div><div>VIE</div><div>SAB</div>
            </div>
            <div className="grid grid-cols-7 bg-gray-200 gap-px border-l border-t border-gray-200">
                {renderCells()}
            </div>
            <div className="p-2 bg-gray-50 text-[10px] text-gray-400 text-right">
                * Se muestran documentos con fecha de vencimiento registrada.
            </div>
        </div>
    );
};
