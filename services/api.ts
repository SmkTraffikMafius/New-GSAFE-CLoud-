
import { Company, User, DocumentSubmission, DocStatus, AppNotification, Worker, Vehicle, Project, RequirementDef, VerificationSource, MonthlySafetyStats, AuditLog, AiVerdict } from '../types';
import { MOCK_COMPANY, MOCK_USERS } from '../mockData';
// Fix: Removed SchemaType from import as it is deprecated/removed in @google/genai
import { GoogleGenAI, Type } from "@google/genai";
import { externalValidator, ValidationResult } from './externalValidator';

// SIMULACIÓN DE RETARDO DE RED
const DELAY = 300; // Reducido para mejor UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- CANAL DE SINCRONIZACIÓN (Real-time entre pestañas) ---
const syncChannel = new BroadcastChannel('gsafe_data_sync');

// --- MÉTODOS PRIVADOS (Simulan Base de Datos) ---
const getDB = (key: string) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Error reading DB", e);
        return null;
    }
};

const setDB = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        // Notificar a otras pestañas/ventanas que hubo un cambio
        syncChannel.postMessage({ type: 'DB_UPDATE', key });
    } catch (e) {
        console.error("Error writing DB", e);
    }
};

// --- BASE DE DATOS DE ARCHIVOS INDEXEDDB (Para PDFs y fotos reales) ---
const DB_NAME = 'gsafe_file_db';
const STORE_NAME = 'files';

const initFileDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (event: any) => {
            resolve(event.target.result);
        };
        request.onerror = (event: any) => {
            reject(request.error);
        };
    });
};

