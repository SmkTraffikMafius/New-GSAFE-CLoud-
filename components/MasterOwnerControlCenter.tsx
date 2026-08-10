import React, { useState, useEffect } from 'react';
import { AuthorizationKey, Company, User, CradleToGraveStatus } from '../types';
import { api } from '../services/api';
import { 
    Key, ShieldCheck, Cpu, Database, Plus, Trash2, Power, Copy, Check, 
    Building2, Network, GitMerge, FileText, ArrowRight, Activity, Eye, Layers, Lock, Sparkles, CheckCircle2, RefreshCw
} from 'lucide-react';

interface Props {
    companies: Company[];
    currentUser: User;
    onRefreshCompanies: () => void;
}

export const MasterOwnerControlCenter: React.FC<Props> = ({ companies, currentUser, onRefreshCompanies }) => {
    const [authKeys, setAuthKeys] = useState<AuthorizationKey[]>([]);
    const [loadingKeys, setLoadingKeys] = useState(true);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

    // Form modal state
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyScope, setNewKeyScope] = useState<AuthorizationKey['scope']>('ALL_MODULES');

    // Hierarchy filter
    const [selectedContractorId, setSelectedContractorId] = useState<string>('ALL');

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = async () => {
        setLoadingKeys(true);
        try {
            const keys = await api.master.getAuthorizationKeys();
            setAuthKeys(keys);
        } catch (err) {
            console.error("Error loading keys:", err);
        } finally {
            setLoadingKeys(false);
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName) return;
        await api.master.createAuthorizationKey(newKeyName, newKeyScope);
        setNewKeyName('');
        setShowKeyModal(false);
        loadKeys();
    };

    const handleToggleKey = async (id: string) => {
        const updated = await api.master.toggleAuthorizationKey(id);
        setAuthKeys(updated);
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm("¿Está seguro de revocar y eliminar esta llave de autorización maestra?")) return;
        const updated = await api.master.deleteAuthorizationKey(id);
        setAuthKeys(updated);
    };

    const handleCopyKey = (id: string, secret: string) => {
        navigator.clipboard.writeText(secret);
        setCopiedKeyId(id);
        setTimeout(() => setCopiedKeyId(null), 2000);
    };

    const mainContractors = companies.filter(c => !c.parentCompanyId || c.companyType === 'CONTRACTOR');
    
    const getSubcontractorsOf = (contractorId: string) => {
        return companies.filter(c => c.parentCompanyId === contractorId || c.companyType === 'SUBCONTRACTOR');
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-12">
            
            {/* Header Propietario Master */}
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                <Key size={14} className="text-amber-400" /> Propietario Master & Arquitectura
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                Estado: TLS 1.3 Cifrado Activo
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Panel del Administrador Principal
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                            Como Propietario Master de la plataforma, usted posee las <strong>llaves de autorización principales</strong> para modificar la estructura del sistema, autorizar Mandantes, Contratistas Directos y Subcontratistas en la matriz de <strong>Ciclo de Vida Completo (Cuna a la Tumba)</strong>.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                        <div className="text-center px-3 border-r border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Empresas</span>
                            <span className="text-xl font-extrabold text-white">{companies.length}</span>
                        </div>
                        <div className="text-center px-3 border-r border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Llaves Activas</span>
                            <span className="text-xl font-extrabold text-amber-400">{authKeys.filter(k => k.isActive).length}</span>
                        </div>
                        <div className="text-center px-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estructura</span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                Jerarquía 3-Capas
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: GESTIÓN DE LLAVES DE AUTORIZACIÓN MAESTRAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Key size={20} className="text-amber-400" />
                            Llaves y Credenciales de Autorización Maestra
                        </h2>
                        <p className="text-xs text-slate-400">
                            Gestión de tokens criptográficos y claves secretas para acceso a API, Integración Garita QR y modificación estructural.
                        </p>
                    </div>
                    
                    <button
                        onClick={() => setShowKeyModal(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} /> Generar Nueva Llave Maestra
                    </button>
                </div>

                {loadingKeys ? (
                    <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin" /> Cargando llaves de autorización...
                    </div>
                ) : authKeys.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                        No hay llaves de autorización configuradas. Genera una nueva llave con el botón superior.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {authKeys.map(key => (
                            <div 
                                key={key.id}
                                className={`p-4 rounded-2xl border transition-all ${
                                    key.isActive 
                                        ? 'bg-slate-950 border-slate-800 hover:border-amber-500/40' 
                                        : 'bg-slate-950/50 border-red-900/30 opacity-60'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                                        key.scope === 'MASTER_STRUCTURE' 
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                            : key.scope === 'EHS_GATE_ONLY'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    }`}>
                                        {key.scope}
                                    </span>
                                    
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleToggleKey(key.id)}
                                            title={key.isActive ? "Desactivar llave" : "Activar llave"}
                                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                                key.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                            }`}
                                        >
                                            <Power size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteKey(key.id)}
                                            title="Eliminar llave"
                                            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-xs text-white mb-1">
                                    {key.keyName}
                                </h3>

                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-3 flex items-center justify-between font-mono text-[11px] text-slate-300">
                                    <span className="truncate max-w-[180px]">{key.secretKey}</span>
                                    <button 
                                        onClick={() => handleCopyKey(key.id, key.secretKey)}
                                        className="text-amber-400 hover:text-amber-300 p-1 transition-colors cursor-pointer"
                                        title="Copiar Llave"
                                    >
                                        {copiedKeyId === key.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    </button>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-400 flex items-center justify-between">
                                    <span>Creada: {new Date(key.createdAt).toLocaleDateString()}</span>
                                    <span className={key.isActive ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                        {key.isActive ? "● ACTIVA" : "○ REVOCADA"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: ESTRUCTURA CUNA A LA TUMBA & ÁRBOL DE JERARQUÍA (MANDANTE -> CONTRATISTA -> SUBCONTRATISTA) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="mb-6 pb-4 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Network size={20} className="text-blue-400" />
                                Estructura Jerárquica & Ciclo de Vida "Cuna a la Tumba"
                            </h2>
                            <p className="text-xs text-slate-400">
                                Visualización en árbol del encadenamiento: Mandante &rarr; Contratista Principal &rarr; Empresas Subcontratistas.
                            </p>
                        </div>
                        <span className="text-xs font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                            Trazabilidad Ley 20.123
                        </span>
                    </div>
                </div>

                {/* Diagrama explicativo Cuna a la Tumba */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 mb-6">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 block mb-2">
                        ETAPAS DEL CICLO DE VIDA DE EMPRESAS Y SUBCONTRATOS (CRADLE-TO-GRAVE):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <span className="font-bold text-blue-400 block text-[11px]">1. Onboarding</span>
                            <span className="text-[10px] text-slate-400">Alta y F30-1</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <span className="font-bold text-amber-400 block text-[11px]">2. Matriz EHS</span>
                            <span className="text-[10px] text-slate-400">MIPER & Trabajos Críticos</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <span className="font-bold text-purple-400 block text-[11px]">3. Acreditación IA</span>
                            <span className="text-[10px] text-slate-400">Auditoría Personal/Equipos</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <span className="font-bold text-emerald-400 block text-[11px]">4. Cierre & Ley 21.719</span>
                            <span className="text-[10px] text-slate-400">Finiquito & Anonimización</span>
                        </div>
                    </div>
                </div>

                {/* Arbol de Empresas */}
                <div className="space-y-4">
                    {mainContractors.map(contractor => {
                        const subs = getSubcontractorsOf(contractor.id);
                        return (
                            <div key={contractor.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                                
                                {/* Nivel 1: Contratista Principal */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-blue-600/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400 font-black">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                                                    Contratista Principal
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">{contractor.rut}</span>
                                            </div>
                                            <h3 className="font-extrabold text-base text-white mt-0.5">{contractor.name}</h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                                            contractor.accessAuthorized 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {contractor.accessAuthorized ? 'ACCESO AUTORIZADO' : 'RESTRINGIDO'}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                            {subs.length} Subcontratistas
                                        </span>
                                    </div>
                                </div>

                                {/* Nivel 2: Subcontratistas vinculados */}
                                <div className="mt-4 pl-4 sm:pl-8 border-l-2 border-dashed border-blue-500/30 space-y-3">
                                    {subs.length === 0 ? (
                                        <div className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-xl border border-slate-800/40">
                                            No hay subcontratistas registrados directamente bajo esta empresa.
                                        </div>
                                    ) : (
                                        subs.map(sub => (
                                            <div key={sub.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <GitMerge size={18} className="text-amber-400 shrink-0" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                                                                Subcontratista
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-mono">{sub.rut}</span>
                                                        </div>
                                                        <h4 className="font-bold text-sm text-slate-200 mt-0.5">{sub.name}</h4>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs font-mono">
                                                    <span className="text-slate-400">
                                                        Trabajadores: <strong className="text-slate-200">{sub.workers.length}</strong>
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        sub.accessAuthorized 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                        {sub.accessAuthorized ? 'HABILITADO' : 'EN ACREDITACIÓN'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL CREAR NUEVA LLAVE MAESTRA */}
            {showKeyModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-base text-white flex items-center gap-2">
                                <Key className="text-amber-400" size={18} />
                                Generar Nueva Llave Maestra
                            </h3>
                            <button 
                                onClick={() => setShowKeyModal(false)}
                                className="text-slate-400 hover:text-white text-xs font-bold p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Nombre o Propósito de la Llave:</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ej: Llave de Integración ERP Mining / Garita Norte"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-medium mb-1">Ámbito de Autorización (Scope):</label>
                                <select 
                                    value={newKeyScope}
                                    onChange={(e) => setNewKeyScope(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                                >
                                    <option value="ALL_MODULES">Todos los Módulos (Acceso Completo)</option>
                                    <option value="MASTER_STRUCTURE">Modificación Estructural & Propietario</option>
                                    <option value="EHS_AUDIT_ONLY">Solo Auditoría EHS y Documental</option>
                                    <option value="DT_VERIFICATION">Solo Verificación Externa DT F30-1</option>
                                </select>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowKeyModal(false)}
                                    className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
                                >
                                    Generar Llave
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
