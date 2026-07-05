
import React, { useState, useEffect } from 'react';
import { DocStatus, DocumentSubmission, VerificationSource, AiVerdict } from '../types';
import { X, Save, FileText, CheckCircle2, XCircle, AlertCircle, Calendar, Bot, Eye, ShieldCheck, Search, Database, UserCheck, History, Edit3, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { api } from '../services/api';

// Configurar el worker de PDF.js usando CDN para evitar problemas de build en producción
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    doc: DocumentSubmission | undefined;
    reqName: string;
    onSave: (docId: string, status: DocStatus, comment: string, expiryDate?: string, startDate?: string) => void;
    readOnly?: boolean; // Nueva prop para modo visualización
}

export const ReviewModal: React.FC<Props> = ({ isOpen, onClose, doc, reqName, onSave, readOnly = false }) => {
    const [status, setStatus] = useState<DocStatus>(DocStatus.PENDING);
    const [comment, setComment] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [resolvedFileUrl, setResolvedFileUrl] = useState('');

    useEffect(() => {
        if (doc) {
            setStatus(doc.status);
            setComment(doc.reviewerComment || '');
            setExpiryDate(doc.expiryDate || '');
            setStartDate(doc.startDate || '');
            setPageNumber(1); // Reset page number on new doc
            
            const fetchFile = async () => {
                try {
                    const stored = await api.db.getFile(doc.id);
                    if (stored) {
                        setResolvedFileUrl(stored);
                    } else {
                        setResolvedFileUrl(doc.fileUrl || '');
                    }
                } catch (err) {
                    console.error("Failed to load file from IndexedDB", err);
                    setResolvedFileUrl(doc.fileUrl || '');
                }
            };
            fetchFile();
        }
    }, [doc, isOpen]);

    if (!isOpen || !doc) return null;

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const previousPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const nextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));

    const handleSave = () => {
        onSave(doc.id, status, comment, expiryDate, startDate);
        onClose();
    };

    // Helper para determinar el color del estado IA
    const getAiStatusColor = () => {
        if (doc.status === DocStatus.APPROVED) return 'bg-green-50 border-green-200 text-green-700';
        if (doc.status === DocStatus.REJECTED) return 'bg-red-50 border-red-200 text-red-700';
        return 'bg-blue-50 border-blue-200 text-blue-700';
    };

    const isImage = doc.fileName.match(/\.(jpeg|jpg|png)$/i);
    const isPdf = doc.fileName.match(/\.pdf$/i);
    const hasPreview = resolvedFileUrl && resolvedFileUrl !== '#';

    // Helper to visualize AI Verdict
    const renderAiVerdictBadge = (verdict?: AiVerdict) => {
        if (!verdict) return null;
        switch (verdict) {
            case 'APPROVAL':
                return <span className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200"><Bot size={12}/> IA: APRUEBA</span>;
            case 'VALIDATION':
                return <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold border border-blue-200"><Bot size={12}/> IA: VALIDA CONTENIDO</span>;
            case 'REVIEW':
                return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold border border-yellow-200"><Bot size={12}/> IA: SUGIERE REVISIÓN</span>;
            case 'REJECTION':
                return <span className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold border border-red-200"><Bot size={12}/> IA: RECHAZA</span>;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                
                {/* HEADER */}
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {readOnly ? <FileText className="text-blue-400" size={24}/> : <Edit3 className="text-yellow-400" size={24} />}
                            {readOnly ? 'Visor de Documento' : 'Control y Edición Mandante'}
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {readOnly ? 'Modo Solo Lectura - Auditoría' : 'Revisión y Corrección de Análisis IA'}: {doc.fileName}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </div>

                {/* MAIN CONTENT (SPLIT SCREEN) */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    
                    {/* LEFT PANEL: DOCUMENT VIEWER */}
                    <div className="flex-1 bg-slate-100 p-4 border-r border-gray-200 flex flex-col relative overflow-hidden">
                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-gray-200 flex items-center gap-2">
                            <Eye size={14} className="text-gray-500"/> Vista Previa
                        </div>
                        {hasPreview && (
                            <div className="absolute top-4 right-4 z-10">
                                <a 
                                    href={resolvedFileUrl} 
                                    download={doc.fileName}
                                    className="bg-white/90 hover:bg-white backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-gray-200 flex items-center gap-2 text-blue-600 transition-colors"
                                >
                                    <Download size={14} /> Descargar
                                </a>
                            </div>
                        )}
                        
                        <div className="flex-1 bg-white border border-gray-300 rounded-lg shadow-inner flex items-center justify-center overflow-auto mt-8">
                            {hasPreview ? (
                                isImage ? (
                                    <img src={resolvedFileUrl} alt="Preview" className="max-w-full max-h-full object-contain p-4" />
                                ) : isPdf ? (
                                    <div className="w-full h-full overflow-auto bg-gray-200 flex flex-col items-center py-4 relative group">
                                        <Document
                                            file={resolvedFileUrl}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            loading={
                                                <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                                    <p className="text-gray-600">Cargando PDF...</p>
                                                </div>
                                            }
                                            error={
                                                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                                                    <AlertCircle size={48} className="text-red-400 mb-4" />
                                                    <p className="text-gray-600 mb-4">Error al cargar el PDF.</p>
                                                    <a 
                                                        href={resolvedFileUrl} 
                                                        download={doc.fileName}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                                                    >
                                                        <Download size={16} /> Descargar Documento
                                                    </a>
                                                </div>
                                            }
                                        >
                                            <Page 
                                                pageNumber={pageNumber} 
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                width={Math.min(window.innerWidth * 0.45, 600)}
                                                className="shadow-xl bg-white"
                                            />
                                        </Document>
                                        
                                        {numPages && numPages > 1 && (
                                            <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 md:absolute md:bottom-4 md:left-auto md:right-4 md:transform-none z-20 flex items-center gap-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-200 transition-opacity opacity-0 group-hover:opacity-100">
                                                <button 
                                                    onClick={previousPage} 
                                                    disabled={pageNumber <= 1}
                                                    className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronLeft size={20} className="text-gray-700" />
                                                </button>
                                                <span className="text-sm font-medium text-gray-700">
                                                    Página {pageNumber} de {numPages}
                                                </span>
                                                <button 
                                                    onClick={nextPage} 
                                                    disabled={pageNumber >= numPages}
                                                    className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ChevronRight size={20} className="text-gray-700" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                                        <FileText size={48} className="text-gray-400 mb-4" />
                                        <p className="text-gray-600 mb-4">El formato del archivo no permite previsualización.</p>
                                        <a 
                                            href={resolvedFileUrl} 
                                            download={doc.fileName}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            <Download size={16} /> Descargar Archivo
                                        </a>
                                    </div>
                                )
                            ) : (
                                <div className="text-center p-8">
                                    <FileText size={64} className="text-gray-300 mx-auto mb-4" />
                                    <h4 className="text-gray-500 font-medium">Vista previa no disponible</h4>
                                    <p className="text-gray-400 text-sm mt-1">El archivo es un dato de ejemplo (mock) o no se puede renderizar.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: DETAILS & ANALYSIS */}
                    <div className="w-full lg:w-[450px] bg-white flex flex-col overflow-y-auto">
                        
                        {/* 1. STATUS REPORT (Visible in both modes) */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Search size={14}/> Dictamen Inteligente
                                </h4>
                                {renderAiVerdictBadge(doc.aiVerdict)}
                            </div>

                            <div className={`p-4 rounded-lg border mb-4 ${getAiStatusColor()}`}>
                                <div className="flex items-start gap-3">
                                    {doc.status === DocStatus.APPROVED ? <ShieldCheck size={24} /> : doc.status === DocStatus.REJECTED ? <XCircle size={24} /> : <AlertCircle size={24} />}
                                    <div>
                                        <p className="font-bold text-sm">
                                            {doc.status === DocStatus.APPROVED ? 'APROBADO' : doc.status === DocStatus.REJECTED ? 'RECHAZADO' : 'PENDIENTE / EN REVISIÓN'}
                                        </p>
                                        <p className="text-xs mt-1 opacity-90">
                                            {doc.reviewerComment || 'Sin observaciones registradas.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Source Badge */}
                            {doc.verificationSource && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-gray-500 font-medium">Fuente de Validación:</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono font-bold
                                            ${doc.verificationSource === 'SRCEI' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                              doc.verificationSource === 'DT_GOB' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                              doc.verificationSource === 'PREVIRED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                              doc.verificationSource === 'ACHS' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                              doc.verificationSource === 'AI_ONLY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                              'bg-slate-100 text-slate-700 border-slate-200'}
                                        `}>
                                            <Database size={12}/> {doc.verificationSource.replace('_', ' ')}
                                        </span>
                                    </div>
                                    
                                    {/* Description of verification method */}
                                    <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 space-y-1">
                                        {doc.verificationSource === 'AI_ONLY' && (
                                            <p><strong>Análisis IA:</strong> Validación basada en algoritmos de visión artificial y NLP (Natural Language Processing). Se verificaron parámetros de nombre, RUT, empresa asociada y cruce de fechas de vencimiento/emisión contra los requisitos de la plataforma. No incluye verificación con emisores externos.</p>
                                        )}
                                        {doc.verificationSource === 'SRCEI' && (
                                            <p><strong>Registro Civil (Chile):</strong> Análisis IA complementado con verificación en la plataforma del <a href="https://www.registrocivil.cl/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Servicio de Registro Civil e Identificación</a>. Se validó la autenticidad y estado de vigencia del documento de identidad emitido en Chile, corroborando que los datos extraídos coinciden con la base oficial.</p>
                                        )}
                                        {doc.verificationSource === 'DT_GOB' && (
                                            <p><strong>Dirección del Trabajo (Chile):</strong> Análisis IA complementado con verificación en el sitio web oficial de la <a href="https://www.dt.gob.cl/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dirección del Trabajo</a>. Se validó el certificado F30/F30-1 ingresando el número de folio y RUT del empleador, o escaneando el código QR impreso para corroborar que el documento emitido coincide exactamente con el presentado y no presenta adulteraciones.</p>
                                        )}
                                        {doc.verificationSource === 'PREVIRED' && (
                                            <p><strong>Previred:</strong> Análisis IA complementado con verificación en el validador público de <a href="https://www.previred.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Previred</a>. Se introdujo el Código de Validación de Cupones/Firmas Digitales (código de barras o número de serie) para confirmar que la planilla de pago de cotizaciones fue procesada efectivamente y no corresponde a un borrador o documento adulterado.</p>
                                        )}
                                        {doc.verificationSource === 'ACHS' && (
                                            <p><strong>Asociación Chilena de Seguridad (ACHS):</strong> Análisis IA complementado con verificación mediante código de verificación en el validador oficial de <a href="https://www.achs.cl/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ACHS</a>. Se validó que el certificado (Adhesión, Cotizaciones, Siniestralidad) corresponde efectivamente a la empresa consultada, validando su estado de vigencia y que no presente adulteraciones.</p>
                                        )}
                                        {doc.verificationSource === 'MANUAL' && (
                                            <p><strong>Validación Manual:</strong> Este documento debe ser auditado de forma manual por un administrador del sistema. No se aplicó validación automatizada de terceros.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                             {/* Auditor IA Metadata Table (Nested Support) */}
                             {doc.extractedMetadata && (
                                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                                        <Bot size={12}/> Datos Extraídos
                                    </div>
                                    <div className="p-3 grid gap-3 text-sm">
                                        {/* Identidad */}
                                        {doc.extractedMetadata.coincidencia_identidad && (
                                            <div className="border-b border-gray-200 pb-2 mb-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Identidad</p>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">RUT Detectado:</span>
                                                    <span className="font-mono font-bold">{doc.extractedMetadata.coincidencia_identidad.rut_detectado || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Coincidencia:</span>
                                                    <span className={`font-bold ${doc.extractedMetadata.coincidencia_identidad.match_rut ? 'text-green-600' : 'text-red-600'}`}>
                                                        {doc.extractedMetadata.coincidencia_identidad.match_rut ? 'EXACTA' : 'NO COINCIDE'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Fechas */}
                                        {doc.extractedMetadata.analisis_fechas && (
                                            <div className="border-b border-gray-200 pb-2 mb-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vigencia</p>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">Emisión:</span>
                                                    <span>{doc.extractedMetadata.analisis_fechas.fecha_documento || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Vencimiento:</span>
                                                    <span>{doc.extractedMetadata.analisis_fechas.fecha_vencimiento || 'N/A'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Confidence */}
                                        {doc.extractedMetadata.confidence_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Confianza IA:</span>
                                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded font-mono">
                                                    {(doc.extractedMetadata.confidence_score * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. MODE SPECIFIC CONTENT */}
                        {readOnly ? (
                            <div className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <History size={14}/> Trazabilidad y Vigencia
                                </h4>
                                
                                <div className="border-l-2 border-gray-200 ml-2 space-y-6 mb-6">
                                    {/* Upload Event */}
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                                        <p className="text-xs text-gray-500">{new Date(doc.uploadDate).toLocaleString()}</p>
                                        <p className="text-sm font-medium text-gray-900">Documento cargado</p>
                                    </div>
                                    
                                    {/* AI Analysis Event (Simulated) */}
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-indigo-100 border-2 border-indigo-500"></div>
                                        <p className="text-xs text-gray-500">{new Date(doc.uploadDate).toLocaleString()}</p>
                                        <p className="text-sm font-medium text-gray-900">Análisis Inteligente (AI)</p>
                                        {doc.extractedMetadata && <p className="text-xs text-gray-500 mt-1">Extracción de datos y validación cruzada completada.</p>}
                                    </div>

                                    {/* Current Status Event */}
                                    <div className="relative pl-6">
                                        <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 ${doc.status === DocStatus.APPROVED ? 'bg-green-100 border-green-500' : doc.status === DocStatus.REJECTED ? 'bg-red-100 border-red-500' : 'bg-yellow-100 border-yellow-500'}`}></div>
                                        <p className="text-xs text-gray-500">Estado Actual</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {doc.status === DocStatus.APPROVED ? 'APROBADO' : doc.status === DocStatus.REJECTED ? 'RECHAZADO' : 'EN REVISIÓN'}
                                        </p>
                                        {comment && <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border border-gray-200 italic">"{comment}"</div>}
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={12}/> Vigencia Detectada</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs text-gray-400">Inicio</span>
                                            <span className="block text-sm font-medium text-gray-800">{startDate || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-400">Vencimiento</span>
                                            <span className="block text-sm font-medium text-gray-800">{expiryDate || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // ADMIN EDIT MODE
                            <div className="p-6 bg-yellow-50/50 flex-1">
                                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={14}/> Dictamen Final Mandante
                                </h4>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setStatus(DocStatus.APPROVED)}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                                status === DocStatus.APPROVED 
                                                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                                : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
                                            }`}
                                        >
                                            <CheckCircle2 size={18} /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => setStatus(DocStatus.REJECTED)}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                                status === DocStatus.REJECTED 
                                                ? 'bg-red-600 text-white border-red-600 shadow-md' 
                                                : 'bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600'
                                            }`}
                                        >
                                            <XCircle size={18} /> Rechazar
                                        </button>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-yellow-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 text-yellow-700 text-xs font-bold uppercase">
                                            <Edit3 size={12} /> Corrección de Fechas
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                 <label className="block text-xs font-medium text-gray-500 mb-1">Inicio Vigencia</label>
                                                 <input
                                                    type="date"
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border bg-white"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Vencimiento</label>
                                                <input
                                                    type="date"
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border bg-white"
                                                    value={expiryDate}
                                                    onChange={(e) => setExpiryDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 italic">* Modificar estos campos anulará los valores detectados por IA.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Observación Pública</label>
                                        <textarea
                                            rows={3}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
                                            placeholder="Motivo del rechazo o comentario adicional..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FOOTER ACTIONS */}
                        <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                                ID: {doc.id}
                            </span>
                            <div className="flex gap-2">
                                {readOnly ? (
                                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-300">
                                        Cerrar Visor
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancelar</button>
                                        <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow flex items-center gap-2">
                                            <Save size={16}/> Confirmar Cambios
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
