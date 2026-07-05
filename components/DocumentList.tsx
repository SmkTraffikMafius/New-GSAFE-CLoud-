
import React, { useState } from 'react';
import { DocStatus, DocumentSubmission, RequirementDef } from '../types';
import { StatusBadge } from './StatusBadge';
import { Upload, FileText, Eye, Edit, CalendarClock, CalendarRange, Bot, Pencil, RotateCcw } from 'lucide-react';
import { ReviewModal } from './ReviewModal';
import { UploadModal } from './UploadModal';

interface Props {
    requirements: RequirementDef[];
    documents: DocumentSubmission[];
    entityId: string;
    readOnly?: boolean; // readOnly=true means ADMIN VIEW, readOnly=false means CONTRACTOR VIEW
    onUpload: (reqId: string, entityId: string, file: File, startDate: string, expiryDate: string) => void;
    onStatusChange?: (docId: string, newStatus: DocStatus, comment?: string, expiryDate?: string, startDate?: string) => void;
}

export const DocumentList: React.FC<Props> = ({ requirements, documents, entityId, readOnly = false, onUpload, onStatusChange }) => {
    
    // State for Review/View Modal
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReviewReadOnly, setIsReviewReadOnly] = useState(false); 
    const [selectedDoc, setSelectedDoc] = useState<DocumentSubmission | undefined>(undefined);
    const [selectedReqName, setSelectedReqName] = useState('');

    // State for Upload Modal (Contractor)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadReqId, setUploadReqId] = useState('');
    const [uploadReqName, setUploadReqName] = useState('');
    
    // State for Contractor Editing
    const [isEditingUpload, setIsEditingUpload] = useState(false);
    const [editInitialStart, setEditInitialStart] = useState('');
    const [editInitialExpiry, setEditInitialExpiry] = useState('');

    // Helper para encontrar el doc subido para un requisito
    const getDocForRequirement = (reqId: string) => documents.find(d => d.requirementId === reqId);
    
    // Helper para verificar si está vencido o por vencer (solo visual)
    const getExpiryStatus = (dateStr?: string) => {
        if (!dateStr) return null;
        const today = new Date();
        const expiry = new Date(dateStr);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Vencido', color: 'text-red-600 bg-red-50 border-red-200' };
        if (diffDays <= 30) return { label: 'Por Vencer', color: 'text-orange-600 bg-orange-50 border-orange-200' };
        return { label: 'Vigente', color: 'text-green-600 bg-green-50 border-green-200' };
    };

    const handleOpenUpload = (reqId: string, reqName: string) => {
        setUploadReqId(reqId);
        setUploadReqName(reqName);
        setIsEditingUpload(false);
        setEditInitialStart('');
        setEditInitialExpiry('');
        setIsUploadModalOpen(true);
    };

    // New: Handle Contractor Edit
    const handleOpenEditContractor = (doc: DocumentSubmission, reqId: string, reqName: string) => {
        setUploadReqId(reqId);
        setUploadReqName(reqName);
        setIsEditingUpload(true);
        setEditInitialStart(doc.startDate || '');
        setEditInitialExpiry(doc.expiryDate || '');
        setIsUploadModalOpen(true);
    };

    const handleUploadConfirm = (file: File, startDate: string, expiryDate: string) => {
        onUpload(uploadReqId, entityId, file, startDate, expiryDate);
        setIsUploadModalOpen(false);
    };

    // Abre modal en modo EDICIÓN (Admin) para sobreescribir IA
    const openReviewModalEdit = (doc: DocumentSubmission, reqName: string) => {
        setSelectedDoc(doc);
        setSelectedReqName(reqName);
        setIsReviewReadOnly(false); // Enable editing in review modal
        setIsReviewModalOpen(true);
    };

    // Abre modal en modo LECTURA (Ver detalle)
    const openViewModal = (doc: DocumentSubmission, reqName: string) => {
        setSelectedDoc(doc);
        setSelectedReqName(reqName);
        setIsReviewReadOnly(true); // Disable editing
        setIsReviewModalOpen(true);
    };

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%] min-w-[200px]">Documento Requerido</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%] min-w-[250px]">Base Legal / Descripción</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] min-w-[100px]">Estado</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%] min-w-[120px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requirements.map((req) => {
                                const doc = getDocForRequirement(req.id);
                                const status = doc ? doc.status : DocStatus.PENDING;
                                const expiryInfo = doc?.expiryDate ? getExpiryStatus(doc.expiryDate) : null;

                                return (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg overflow-hidden ${doc ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {doc && doc.fileUrl && doc.fileUrl.startsWith('data:image/') ? (
                                                        <img src={doc.fileUrl} alt="thumbnail" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <FileText size={20} />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{req.name}</div>
                                                    {doc ? (
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <div className="text-xs text-gray-500 truncate max-w-[200px]" title={doc.fileName}>
                                                                {doc.fileName}
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                {doc.startDate && (
                                                                     <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                                         <CalendarRange size={10} /> Desde: {new Date(doc.startDate).toLocaleDateString()}
                                                                     </div>
                                                                )}
                                                                {doc.expiryDate && expiryInfo && (
                                                                    <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border w-fit ${expiryInfo.color}`}>
                                                                        <CalendarClock size={10} />
                                                                        <span>Hasta: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No cargado</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-500">
                                                {req.legalBasis && <span className="font-semibold block text-gray-700">{req.legalBasis}</span>}
                                                {req.description}
                                            </div>
                                            {doc?.reviewerComment && (
                                                <div className="mt-2 text-xs bg-red-50 text-red-600 p-2 rounded border border-red-100">
                                                    <span className="font-bold">Observación:</span> {doc.reviewerComment}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={status} source={doc?.verificationSource} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                
                                                {/* --- VISTA CONTRATISTA --- */}
                                                {!readOnly && (
                                                    <>
                                                        {/* Subir Nuevo */}
                                                        {(!doc || status === DocStatus.PENDING || status === DocStatus.REJECTED) && (
                                                            <button
                                                                onClick={() => handleOpenUpload(req.id, req.name)}
                                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded transition-colors hover:bg-blue-100"
                                                            >
                                                                <Upload size={14} /> {doc ? 'Re-subir' : 'Subir'}
                                                            </button>
                                                        )}
                                                        
                                                        {/* Editar Existente (Permitimos editar incluso si está en revisión para corregir errores) */}
                                                        {doc && (
                                                            <button
                                                                onClick={() => handleOpenEditContractor(doc, req.id, req.name)}
                                                                className="text-orange-500 hover:text-orange-700 p-1.5 hover:bg-orange-50 rounded transition-colors"
                                                                title="Editar información / Re-subir"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                {/* --- VISTA ADMIN (readOnly=true) --- */}
                                                {readOnly && doc && onStatusChange && (
                                                    <button 
                                                        onClick={() => openReviewModalEdit(doc, req.name)}
                                                        className="text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 transition-colors text-xs font-bold"
                                                        title="Auditar, Controlar y Editar IA"
                                                    >
                                                        <Bot size={14} className="text-blue-300" /> Control IA
                                                    </button>
                                                )}

                                                {/* ACCIÓN COMÚN: Ver Detalle (Solo lectura para todos) */}
                                                {doc && (
                                                    <button 
                                                        onClick={() => openViewModal(doc, req.name)}
                                                        className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors" 
                                                        title="Ver detalle y auditoría"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Auditoría / Visualización / Edición Admin */}
            <ReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                doc={selectedDoc}
                reqName={selectedReqName}
                readOnly={isReviewReadOnly}
                onSave={(docId, status, comment, expiryDate, startDate) => {
                    if (onStatusChange) onStatusChange(docId, status, comment, expiryDate, startDate);
                }}
            />

            {/* Modal de Carga / Edición Contratista */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                reqName={uploadReqName}
                onUpload={handleUploadConfirm}
                isEditing={isEditingUpload}
                initialStartDate={editInitialStart}
                initialExpiryDate={editInitialExpiry}
            />
        </>
    );
};