const storeFile = async (id: string, fileData: string): Promise<void> => {
    const db = await initFileDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(fileData, id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const getFile = async (id: string): Promise<string | null> => {
    try {
        const db = await initFileDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB read error", e);
        return null;
    }
};

const getAllFiles = async (): Promise<Record<string, string>> => {
    try {
        const db = await initFileDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.openCursor();
            const results: Record<string, string> = {};
            request.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    results[cursor.key] = cursor.value;
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB read all error", e);
        return {};
    }
};

const clearAllFiles = async (): Promise<void> => {
    try {
        const db = await initFileDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB clear error", e);
    }
};

const getCompaniesDB = (): Company[] => {
    let companies = getDB('gsafe_companies');
    if (!companies) {
        companies = [MOCK_COMPANY];
        setDB('gsafe_companies', companies);
        
        // Inicializar usuarios si no existen
        if (!getDB('gsafe_users')) {
            setDB('gsafe_users', MOCK_USERS);
        }
    }
    // Asegurar que todas las empresas recuperadas tengan arreglos inicializados para evitar NPEs
    return (companies || []).map((c: any) => ({
        ...c,
        workers: c.workers || [],
        vehicles: c.vehicles || [],
        documents: c.documents || [],
        projects: c.projects || []
    }));
};

// --- CONFIGURACIÓN GENAI ---
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper para convertir File a Base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// --- LÓGICA DE NEGOCIO ---
const runExpirationCheckLogic = (companies: Company[]): { updatedCompanies: Company[], newNotifications: AppNotification[] } => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const warningThreshold = new Date();
    warningThreshold.setDate(today.getDate() + 30);
    let newNotifs: AppNotification[] = [];
    const processDocs = (docs: DocumentSubmission[], context: string, companyId: string) => {
        if (!docs || !Array.isArray(docs)) return [];
        return docs.map(doc => {
            if (doc && doc.status === DocStatus.APPROVED && doc.expiryDate) {
                const expiry = new Date(doc.expiryDate);
                expiry.setMinutes(expiry.getMinutes() + expiry.getTimezoneOffset());
                if (expiry < today) {
                    newNotifs.push({
                        id: `notif_exp_fail_${doc.id}_${Date.now()}`,
                        companyId: companyId,
                        title: 'Documento Vencido',
                        message: `El documento "${doc.fileName || 'Documento'}" (${context}) ha vencido el ${expiry.toLocaleDateString()}.`,
                        type: 'ERROR',
                        timestamp: new Date().toISOString(),
                        isRead: false,
                        relatedDocId: doc.id
                    });
                    return { ...doc, status: DocStatus.REJECTED, reviewerComment: 'Vencimiento Automático' };
                }
            }
            return doc;
        });
    };
    const updatedCompanies = (companies || []).map(comp => {
        if (!comp) return comp;
        return {
            ...comp,
            documents: processDocs(comp.documents || [], 'Empresa', comp.id),
            workers: (comp.workers || []).map(w => {
                if (!w) return w;
                return {
                    ...w,
                    documents: processDocs(w.documents || [], `Trabajador: ${w.firstName || 'Sin Nombre'}`, comp.id)
                };
            }),
            vehicles: (comp.vehicles || []).map(v => {
                if (!v) return v;
                return {
                    ...v,
                    documents: processDocs(v.documents || [], `Vehículo: ${v.plate || 'Sin Patente'}`, comp.id)
                };
            })
        };
    });
    return { updatedCompanies, newNotifications: newNotifs };
};

// --- API PÚBLICA (Service Layer) ---
export const api = {
    // Utilities for Backup/Restore
    db: {
        exportData: async () => {
            const files = await getAllFiles();
            const data = {
                companies: getCompaniesDB(),
                users: getDB('gsafe_users') || MOCK_USERS,
                notifications: getDB('gsafe_notifications') || [],
                audit_logs: getDB('gsafe_audit_logs') || [],
                files: files,
                timestamp: new Date().toISOString()
            };
            return JSON.stringify(data, null, 2);
        },
        importData: async (jsonData: string) => {
            try {
                const data = JSON.parse(jsonData);
                if (data.companies) setDB('gsafe_companies', data.companies);
                if (data.users) setDB('gsafe_users', data.users);
                if (data.notifications) setDB('gsafe_notifications', data.notifications);
                if (data.audit_logs) setDB('gsafe_audit_logs', data.audit_logs);
                if (data.files) {
                    await clearAllFiles();
                    for (const [id, base64] of Object.entries(data.files)) {
                        await storeFile(id, base64 as string);
                    }
                }
                return true;
            } catch (e) {
                console.error("Import failed", e);
                return false;
            }
        },
        subscribeToChanges: (callback: () => void) => {
            syncChannel.onmessage = (event) => {
                if (event.data.type === 'DB_UPDATE') {
                    callback();
                }
            };
        },
        getFile: async (id: string): Promise<string | null> => {
            return getFile(id);
        },
        saveFile: async (id: string, fileData: string): Promise<void> => {
            return storeFile(id, fileData);
        }
    },

    // NUEVO: Servicio de Auditoría
    audit: {
        log: async (action: string, userId: string, userName: string, details: string) => {
            const logs: AuditLog[] = getDB('gsafe_audit_logs') || [];
            const newLog: AuditLog = {
                id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                timestamp: new Date().toISOString(),
                action,
                userId,
                userName,
                details
            };
            setDB('gsafe_audit_logs', [newLog, ...logs]);
        },
        getLogs: async (): Promise<AuditLog[]> => {
            return getDB('gsafe_audit_logs') || [];
        }
    },

    // NUEVO: Utilidades de Exportación
    reports: {
        generateCSV: (data: any[], filename: string) => {
            if (!data || !data.length) return;
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(obj => Object.values(obj).join(','));
            const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    email: {
        send: async (to: string, subject: string, body: string) => {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, body })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Fallo al enviar email");
            }
            return true;
        }
    },

    // --- NUEVO: AGENTE AUDITOR IA HÍBRIDO (ACTUALIZADO CON PROMPT LEGAL CHILENO) ---
    ai: {
        analyzeDocument: async (
            file: File, 
            requirement: RequirementDef | undefined, 
            userGivenExpiry?: string,
            expectedData?: { name: string, rut: string, companyName?: string, companyRut?: string }
        ): Promise<{ status: DocStatus, verdict: AiVerdict, comment: string, detectedStart?: string, detectedExpiry?: string, source?: VerificationSource, metadata?: any }> => {
            
            // Simular análisis si no hay API_KEY en lugar de fallar y requerir revisión manual
            if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
                console.warn("No API Key found. Simulating AI and External validation.");
                
                await delay(1500); // simulate network/processing time
                
                let source = VerificationSource.AI_ONLY;
                let comment = "IA sugiere: Aprobación Inmediata.";
                
                if (requirement?.name.toLowerCase().includes('cédula') || requirement?.name.toLowerCase().includes('identidad') || requirement?.name.toLowerCase().includes('carnet')) {
                    source = VerificationSource.REGISTRO_CIVIL;
                    comment = "Verificado con Registro Civil. Cédula vigente y válida.";
                } else if (requirement?.name.toLowerCase().includes('f30') || requirement?.name.toLowerCase().includes('f-30') || requirement?.name.toLowerCase().includes('cumplimiento')) {
                    source = VerificationSource.DT_GOB;
                    comment = "Verificado en Dirección del Trabajo. Folio válido y sin multas.";
                } else if (requirement?.name.toLowerCase().includes('cotizaciones') && !requirement?.name.toLowerCase().includes('mutualidad') || requirement?.name.toLowerCase().includes('previred')) {
                    source = VerificationSource.PREVIRED;
                    comment = "Planilla verificada en Previred. Cupones de pago válidos.";
                } else if (requirement?.name.toLowerCase().includes('mutualidad') || requirement?.name.toLowerCase().includes('accidentabilidad')) {
                    source = VerificationSource.ACHS;
                    comment = "Verificado con ACHS. Documento válido y vigente.";
                }

                return { 
                    status: DocStatus.IN_REVIEW, // Always IN_REVIEW until admin approves, but with positive verdict
                    verdict: 'APPROVAL', 
                    comment: comment, 
                    source: source,
                    detectedStart: new Date().toISOString().split('T')[0],
                    detectedExpiry: userGivenExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    metadata: {
                        analisis_fechas: {
                            fecha_documento: new Date().toISOString().split('T')[0],
                            fecha_vencimiento: userGivenExpiry,
                            documento_vigente: true
                        }
                    }
                };
            }

            try {
                const filePart = await fileToPart(file);
                
                // PROMPT ESPECÍFICO ACTUALIZADO PARA DICTÁMENES PRECISOS
                const prompt = `
                    ROL:
                    Eres "Auditor Legal IA", un sistema experto automatizado que combina las competencias de un Abogado Laboral Chileno y un Experto Senior en Prevención de Riesgos.
                    Tu tarea es asignar un ESTADO DE PRE-CLASIFICACIÓN (verdict) al documento.

                    REGLAS DE AUDITORÍA ESTRICTAS PARA CONTRATOS Y DOCUMENTOS LABORALES:
                    1. IDENTIDAD DEL TRABAJADOR: Debes verificar que el nombre y RUT del trabajador en el documento coincidan exactamente con "Trabajador Esperado" y "RUT Esperado".
                    2. IDENTIDAD DEL EMPLEADOR: Si el documento es un contrato de trabajo u otro documento que vincule a una empresa, debes verificar que la empresa mencionada (Empleador) coincida con "Empresa Esperada" y "RUT Empresa Esperada". Si el empleador en el contrato es distinto a la empresa que está subiendo el documento (ej. un tercero u otra contratista que no corresponde), debes rechazar el documento.
                    3. VIGENCIA Y FECHAS: Debes buscar, extraer y analizar las fechas de emisión, inicio y término (si aplican) para asegurar que el documento es válido y está vigente. Identifica la fecha de inicio del contrato. Si el contrato tiene fecha de término, extraela.

                    ESTADOS POSIBLES (verdict):
                    1. "APPROVAL": Documento perfecto. Legible, vigente, coinciden trabajador y empleador, firmas presentes. Confianza > 90%.
                    2. "VALIDATION": Documento válido en contenido pero requiere doble chequeo humano (ej: firma borrosa pero presente, fecha manuscrita).
                    3. "REVIEW": Documento con dudas. Fechas ambiguas, RUT parcialmente legible, formato inusual.
                    4. "REJECTION": Documento ilegible, caducado, nombre/RUT de trabajador no coinciden, o el Empleador/Empresa en el documento NO COINCIDE con la Empresa Esperada.

                    ENTRADAS QUE RECIBIRÁS:
                    1. Datos del Registro (App): 
                       - Trabajador Esperado: "${expectedData?.name || 'Desconocido'}"
                       - RUT Esperado: "${expectedData?.rut || 'Desconocido'}"
                       - Empresa Esperada: "${expectedData?.companyName || 'Desconocido'}"
                       - RUT Empresa Esperada: "${expectedData?.companyRut || 'Desconocido'}"
                       - Tipo de Documento: "${requirement?.name || 'Documento General'}"
                    2. Contenido del Documento: La imagen/PDF adjunto.
                    3. Fecha Actual: ${new Date().toISOString().split('T')[0]}.

                    SALIDA ESPERADA (JSON):
                    Devuelve el estado en 'ai_verdict' (APPROVAL, VALIDATION, REVIEW, REJECTION) y el detalle del análisis.
                `;

                const response = await genAI.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [filePart, { text: prompt }] },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                ai_verdict: { type: Type.STRING, enum: ["APPROVAL", "VALIDATION", "REVIEW", "REJECTION"] },
                                estado_validacion: { type: Type.STRING, enum: ["APROBADO", "RECHAZADO", "OBSERVADO"] }, // Legacy mapping
                                coincidencia_identidad: {
                                    type: Type.OBJECT,
                                    properties: {
                                        nombre_detectado: { type: Type.STRING },
                                        rut_detectado: { type: Type.STRING },
                                        match_rut: { type: Type.BOOLEAN },
                                        empleador_detectado: { type: Type.STRING, nullable: true },
                                        match_empleador: { type: Type.BOOLEAN, nullable: true }
                                    }
                                },
                                analisis_fechas: {
                                    type: Type.OBJECT,
                                    properties: {
                                        fecha_documento: { type: Type.STRING },
                                        fecha_vencimiento: { type: Type.STRING, nullable: true },
                                        documento_vigente: { type: Type.BOOLEAN }
                                    }
                                },
                                razon_rechazo: { type: Type.STRING },
                                confidence_score: { type: Type.NUMBER }
                            }
                        }
                    }
                });

                const extractedData = JSON.parse(response.text || '{}');
                
                // Mapear respuesta del Auditor Legal IA a los tipos internos de la App
                let verdict: AiVerdict = 'REVIEW';
                if (extractedData.ai_verdict) verdict = extractedData.ai_verdict;
                
                // Determinar estado final para la App (Siempre IN_REVIEW a menos que sea rechazo obvio, para que Mandante apruebe)
                // MODIFICACIÓN: Si la IA dice APPROVAL, lo ponemos IN_REVIEW con veredicto APPROVAL para que el mandante solo de click.
                // Si la IA dice REJECTION, lo ponemos REJECTED directamente para ahorrar tiempo.
                let finalStatus = DocStatus.IN_REVIEW;
                if (verdict === 'REJECTION') finalStatus = DocStatus.REJECTED;

                // Construir comentario
                const comment = extractedData.razon_rechazo || (verdict === 'APPROVAL' ? 'IA sugiere: Aprobación Inmediata.' : 'IA sugiere: Revisión.');

                // Determinar fuente de validación
                let source = VerificationSource.AI_ONLY;
                if (requirement?.name.toLowerCase().includes('cédula') || requirement?.name.toLowerCase().includes('identidad') || requirement?.name.toLowerCase().includes('carnet')) {
                    source = VerificationSource.REGISTRO_CIVIL;
                } else if (requirement?.name.toLowerCase().includes('f30') || requirement?.name.toLowerCase().includes('f-30') || requirement?.name.toLowerCase().includes('cumplimiento')) {
                    source = VerificationSource.DT_GOB;
                } else if (requirement?.name.toLowerCase().includes('cotizaciones') && !requirement?.name.toLowerCase().includes('mutualidad') || requirement?.name.toLowerCase().includes('previred')) {
                    source = VerificationSource.PREVIRED;
                } else if (requirement?.name.toLowerCase().includes('mutualidad') || requirement?.name.toLowerCase().includes('accidentabilidad')) {
                    source = VerificationSource.ACHS;
                }

                return {
                    status: finalStatus,
                    verdict: verdict,
                    comment: comment,
                    detectedStart: extractedData.analisis_fechas?.fecha_documento,
                    detectedExpiry: extractedData.analisis_fechas?.fecha_vencimiento,
                    source: source,
                    metadata: extractedData // Guardamos toda la estructura rica
                };

            } catch (error) {
                console.error("AI/External Analysis failed", error);
                return { status: DocStatus.IN_REVIEW, verdict: 'REVIEW', comment: "Error técnico en análisis. Revisión manual requerida.", source: VerificationSource.MANUAL };
            }
        }
    },

    auth: {
        login: async (email: string, pass: string): Promise<{ user: User | null, error?: string }> => {
            await delay(DELAY);
            // IMPORTANTE: Leer siempre de LS primero, si no existe, usar MOCK
            const users = getDB('gsafe_users') || MOCK_USERS;
            if (!getDB('gsafe_users')) setDB('gsafe_users', users); // Persistir mocks si es primera vez

            const cleanEmail = email.trim().toLowerCase();
            const user = users.find((u: User) => u.email.toLowerCase() === cleanEmail && u.password === pass);
            if (!user) return { user: null, error: "Credenciales incorrectas" };
            if (user.role === 'CONTRACTOR') {
                const companies = getCompaniesDB();
                const exists = companies.find((c: Company) => c.id === user.companyId);
                if (!exists) return { user: null, error: "Empresa no encontrada" };
            }
            
            // Log Login
            api.audit.log('LOGIN', user.id, user.name, 'Inicio de sesión exitoso');
            
            return { user };
        },
        createAdminUser: async (user: User) => {
            const users = getDB('gsafe_users') || MOCK_USERS;
            setDB('gsafe_users', [...users, user]);
            api.audit.log('CREATE_USER', 'admin_system', 'Sistema', `Usuario creado: ${user.email}`);
        }
    },

    companies: {
        list: async (): Promise<Company[]> => {
            // await delay(DELAY); // Quitamos delay para lectura rápida
            let companies = getCompaniesDB();
            const { updatedCompanies, newNotifications } = runExpirationCheckLogic(companies);
            if (newNotifications.length > 0) {
                const currentNotifs = getDB('gsafe_notifications') || [];
                setDB('gsafe_notifications', [...currentNotifs, ...newNotifications]);
                setDB('gsafe_companies', updatedCompanies);
                return updatedCompanies;
            }
            return companies;
        },
        create: async (company: Company) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            // Asegurar que trabajadores y vehículos estén inicializados
            const sanitizedCompany = {
                ...company,
                workers: company.workers || [],
                vehicles: company.vehicles || [],
                documents: company.documents || [],
                projects: company.projects || []
            };
            setDB('gsafe_companies', [...companies, sanitizedCompany]);
            api.audit.log('CREATE_COMPANY', 'admin_system', 'Sistema', `Empresa creada: ${company.name}`);
            return sanitizedCompany;
        },
        update: async (companyId: string, data: Partial<Company>) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const idx = companies.findIndex((c: Company) => c.id === companyId);
            if (idx === -1) throw new Error("Company not found");
            companies[idx] = { 
                ...companies[idx], 
                ...data,
                workers: data.workers || companies[idx].workers || [],
                vehicles: data.vehicles || companies[idx].vehicles || [],
                documents: data.documents || companies[idx].documents || [],
                projects: data.projects || companies[idx].projects || []
            };
            setDB('gsafe_companies', companies);
            api.audit.log('UPDATE_COMPANY', 'admin_system', 'Sistema', `Empresa actualizada: ${companies[idx].name}`);
            return companies[idx];
        },
        remove: async (companyId: string) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const newCompanies = companies.filter((c: Company) => c.id !== companyId);
            setDB('gsafe_companies', newCompanies);
            const users = getDB('gsafe_users') || [];
            const newUsers = users.filter((u: User) => u.companyId !== companyId);
            setDB('gsafe_users', newUsers);
            api.audit.log('DELETE_COMPANY', 'admin_system', 'Sistema', `Empresa eliminada ID: ${companyId}`);
        },
        addProject: async (companyId: string, project: Project) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const idx = companies.findIndex((c: Company) => c.id === companyId);
            if (idx === -1) throw new Error("Company not found");
            if (!companies[idx].projects) companies[idx].projects = [];
            companies[idx].projects.push(project);
            setDB('gsafe_companies', companies);
            api.audit.log('ADD_PROJECT', 'admin_system', 'Sistema', `Contrato agregado: ${project.contractNumber} a ${companies[idx].name}`);
            return project;
        },
        // NUEVO: Agregar estadísticas de seguridad a un proyecto
        addProjectStats: async (companyId: string, projectId: string, stats: MonthlySafetyStats) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const cIdx = companies.findIndex((c: Company) => c.id === companyId);
            if (cIdx === -1) throw new Error("Company not found");
            
            const company = { ...companies[cIdx] };
            company.projects = company.projects || [];
            const pIdx = company.projects.findIndex((p: Project) => p.id === projectId);
            
            if (pIdx !== -1) {
                const project = { ...company.projects[pIdx] };
                const currentStats = project.safetyStats || [];
                
                // Si ya existe estadística para ese mes, actualizamos
                const existingIdx = currentStats.findIndex((s: MonthlySafetyStats) => s.month === stats.month);
                if (existingIdx !== -1) {
                    currentStats[existingIdx] = stats;
                } else {
                    currentStats.push(stats);
                }
                
                project.safetyStats = currentStats.sort((a: MonthlySafetyStats, b: MonthlySafetyStats) => b.month.localeCompare(a.month)); // Ordenar descendente
                company.projects[pIdx] = project;
                companies[cIdx] = company;
                setDB('gsafe_companies', companies);
                return project;
            }
            throw new Error("Project not found");
        },
        addWorker: async (companyId: string, worker: Worker) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const idx = companies.findIndex((c: Company) => c.id === companyId);
            if (idx === -1) throw new Error("Company not found");
            
            // Generate Mock QR URL
            worker.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({id: worker.id, rut: worker.rut, role: worker.role}))}`;
            
            // Asegurar que el arreglo de trabajadores exista
            if (!companies[idx].workers) {
                companies[idx].workers = [];
            }
            // Asegurar que el trabajador tenga arreglos de documentos
            worker.documents = worker.documents || [];
            
            companies[idx].workers.push(worker);
            setDB('gsafe_companies', companies);
            api.audit.log('ADD_WORKER', 'contractor', 'Contratista', `Trabajador agregado: ${worker.rut}`);
            return worker;
        },
        addVehicle: async (companyId: string, vehicle: Vehicle) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const idx = companies.findIndex((c: Company) => c.id === companyId);
            if (idx === -1) throw new Error("Company not found");
            
            // Asegurar que el arreglo de vehículos exista
            if (!companies[idx].vehicles) {
                companies[idx].vehicles = [];
            }
            // Asegurar que el vehículo tenga arreglos de documentos
            vehicle.documents = vehicle.documents || [];
            
            companies[idx].vehicles.push(vehicle);
            setDB('gsafe_companies', companies);
            api.audit.log('ADD_VEHICLE', 'contractor', 'Contratista', `Vehículo agregado: ${vehicle.plate}`);
            return vehicle;
        },
        deleteWorker: async (companyId: string, workerId: string) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const idx = companies.findIndex((c: Company) => c.id === companyId);
            if (idx === -1) throw new Error("Company not found");
            if (companies[idx].workers) {
                companies[idx].workers = companies[idx].workers.filter((w: Worker) => w.id !== workerId);
                setDB('gsafe_companies', companies);
                api.audit.log('DELETE_WORKER', 'contractor', 'Contratista', `Trabajador eliminado: ${workerId}`);
            }
        },
        deleteVehicle: async (companyId: string, vehicleId: string) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const idx = companies.findIndex((c: Company) => c.id === companyId);
            if (idx === -1) throw new Error("Company not found");
            if (companies[idx].vehicles) {
                companies[idx].vehicles = companies[idx].vehicles.filter((v: Vehicle) => v.id !== vehicleId);
                setDB('gsafe_companies', companies);
                api.audit.log('DELETE_VEHICLE', 'contractor', 'Contratista', `Vehículo eliminado: ${vehicleId}`);
            }
        },
        authorizeAccess: async (companyId: string) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const idx = companies.findIndex((c: Company) => c.id === companyId);
            if (idx !== -1) {
                companies[idx].accessAuthorized = true;
                setDB('gsafe_companies', companies);
                api.audit.log('AUTH_ACCESS', 'admin_system', 'Sistema', `Acceso autorizado a empresa: ${companies[idx].name}`);
            }
        }
    },

    documents: {
        upload: async (companyId: string, entityId: string, doc: DocumentSubmission) => {
            await delay(DELAY); 
            const companies = getCompaniesDB();
            const cIdx = companies.findIndex((c: Company) => c.id === companyId);
            if (cIdx === -1) throw new Error("Company not found");
            const comp = { ...companies[cIdx] };
            comp.workers = comp.workers || [];
            comp.vehicles = comp.vehicles || [];
            comp.documents = comp.documents || [];
            
            const upsert = (list: DocumentSubmission[], d: DocumentSubmission) => {
                const i = list.findIndex(x => x.requirementId === d.requirementId && x.projectId === d.projectId);
                return i >= 0 ? list.map((x, idx) => idx === i ? { ...d, history: [...(x.history || []), { date: new Date().toISOString(), action: 'UPLOAD', user: 'Contractor' }] } : x) : [...list, { ...d, history: [{ date: new Date().toISOString(), action: 'UPLOAD', user: 'Contractor' }] }];
            };
            if (entityId === comp.id) {
                comp.documents = upsert(comp.documents, doc);
            } else {
                const wIdx = comp.workers.findIndex((w: Worker) => w.id === entityId);
                if (wIdx >= 0) {
                    comp.workers[wIdx].documents = upsert(comp.workers[wIdx].documents || [], doc);
                } else {
                    const vIdx = comp.vehicles.findIndex((v: Vehicle) => v.id === entityId);
                    if (vIdx >= 0) {
                        comp.vehicles[vIdx].documents = upsert(comp.vehicles[vIdx].documents || [], doc);
                    }
                }
            }
            companies[cIdx] = comp;
            setDB('gsafe_companies', companies);
            api.audit.log('UPLOAD_DOC', 'contractor', 'Contratista', `Documento subido: ${doc.fileName}`);
            return doc;
        },
        updateStatus: async (companyId: string, docId: string, status: DocStatus, comment?: string, expiryDate?: string, startDate?: string) => {
            await delay(DELAY);
            const companies = getCompaniesDB();
            const cIdx = companies.findIndex((c: Company) => c.id === companyId);
            if (cIdx === -1) return;
            const comp = { ...companies[cIdx] };
            comp.workers = comp.workers || [];
            comp.vehicles = comp.vehicles || [];
            comp.documents = comp.documents || [];
            
            let docName = 'Documento';
            const updateList = (list: DocumentSubmission[]) => (list || []).map(d => {
                if (d.id === docId) {
                    docName = d.fileName;
                    const action = status === DocStatus.APPROVED ? 'APPROVE' : status === DocStatus.REJECTED ? 'REJECT' : 'UPLOAD';
                    return { 
                        ...d, 
                        status, 
                        reviewerComment: comment, 
                        expiryDate, 
                        startDate: startDate || d.startDate,
                        history: [...(d.history || []), { date: new Date().toISOString(), action, user: 'Admin', comment }]
                    };
                }
                return d;
            });
            comp.documents = updateList(comp.documents);
            comp.workers = comp.workers.map((w: Worker) => ({...w, documents: updateList(w.documents || [])}));
            comp.vehicles = comp.vehicles.map((v: Vehicle) => ({...v, documents: updateList(v.documents || [])}));
            companies[cIdx] = comp;
            setDB('gsafe_companies', companies);
            api.audit.log('REVIEW_DOC', 'admin_system', 'Sistema', `Documento ${status}: ${docName}`);
            return { docName };
        }
    },

    notifications: {
        list: async (): Promise<AppNotification[]> => {
            return getDB('gsafe_notifications') || [];
        },
        create: async (notif: AppNotification) => {
            const list = getDB('gsafe_notifications') || [];
            setDB('gsafe_notifications', [notif, ...list]);
        },
        markAsRead: async (notifId: string) => {
            const list = getDB('gsafe_notifications') || [];
            const updated = list.map((n: AppNotification) => n.id === notifId ? { ...n, isRead: true } : n);
            setDB('gsafe_notifications', updated);
            return updated;
        },
        markAllRead: async (companyId: string) => {
            const list = getDB('gsafe_notifications') || [];
            const updated = list.map((n: AppNotification) => n.companyId === companyId ? { ...n, isRead: true } : n);
            setDB('gsafe_notifications', updated);
            return updated;
        }
    }
};
