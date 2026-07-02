import React, { useState, useRef, useEffect } from 'react';
import { AppNotification } from '../types';
import { Bell, CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Props {
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
}

export const NotificationCenter: React.FC<Props> = ({ notifications, onMarkAsRead, onClearAll }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle2 size={18} className="text-green-500" />;
            case 'ERROR': return <XCircle size={18} className="text-red-500" />;
            case 'WARNING': return <AlertTriangle size={18} className="text-yellow-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'SUCCESS': return 'bg-green-50 border-l-4 border-green-500';
            case 'ERROR': return 'bg-red-50 border-l-4 border-red-500';
            case 'WARNING': return 'bg-yellow-50 border-l-4 border-yellow-500';
            default: return 'bg-blue-50 border-l-4 border-blue-500';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-800 transition-colors text-gray-300 hover:text-white"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full border-2 border-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="bg-slate-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-700">Notificaciones</h3>
                        {notifications.length > 0 && (
                            <button 
                                onClick={onClearAll}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Marcar todo leído
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                                <Bell size={32} className="text-gray-300 mb-2" />
                                <p>No tienes notificaciones nuevas</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map((notif) => (
                                    <li 
                                        key={notif.id} 
                                        className={`p-4 hover:bg-gray-50 transition-colors relative ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => onMarkAsRead(notif.id)}
                                    >
                                        {!notif.isRead && (
                                            <span className="absolute top-4 right-4 h-2 w-2 bg-blue-500 rounded-full"></span>
                                        )}
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                                                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-2 text-right">
                                                    {new Date(notif.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};