import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Calendar, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reqName: string;
    onUpload: (file: File, startDate: string, expiryDate: string) => void;
    initialStartDate?: string;
    initialExpiryDate?: string;
    isEditing?: boolean;
}

export const UploadModal: React.FC<Props> = ({ isOpen, onClose, reqName, onUpload, initialStartDate = '', initialExpiryDate = '', isEditing = false }) => {
    const [file, setFile] = useState<File | null>(null);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [expiryDate, setExpiryDate] = useState(initialExpiryDate);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when opening/closing or changing initial props
    useEffect(() => {
        if (isOpen) {
            setStartDate(initialStartDate);
            setExpiryDate(initialExpiryDate);
            setFile(null);
        }
    }, [isOpen, initialStartDate, initialExpiryDate]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation: If editing, file is optional (but user might want to re-upload). 
        // For simplicity, let's enforce re-uploading the file on "Edit" to ensure consistency, 
        // OR simply require a file if it's a new upload.
        // Given the prompt "edit the information they uploaded", often implies metadata.
        // However, standard flow usually requires the file to be present. 
        // Let's enforce file selection to keep the system stateless regarding "old" files in this modal context,
        // unless we want to allow metadata-only updates which is complex with file objects.
        // DECISION: Enforce file re-upload to ensure file matches dates.
        if (!file) {
            alert("Debe seleccionar el archivo (o volver a subirlo si está editando).");
            return;
        }

        if (!startDate || !expiryDate) {
            alert("Debe indicar las fechas de vigencia.");
            return;
        }
        if (new Date(startDate) > new Date(expiryDate)) {
            alert("La fecha de inicio no puede ser posterior a la fecha de término.");
            return;
        }
        onUpload(file, startDate, expiryDate);
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                <div className={`${isEditing ? 'bg-orange-500' : 'bg-blue-600'} px-6 py-4 flex justify-between items-center`}>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {isEditing ? <RefreshCw size={20} className="text-white" /> : <Upload size={20} className="text-blue-200" />}
                        {isEditing ? 'Editar / Re-subir' : 'Cargar Documento'}
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className={`${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'} p-3 rounded-lg border mb-4`}>
                        <p className={`text-xs ${isEditing ? 'text-orange-600' : 'text-blue-600'} uppercase font-bold mb-1`}>Requisito</p>
                        <p className="text-gray-900 font-medium text-sm">{reqName}</p>
                    </div>

                    {/* File Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isEditing ? 'Archivo (Requerido para actualizar)' : 'Archivo del Documento'}
                        </label>
                        <div 
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept=".pdf,.jpg,.png,.jpeg"
                            />
                            {file ? (
                                <div className="flex flex-col items-center text-green-700">
                                    <FileText size={32} className="mb-2" />
                                    <span className="text-sm font-bold truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-xs mt-1">Click para cambiar</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <Upload size={32} className="mb-2 text-gray-400" />
                                    <span className="text-sm font-medium">Click para seleccionar archivo</span>
                                    <span className="text-xs mt-1 text-gray-400">PDF, JPG o PNG</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inicio Vigencia</label>
                            <input 
                                type="date" 
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Término Vigencia</label>
                            <input 
                                type="date" 
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                value={expiryDate}
                                onChange={e => setExpiryDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 flex gap-2">
                        <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700">
                            Asegúrese de ingresar las fechas exactas que aparecen en el documento físico para evitar rechazos.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancelar</button>
                        <button type="submit" className={`px-6 py-2 ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md shadow-sm text-sm font-medium flex items-center gap-2`}>
                            {isEditing ? <RefreshCw size={16} /> : <Upload size={16} />} 
                            {isEditing ? 'Actualizar' : 'Subir Documento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};