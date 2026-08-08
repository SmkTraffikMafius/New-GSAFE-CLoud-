import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, Eye, Edit3, Trash2, ShieldAlert, Download, Clock, CheckCircle2, AlertCircle, FileText, User, RefreshCw, Send, ArrowRight } from 'lucide-react';
import { ArcoRightType, ArcoRequest, Company, Worker, DocumentSubmission, User as UserType } from '../types';
import { api } from '../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserType | null;
    companies: Company[];
    onRefresh: () => void;
}

export const ArcoPortalModal: React.FC<Props> = ({ isOpen, onClose, currentUser, companies, onRefresh }) => {
    const [selectedTab, setSelectedTab] = useState<ArcoRightType>('ACCESO');
    const [arcoRequests, setArcoRequests] = useState<ArcoRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form states
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
    const [selectedDocId, setSelectedDocId] = useState<string>('');
    const [requestDetails, setRequestDetails] = useState<string>('');

    const [workerToAnonymize, setWorkerToAnonymize] = useState<{ id: string; name: string; companyId?: string } | null>(null);

    // Fetch ARCO requests list
    const fetchRequests = async () => {
        try {
            const list = await api.arco.listRequests(currentUser?.companyId);
            setArcoRequests(list);
        } catch (e) {
            console.error("Error loading ARCO requests", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
            setSuccessMsg(null);
            setRequestDetails('');
            setWorkerToAnonymize(null);
        }
    }, [isOpen, currentUser]);

    if (!isOpen || !currentUser) return null;

    // Get current company or all workers for selection
    const userCompany = currentUser.role === 'CONTRACTOR'
        ? companies.find(c => c.id === currentUser.companyId)
        : companies[0];

    const currentWorkers = currentUser.role === 'ADMIN'
        ? companies.flatMap(c => (c.workers || []).map(w => ({ ...w, companyId: c.id, companyName: c.name })))
        : (userCompany?.workers || []).map(w => ({ ...w, companyId: userCompany?.id, companyName: userCompany?.name }));

    const allCompanyDocs = currentUser.role === 'ADMIN'
        ? companies.flatMap(c => [
            ...(c.documents || []).map(d => ({ ...d, companyId: c.id })),
            ...(c.workers || []).flatMap(w => (w.documents || []).map(d => ({ ...d, companyId: c.id })))
          ])
        : (userCompany ? [
            ...(userCompany.documents || []).map(d => ({ ...d, companyId: userCompany.id })),
            ...(userCompany.workers || []).flatMap(w => (w.documents || []).map(d => ({ ...d, companyId: userCompany.id })))
          ] : []);

    // Helper: calculate 2 business days from now
    const calculateBusinessDays = (days: number): string => {
        let count = 0;
        let date = new Date();
        while (count < days) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip Sat/Sun
                count++;
            }
        }
        return date.toISOString().split('T')[0];
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestDetails.trim() && selectedTab !== 'ACCESO' && selectedTab !== 'PORTABILIDAD') {
            alert("Por favor ingrese el detalle o fundamentación de su solicitud.");
            return;
        }

        setIsLoading(true);
        try {
            let targetEntityName = '';
            if (selectedWorkerId) {
                const w = currentWorkers.find(work => work.id === selectedWorkerId);
                if (w) targetEntityName = `Trabajador: ${w.firstName} ${w.lastName} (${w.rut})`;
            } else if (selectedDocId) {
                const d = allCompanyDocs.find(doc => doc.id === selectedDocId);
                if (d) targetEntityName = `Documento: ${d.fileName}`;
            }

            const effectiveBlockDate = selectedTab === 'BLOQUEO_TEMPORAL' ? calculateBusinessDays(2) : undefined;

            const newReq: Omit<ArcoRequest, 'id'> = {
                userId: currentUser.id,
                userName: currentUser.name,
                userRut: currentUser.email,
                companyId: userCompany?.id || 'GLOBAL',
                companyName: userCompany?.name || 'Compliance Cloud Platform',
                rightType: selectedTab,
                details: requestDetails || `Solicitud del Derecho ARCO+P: ${selectedTab}`,
                targetEntityId: selectedWorkerId || selectedDocId || undefined,
                targetEntityName: targetEntityName || undefined,
                status: 'PENDING',
                requestDate: new Date().toISOString(),
                effectiveBlockDate: effectiveBlockDate
            };

            const created = await api.arco.createRequest(newReq);

            // SPECIAL IMMEDIATE AUTOMATION / DEMO ACTIONS:
            if (selectedTab === 'BLOQUEO_TEMPORAL' && selectedDocId && userCompany) {
                // Execute temporary block in 2 business days or flag document
                await api.arco.blockDocumentTemporarily(userCompany.id, selectedDocId, effectiveBlockDate);
                setSuccessMsg(`Solicitud de Bloqueo Temporal (Art. 8° ter) ingresada con éxito. La visibilidad del documento se suspende según ley (Plazo legal: 2 días hábiles - ${effectiveBlockDate}).`);
            } else if (selectedTab === 'SUPRESION' && selectedWorkerId && userCompany) {
                // Apply anonymization for supresión
                await api.arco.anonymizeWorker(userCompany.id, selectedWorkerId);
                setSuccessMsg(`Solicitud de Supresión ejecutada. Se aplicó ANONIMIZACIÓN de datos personales conforme al Art. 7° de la Ley 21.719, resguardando la integridad de reportes históricos de auditoría.`);
            } else if (selectedTab === 'PORTABILIDAD') {
                // Generate export package
                await api.arco.exportPortabilityPackage(userCompany?.id || '', currentUser.id);
                setSuccessMsg("Paquete interoperable de datos personales exportado exitosamente en formato JSON estructurado (Art. 9° Ley 21.719).");
            } else {
                setSuccessMsg(`Solicitud del derecho de ${selectedTab} recepcionada. Plazo legal de respuesta: 30 días corridos (Art. 11 Ley 21.719).`);
            }

            setRequestDetails('');
            setSelectedWorkerId('');
            setSelectedDocId('');
            await fetchRequests();
            onRefresh();
        } catch (err) {
            console.error("Error submitting ARCO request", err);
            alert("Error al procesar la solicitud.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAnonymize = async () => {
        if (!workerToAnonymize) return;
        setIsLoading(true);
        try {
            const targetCompanyId = workerToAnonymize.companyId || userCompany?.id || companies[0]?.id || '';
            await api.arco.anonymizeWorker(targetCompanyId, workerToAnonymize.id);
            setSuccessMsg(`El trabajador "${workerToAnonymize.name}" fue anonimizado exitosamente. Sus datos PII han sido reemplazados por [ANÓNIMO_SUPRIMIDO] (Art. 7° Ley 21.719).`);
            setWorkerToAnonymize(null);
            await fetchRequests();
            onRefresh();
        } catch (err) {
            console.error("Error in anonymization", err);
            alert("Error al procesar la anonimización.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPersonalDataReport = () => {
        if (userCompany) {
            api.arco.exportPortabilityPackage(userCompany.id, currentUser.id);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full my-6 overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-slate-900 px-6 py-5 flex justify-between items-center text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">Portal de Derechos ARCO+P (Ley 21.719)</h3>
                            <p className="text-xs text-slate-400">Acceso, Rectificación, Supresión, Oposición, Bloqueo Temporal y Portabilidad de Datos Personales</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Sub-header Navigation Tabs */}
                <div className="bg-slate-100 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap gap-2 flex-shrink-0">
                    <button
                        onClick={() => setSelectedTab('ACCESO')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedTab === 'ACCESO' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                        <Eye size={14} /> Acceso (Art. 5°)
                    </button>
                    <button
                        onClick={() => setSelectedTab('RECTIFICACION')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedTab === 'RECTIFICACION' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                        <Edit3 size={14} /> Rectificación (Art. 6°)
                    </button>
                    <button
                        onClick={() => setSelectedTab('SUPRESION')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedTab === 'SUPRESION' ? 'bg-red-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                        <Trash2 size={14} /> Supresión / Anonimización (Art. 7°)
                    </button>
                    <button
                        onClick={() => setSelectedTab('OPOSICION')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedTab === 'OPOSICION' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                        <ShieldAlert size={14} /> Oposición (Art. 8°)
                    </button>
                    <button
                        onClick={() => setSelectedTab('BLOQUEO_TEMPORAL')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedTab === 'BLOQUEO_TEMPORAL' ? 'bg-amber-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                        <Lock size={14} /> Bloqueo Temporal (Art. 8° ter)
                    </button>
                    <button
                        onClick={() => setSelectedTab('PORTABILIDAD')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${selectedTab === 'PORTABILIDAD' ? 'bg-purple-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
                    >
                        <Download size={14} /> Portabilidad (Art. 9°)
                    </button>
                </div>

                {/* Content Container */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    
                    {/* Feedback Alert */}
                    {successMsg && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block mb-1">Confirmación de Acción ARCO+P:</span>
                                <p>{successMsg}</p>
                            </div>
                        </div>
                    )}

                    {/* Tab 1: ACCESO (Art. 5°) */}
                    {selectedTab === 'ACCESO' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-slate-700">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-2">
                                    <Eye size={18} className="text-blue-600 dark:text-blue-400" />
                                    Derecho de Acceso (Art. 5° Ley 21.719)
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    Usted tiene derecho a conocer y obtener confirmación fehaciente sobre todos sus datos personales (PII) y datos sensibles almacenados en la plataforma, las finalidades asociadas y los destinatarios autorizados.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-xs">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2">
                                    <h5 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-1">Resumen de Datos Registrados:</h5>
                                    <p><strong>Usuario Activo:</strong> {currentUser.name}</p>
                                    <p><strong>Correo Corporativo:</strong> {currentUser.email}</p>
                                    <p><strong>Rol en Sistema:</strong> {currentUser.role === 'ADMIN' ? 'Administrador Mandante' : 'Contratista'}</p>
                                    <p><strong>Empresa Vinculada:</strong> {userCompany?.name || 'N/A'}</p>
                                    <p><strong>Total Trabajadores Nómina:</strong> {currentWorkers.length}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col justify-between">
                                    <div>
                                        <h5 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-1 mb-2">Descargar Reporte Completo de Datos:</h5>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Obtenga un archivo descargable con todo el desglose de PII, registros de accesos y estatus documental conforme a ley.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleExportPersonalDataReport}
                                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Download size={16} /> Descargar Informe de Datos Personales
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: RECTIFICACIÓN (Art. 6°) */}
                    {selectedTab === 'RECTIFICACION' && (
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-slate-700">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-1">
                                    <Edit3 size={18} className="text-blue-600 dark:text-blue-400" />
                                    Derecho de Rectificación (Art. 6° Ley 21.719)
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    Solicite modificar, actualizar o completar datos personales o de trabajadores de la nómina que se encuentren inexactos o incompletos.
                                </p>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Seleccionar Trabajador u Objeto (Opcional):</label>
                                    <select
                                        value={selectedWorkerId}
                                        onChange={e => setSelectedWorkerId(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="">-- Toda la nómina / Mis datos propios --</option>
                                        {currentWorkers.map(w => (
                                            <option key={w.id} value={w.id}>{w.firstName} {w.lastName} (RUT: {w.rut})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Detalle de las correcciones requeridas:</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Escriba los datos exactos que deben corregirse (ej. Corrección de RUT, apellido o fecha)..."
                                        value={requestDetails}
                                        onChange={e => setRequestDetails(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-colors"
                                >
                                    <Send size={16} /> Enviar Solicitud de Rectificación
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tab 3: SUPRESIÓN / ANONIMIZACIÓN (Art. 7°) */}
                    {selectedTab === 'SUPRESION' && (
                        <div className="space-y-4">
                            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
                                <h4 className="font-bold text-red-900 dark:text-red-200 text-sm flex items-center gap-2 mb-1">
                                    <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                    Derecho de Supresión y Anonimización (Art. 7° Ley 21.719)
                                </h4>
                                <p className="text-xs text-red-800 dark:text-red-300">
                                    Conforme a la ley, la supresión de datos personales en plataformas de auditoría de cumplimiento se efectúa mediante <strong>Anonimización Irreversible</strong>. Los datos personales identificables (RUT, nombres, fotos) se destruyen, manteniendo los registros históricos anonimizados para cumplir con las obligaciones legales de auditoría EHS sin conservar PII.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                                <h5 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400">Trabajadores en Nómina para Anonimizar:</h5>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {currentWorkers.map(w => (
                                        <div key={w.id} className="p-3 bg-gray-50 dark:bg-slate-800/80 rounded-lg flex items-center justify-between border border-gray-200 dark:border-slate-700 text-xs">
                                            <div>
                                                <span className="font-bold block text-gray-900 dark:text-white">
                                                    {w.isAnonymized ? '[TRABAJADOR ANÓNIMO SUPRIMIDO]' : `${w.firstName} ${w.lastName}`}
                                                </span>
                                                <span className="text-gray-500 font-mono">
                                                    RUT: {w.rut} | Role: {w.role}
                                                </span>
                                            </div>
                                            {w.isAnonymized ? (
                                                <span className="bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                                    <Lock size={10} /> ANONIMIZADO
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setWorkerToAnonymize({ id: w.id, name: `${w.firstName} ${w.lastName}`, companyId: w.companyId })}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                                                >
                                                    <Trash2 size={12} /> Anonimizar (Art. 7°)
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: OPOSICIÓN (Art. 8°) */}
                    {selectedTab === 'OPOSICION' && (
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-slate-700">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-1">
                                    <ShieldAlert size={18} className="text-blue-600 dark:text-blue-400" />
                                    Derecho de Oposición (Art. 8° Ley 21.719)
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    Usted puede oponerse a que sus datos personales sean tratados para finalidades específicas que no correspondan a obligaciones estrictamente legales o contractuales.
                                </p>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Motivo de la Oposición:</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Fundamente las razones de su oposición a un tratamiento determinado..."
                                        value={requestDetails}
                                        onChange={e => setRequestDetails(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-colors"
                                >
                                    <Send size={16} /> Enviar Oposición
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tab 5: BLOQUEO TEMPORAL (Art. 8° ter) */}
                    {selectedTab === 'BLOQUEO_TEMPORAL' && (
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2 mb-1">
                                    <Lock size={18} className="text-amber-600 dark:text-amber-400" />
                                    Derecho de Bloqueo Temporal (Art. 8° ter Ley 21.719)
                                </h4>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    Solicite la suspensión temporal de la visibilidad de un documento específico mientras se resuelve una impugnación o rectificación. Por exigencia legal del Art. 8° ter y Art. 11, la suspensión se hace efectiva a más tardar a los <strong>2 días hábiles</strong> de la solicitud.
                                </p>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Seleccionar Documento para Bloquear Visibilidad:</label>
                                    <select
                                        value={selectedDocId}
                                        onChange={e => setSelectedDocId(e.target.value)}
                                        required
                                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="">-- Seleccione un documento --</option>
                                        {allCompanyDocs.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.fileName} {d.isTemporarilyBlocked ? '(BLOQUEADO)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Fundamento de la Solicitud de Bloqueo:</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Explicación del motivo del bloqueo temporal (ej. Documento en proceso de rectificación o renovación)..."
                                        value={requestDetails}
                                        onChange={e => setRequestDetails(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-colors"
                                >
                                    <Lock size={16} /> Solicitar Bloqueo Temporal (2 Días Hábiles)
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tab 6: PORTABILIDAD (Art. 9°) */}
                    {selectedTab === 'PORTABILIDAD' && (
                        <div className="space-y-4">
                            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50">
                                <h4 className="font-bold text-purple-900 dark:text-purple-200 text-sm flex items-center gap-2 mb-1">
                                    <Download size={18} className="text-purple-600 dark:text-purple-400" />
                                    Derecho a la Portabilidad de Datos (Art. 9° Ley 21.719)
                                </h4>
                                <p className="text-xs text-purple-800 dark:text-purple-300">
                                    Obtenga una copia íntegra de sus datos personales en un formato electrónico estructurado, genérico e interoperable (JSON / CSV), para ser transmitido a otro responsable o sistema.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 text-center space-y-4">
                                <FileText size={48} className="text-purple-500 mx-auto" />
                                <h5 className="font-bold text-gray-900 dark:text-white text-base">Exportación Interoperable de Ficha Personal</h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                    Genera una descarga de la estructura de datos en formato JSON nativo estandarizado conforme al estándar de la Agencia de Protección de Datos Personales.
                                </p>
                                <button
                                    onClick={handleExportPersonalDataReport}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl inline-flex items-center gap-2 shadow-lg transition-colors"
                                >
                                    <Download size={18} /> Exportar Paquete de Portabilidad (JSON)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* HISTORIAL DE SOLICITUDES ARCO+P */}
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-6 space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={14} /> Historial de Solicitudes ARCO+P Registradas (Art. 11)
                        </h4>

                        {arcoRequests.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No registra solicitudes ARCO+P anteriores.</p>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-gray-500">
                                        <tr>
                                            <th className="p-3">ID / Fecha</th>
                                            <th className="p-3">Derecho ARCO+P</th>
                                            <th className="p-3">Objetivo / Detalle</th>
                                            <th className="p-3">Plazo Legal</th>
                                            <th className="p-3 text-right">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-300">
                                        {arcoRequests.map(r => (
                                            <tr key={r.id}>
                                                <td className="p-3">
                                                    <span className="font-mono font-bold block">{r.id}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(r.requestDate).toLocaleDateString()}</span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="bg-slate-100 dark:bg-slate-800 font-bold px-2 py-1 rounded text-[10px] border border-slate-200 dark:border-slate-700">
                                                        {r.rightType}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="font-medium block">{r.targetEntityName || 'Compliance Cloud General'}</span>
                                                    <span className="text-[11px] text-gray-500 line-clamp-1">{r.details}</span>
                                                </td>
                                                <td className="p-3">
                                                    {r.effectiveBlockDate ? (
                                                        <span className="text-amber-600 font-bold flex items-center gap-1">
                                                            <Clock size={12} /> 2 Días Hábiles ({r.effectiveBlockDate})
                                                        </span>
                                                    ) : (
                                                        <span>30 Días Corridos</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {r.status === 'APPROVED' ? 'RESUELTO' : r.status === 'PENDING' ? 'PENDIENTE' : 'EN TRAMITACIÓN'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-slate-900/80 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Lock size={12} /> Ley N° 21.719 - Garantía Constitucional de Protección de Datos
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl transition-colors"
                    >
                        Cerrar Portal
                    </button>
                </div>

            </div>

            {/* CONFIRMATION DIALOG OVERLAY (Replaces window.confirm for iframe compatibility) */}
            {workerToAnonymize && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-200 dark:border-red-900/50 space-y-4">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <div className="p-3 bg-red-100 dark:bg-red-950 rounded-xl">
                                <Trash2 size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-gray-900 dark:text-white">
                                    Confirmar Supresión / Anonimización
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Art. 7° Ley N° 21.719</p>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-950/40 p-3.5 rounded-xl border border-red-200 dark:border-red-900/40 text-xs text-red-900 dark:text-red-200 space-y-2">
                            <p>
                                ¿Confirma anonimizar irreversiblemente los datos de <strong>"{workerToAnonymize.name}"</strong>?
                            </p>
                            <p className="text-[11px] text-red-700 dark:text-red-300">
                                Se eliminarán su RUT, nombres y fotos de perfil. Se conservará únicamente el registro anonimizado para auditar el cumplimiento legal EHS sin conservar datos PII.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setWorkerToAnonymize(null)}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmAnonymize}
                                disabled={isLoading}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors"
                            >
                                {isLoading ? (
                                    <span>Procesando...</span>
                                ) : (
                                    <>
                                        <Trash2 size={14} /> Sí, Anonimizar Irreversiblemente
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
