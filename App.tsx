
import React, { useState, useEffect } from 'react';
import { Company, DocStatus, DocumentSubmission, User, Worker, Vehicle, AppNotification, Project } from './types';
import { api } from './services/api'; 
import { REQUIREMENTS } from './mockData'; // Importar REQUIREMENTS para pasarlos a la IA
import { ContractorPortal } from './components/ContractorPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { CompanyManagement } from './components/CompanyManagement';
import { NotificationCenter } from './components/NotificationCenter';
import { MandanteControlCenter } from './components/MandanteControlCenter';
import { Chatbot } from './components/Chatbot';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ArcoPortalModal } from './components/ArcoPortalModal';
import { LandingSalesPage } from './components/LandingSalesPage';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { THEMES, ThemeId } from './theme';
import { MasterOwnerControlCenter } from './components/MasterOwnerControlCenter';
import { ComplianceAudits } from './components/ComplianceAudits';
import { GlobalPerformanceDashboard } from './components/GlobalPerformanceDashboard';
import { Construction, UserCircle, LogOut, Loader2, MailCheck, Bot, Moon, Sun, Globe, ShieldCheck, Lock, Sparkles, Palette, Building2, Key, Network, FileText, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
    // --- ESTADO GLOBAL ---
    const [companies, setCompanies] = useState<Company[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    // --- ESTADO DE UI ---
    const [isLoading, setIsLoading] = useState<boolean>(true); 
    const [showLandingPage, setShowLandingPage] = useState<boolean>(true); // Vista Comercial por defecto
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false); // Nuevo estado para IA
    const [authError, setAuthError] = useState<string | undefined>();
    const [adminView, setAdminView] = useState<'LIST' | 'DASHBOARD' | 'CONTROL_CENTER' | 'AUDITS' | 'GLOBAL_PERFORMANCE'>('LIST');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(false); // DARK MODE STATE
    const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
        return (localStorage.getItem('compliance_app_theme') as ThemeId) || 'corporate';
    });
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    
    // --- LEY 21.719 MODALES ---
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isArcoModalOpen, setIsArcoModalOpen] = useState(false);

    const toggleLanguage = () => {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (select) {
            select.value = select.value === 'en' ? 'es' : 'en';
            select.dispatchEvent(new Event('change'));
        }
    };

    // 1. CARGA INICIAL DE DATOS
    const refreshData = async () => {
        try {
            const [companiesData, notifsData] = await Promise.all([
                api.companies.list(),
                api.notifications.list()
            ]);
            setCompanies(companiesData);
            setNotifications(notifsData);
        } catch (error) {
            console.error("Error connecting to cloud services", error);
        }
    };

    // SETUP INICIAL Y EVENTOS DE CICLO DE VIDA
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const storedCreds = localStorage.getItem('compliance_auth_creds') || localStorage.getItem('gsafe_auth_creds');
            if (storedCreds) {
                try {
                    const { email, password } = JSON.parse(storedCreds);
                    const { user } = await api.auth.login(email, password);
                    if (user) {
                        setCurrentUser(user);
                        setShowLandingPage(false);
                        if (user.role === 'ADMIN') {
                            setAdminView('LIST');
                        }
                        await refreshData();
                    } else {
                        localStorage.removeItem('compliance_auth_creds');
                        localStorage.removeItem('gsafe_auth_creds');
                    }
                } catch (e) {
                    console.error("Auto-login failed", e);
                    localStorage.removeItem('compliance_auth_creds');
                    localStorage.removeItem('gsafe_auth_creds');
                }
            }
            setIsLoading(false);
        };
        init();

        // 2. REAL-TIME SYNC (Entre pestañas)
        // Escuchar cambios en la base de datos simulada y actualizar el estado
        api.db.subscribeToChanges(() => {
            console.log("Sync event received - Refreshing data...");
            refreshData();
        });

        // 3. ADVERTENCIA DE SALIDA (Before Unload)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Muestra el mensaje estándar del navegador
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // EFFECT: Handle Dark Mode and Themes
    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            document.body.classList.add('bg-slate-900');
            document.body.classList.remove('bg-gray-50');
        } else {
            root.classList.remove('dark');
            document.body.classList.remove('bg-slate-900');
            document.body.classList.add('bg-gray-50');
        }

        // Apply theme class
        root.classList.remove('theme-corporate', 'theme-industrial', 'theme-emerald', 'theme-cybertech', 'theme-executive');
        root.classList.add(`theme-${currentTheme}`);
        localStorage.setItem('compliance_app_theme', currentTheme);
    }, [darkMode, currentTheme]);

    const sendNotificationEmail = async (to: string, subject: string, body: string) => {
        try {
            await api.email.send(to, subject, body);
            setEmailSuccess(`Correo de credenciales enviado exitosamente a ${to}`);
            setTimeout(() => setEmailSuccess(null), 6000);
        } catch (e: any) {
            console.error("Fallo al enviar email", e);
            setEmailError(e.message || "Error al enviar el correo. Verifique la configuración SMTP.");
            setTimeout(() => setEmailError(null), 8000);
        }
    };

    // --- MANEJADORES DE AUTENTICACIÓN ---
    const handleLogin = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            const { user, error } = await api.auth.login(email, pass);
            if (error || !user) {
                setAuthError(error || "Error desconocido");
            } else {
                setCurrentUser(user);
                setShowLandingPage(false);
                setAuthError(undefined);
                localStorage.setItem('compliance_auth_creds', JSON.stringify({ email, password: pass }));
                if (user.role === 'ADMIN') {
                    setAdminView('LIST');
                    setSelectedCompanyId(null);
                }
                await refreshData();
            }
        } catch (e) {
            setAuthError("Error de conexión con el servidor");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        // 4. SALIDA INMEDIATA (Sin confirmación para evitar bloqueos)
        if (currentUser) {
            api.audit.log('LOGOUT', currentUser.id, currentUser.name, 'Cierre de sesión');
        }
        setCurrentUser(null);
        setShowLandingPage(true);
        setAdminView('LIST');
        setSelectedCompanyId(null);
        setAuthError(undefined);
        localStorage.removeItem('compliance_auth_creds');
        localStorage.removeItem('gsafe_auth_creds');
    };

    // --- ACCIONES DE NEGOCIO ---
    const handleAddCompany = async (newCompany: Company, newUser: User) => {
        setIsLoading(true);
        await api.companies.create(newCompany);
        await api.auth.createAdminUser(newUser);
        await refreshData();
        setIsLoading(false);
        await sendNotificationEmail(
            newCompany.contactEmail,
            `Bienvenido a Compliance Cloud - Credenciales de Acceso`,
            `Estimado proveedor ${newCompany.name}, su cuenta ha sido creada.\nUsuario: ${newUser.email}\nClave: ${newUser.password}\n\nPor favor ingrese al portal para cargar su documentación.`
        );
    };

    const handleAddProject = async (companyId: string, project: Project) => {
        setIsLoading(true);
        await api.companies.addProject(companyId, project);
        await refreshData();
        setIsLoading(false);
        const targetCompany = companies.find(c => c.id === companyId);
        if (targetCompany) {
            await sendNotificationEmail(
                targetCompany.contactEmail,
                `Nuevo Contrato Asignado: ${project.contractNumber}`,
                `Se ha habilitado la carga documental para el proyecto "${project.name}".`
            );
        }
    };

    const handleUpdateCompany = async (id: string, data: Partial<Company>) => {
        setIsLoading(true);
        await api.companies.update(id, data);
        await refreshData();
        setIsLoading(false);
    };

    const handleDeleteCompany = async (id: string) => {
        setIsLoading(true);
        await api.companies.remove(id);
        if (selectedCompanyId === id) setSelectedCompanyId(null);
        await refreshData();
        setIsLoading(false);
    };

    const handleAddWorker = async (workerData: {firstName: string, lastName: string, rut: string, role: string}) => {
        if (!currentUser || currentUser.role !== 'CONTRACTOR' || !currentUser.companyId) return;
        const newWorker: Worker = {
            id: `w_${Date.now()}`,
            companyId: currentUser.companyId,
            firstName: workerData.firstName,
            lastName: workerData.lastName,
            rut: workerData.rut,
            role: workerData.role,
            documents: []
        };
        setIsLoading(true); 
        await api.companies.addWorker(currentUser.companyId, newWorker);
        await refreshData();
        setIsLoading(false);
    };

    const handleAddVehicle = async (vehicleData: {plate: string, model: string, type: string}) => {
        if (!currentUser || currentUser.role !== 'CONTRACTOR' || !currentUser.companyId) return;
        const newVehicle: Vehicle = {
            id: `v_${Date.now()}`,
            companyId: currentUser.companyId,
            plate: vehicleData.plate,
            model: vehicleData.model,
            type: vehicleData.type,
            documents: []
        };
        setIsLoading(true);
        await api.companies.addVehicle(currentUser.companyId, newVehicle);
        await refreshData();
        setIsLoading(false);
    };

    const handleDeleteWorker = async (workerId: string) => {
        if (!currentUser || currentUser.role !== 'CONTRACTOR' || !currentUser.companyId) return;
        if (window.confirm("¿Está seguro de que desea eliminar a este trabajador? Esta acción no se puede deshacer.")) {
            setIsLoading(true);
            await api.companies.deleteWorker(currentUser.companyId, workerId);
            await refreshData();
            setIsLoading(false);
        }
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        if (!currentUser || currentUser.role !== 'CONTRACTOR' || !currentUser.companyId) return;
        if (window.confirm("¿Está seguro de que desea eliminar este vehículo? Esta acción no se puede deshacer.")) {
            setIsLoading(true);
            await api.companies.deleteVehicle(currentUser.companyId, vehicleId);
            await refreshData();
            setIsLoading(false);
        }
    };

    // --- CARGA DE DOCUMENTOS CON ANÁLISIS IA + EXTERNO ---
    const handleUpload = async (reqId: string, entityId: string, file: File, projectId: string, startDate: string, expiryDate: string) => {
        // 1. Iniciar Estado de "Analizando"
        setIsAnalyzing(true);
        
        // 2. Buscar definición del requisito y DATOS ESPERADOS (Identity Check)
        const reqDef = REQUIREMENTS.find(r => r.id === reqId);
        const targetCompanyId = currentUser?.role === 'CONTRACTOR' ? currentUser.companyId! : selectedCompanyId!;
        const company = companies.find(c => c.id === targetCompanyId);
        
        let expectedData = { name: '', rut: '', companyName: '', companyRut: '' };
        
        if (company) {
            if (entityId === company.id) {
                expectedData = { name: company.name, rut: company.rut, companyName: company.name, companyRut: company.rut };
            } else {
                const worker = company.workers.find(w => w.id === entityId);
                if (worker) {
                    expectedData = { name: `${worker.firstName} ${worker.lastName}`, rut: worker.rut, companyName: company.name, companyRut: company.rut };
                } else {
                    const vehicle = company.vehicles.find(v => v.id === entityId);
                    if (vehicle) {
                        expectedData = { name: vehicle.type, rut: vehicle.plate, companyName: company.name, companyRut: company.rut }; // Para vehículos adaptamos
                    }
                }
            }
        }

        // 3. Ejecutar Análisis IA (Híbrido: Visual + API Externa + Identity Check)
        const aiResult = await api.ai.analyzeDocument(file, reqDef, expiryDate, expectedData);
        
        // 4. Crear el objeto documento con los resultados de la IA y guardar el archivo en IndexedDB
        const finalExpiryDate = aiResult.detectedExpiry || expiryDate;
        const finalStartDate = aiResult.detectedStart || startDate;
        const docId = `doc_${Date.now()}`;

        try {
            const readFileAsBase64 = (f: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                });
            };
            const base64Data = await readFileAsBase64(file);
            await api.db.saveFile(docId, base64Data);
        } catch (dbErr) {
            console.error("Failed to save file to IndexedDB", dbErr);
        }

        const newDoc: DocumentSubmission = {
            id: docId,
            requirementId: reqId,
            entityId: entityId,
            projectId: projectId, 
            fileName: file.name,
            fileUrl: URL.createObjectURL(file), // Mantiene temporal para visualización instantánea rápida
            uploadDate: new Date().toISOString(),
            // APLICAR RESULTADO IA:
            status: aiResult.status,
            reviewerComment: aiResult.comment,
            verificationSource: aiResult.source, 
            extractedMetadata: aiResult.metadata, 
            startDate: finalStartDate, 
            expiryDate: finalExpiryDate 
        };

        await api.documents.upload(targetCompanyId, entityId, newDoc);
        await refreshData();
        
        setIsAnalyzing(false); // Terminar carga visual

        // Mostrar alerta específica según resultado
        if (aiResult.status === DocStatus.APPROVED) {
            alert(`✅ DOCUMENTO APROBADO\n\nEl Auditor Legal IA ha validado la identidad (${expectedData.rut}) y la vigencia del documento.`);
        } else {
            alert(`⚠️ DOCUMENTO RECHAZADO POR AUDITOR IA\n\nMotivo: ${aiResult.comment}\n\nPor favor revise que el documento sea legible y corresponda al trabajador seleccionado.`);
        }

        const targetCompany = companies.find(c => c.id === targetCompanyId);
        if (targetCompany) {
             await sendNotificationEmail(
                targetCompany.contactEmail,
                `Análisis Automático - ${file.name}`,
                `El documento "${file.name}" fue analizado.\nResultado: ${aiResult.status === DocStatus.APPROVED ? 'APROBADO' : 'RECHAZADO'}.\nObservación: ${aiResult.comment}`
            );
        }
    };

    const handleStatusChange = async (docId: string, newStatus: DocStatus, comment?: string, expiryDate?: string, startDate?: string) => {
        if (!selectedCompanyId) return;
        const result = await api.documents.updateStatus(selectedCompanyId, docId, newStatus, comment, expiryDate, startDate);
        
        if (result && (newStatus === DocStatus.APPROVED || newStatus === DocStatus.REJECTED)) {
            const isApproved = newStatus === DocStatus.APPROVED;
            await api.notifications.create({
                id: `notif_${Date.now()}`,
                companyId: selectedCompanyId,
                title: isApproved ? 'Documento Aprobado' : 'Documento Rechazado',
                message: isApproved 
                    ? `El documento "${result.docName}" ha sido validado exitosamente.`
                    : `El documento "${result.docName}" fue rechazado. Motivo: ${comment || 'Sin observación'}.`,
                type: isApproved ? 'SUCCESS' : 'ERROR',
                timestamp: new Date().toISOString(),
                isRead: false,
                relatedDocId: docId
            });

            const targetCompany = companies.find(c => c.id === selectedCompanyId);
            if (targetCompany) {
                const statusText = isApproved ? "APROBADO" : "RECHAZADO";
                await sendNotificationEmail(
                    targetCompany.contactEmail,
                    `Actualización de Documento: ${statusText}`,
                    `El documento "${result.docName}" ha sido ${statusText} (Revisión Manual).\n\nObservación: ${comment || 'Sin observaciones.'}`
                );
            }
        }
        await refreshData();
    };

    const handleAuthorizeAccess = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);
        await api.companies.authorizeAccess(selectedCompanyId);
        await api.notifications.create({
            id: `notif_auth_${Date.now()}`,
            companyId: selectedCompanyId,
            title: '¡Acceso a Faena Autorizado!',
            message: 'Su empresa cumple con todos los requisitos. El acceso ha sido habilitado.',
            type: 'SUCCESS',
            timestamp: new Date().toISOString(),
            isRead: false
        });
        await refreshData();
        setIsLoading(false);
        alert("¡Acceso Autorizado! La empresa ha sido notificada.");
        const targetCompany = companies.find(c => c.id === selectedCompanyId);
        if (targetCompany) {
            await sendNotificationEmail(
                targetCompany.contactEmail,
                `ACCESO A FAENA AUTORIZADO - ${targetCompany.name}`,
                `¡Felicidades! Su empresa ha cumplido con todos los requisitos documentales. El acceso a faena ha sido habilitado.`
            );
        }
    };

    // --- MANEJADORES DE NOTIFICACIONES ---
    const handleMarkAsRead = async (id: string) => {
        await api.notifications.markAsRead(id);
        const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        setNotifications(updated);
    };

    const handleClearAll = async () => {
        if (!currentUser || !currentUser.companyId) return;
        await api.notifications.markAllRead(currentUser.companyId);
        await refreshData();
    };

    // --- RENDERIZADO ---

    if (isLoading && !currentUser) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center flex-col gap-4">
                <Loader2 size={48} className="text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">Conectando con servidor seguro...</p>
            </div>
        );
    }

    if (!currentUser && showLandingPage) {
        return (
            <LandingSalesPage 
                onGoToLogin={() => setShowLandingPage(false)}
                onQuickDemoAdmin={() => handleLogin('admin@compliance.cl', 'admin')}
                onQuickDemoContractor={() => handleLogin('contacto@andes.cl', '123')}
            />
        );
    }

    if (!currentUser) {
        return (
            <Login 
                onLogin={handleLogin} 
                onGoToLanding={() => setShowLandingPage(true)}
                error={authError} 
            />
        );
    }

    if (currentUser && showLandingPage) {
        return (
            <div className="relative">
                <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between z-[100] sticky top-0 text-xs">
                    <span className="flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-400" />
                        Vista de Presentación Comercial para Ventas (Sesión activa como <strong>{currentUser.name}</strong>)
                    </span>
                    <button 
                        onClick={() => setShowLandingPage(false)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg transition-colors"
                    >
                        Volver a Mi Panel de Control &rarr;
                    </button>
                </div>
                <LandingSalesPage 
                    onGoToLogin={() => setShowLandingPage(false)}
                    onQuickDemoAdmin={() => { setShowLandingPage(false); setAdminView('LIST'); }}
                    onQuickDemoContractor={() => { setShowLandingPage(false); }}
                />
            </div>
        );
    }

    const currentCompany = currentUser.role === 'CONTRACTOR' 
        ? companies.find(c => c.id === currentUser.companyId)
        : companies.find(c => c.id === selectedCompanyId);

    const myNotifications = currentUser.role === 'CONTRACTOR' && currentUser.companyId
        ? notifications.filter(n => n.companyId === currentUser.companyId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        : [];

    return (
        <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            
            {/* OVERLAY DE CARGA IA */}
            {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white">
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center max-w-sm text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-40 animate-pulse"></div>
                            <Bot size={64} className="text-blue-400 relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Auditor Legal IA</h3>
                        <p className="text-gray-300 mb-6 text-sm">Validando identidad y normativa laboral chilena...</p>
                        <div className="flex flex-col gap-2 w-full mt-4">
                            <div className="flex items-center gap-2 text-xs font-mono text-blue-300 bg-blue-900/30 px-3 py-1 rounded-full">
                                <Loader2 size={12} className="animate-spin" />
                                Validando RUT y Nombre
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-green-300 bg-green-900/30 px-3 py-1 rounded-full">
                                <Loader2 size={12} className="animate-spin" />
                                Analizando Vigencia (Ley 16.744)
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay de Carga General */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-full shadow-lg">
                        <Loader2 size={32} className="text-blue-600 animate-spin" />
                    </div>
                </div>
            )}

            {/* Toast de Éxito para Email */}
            {emailSuccess && (
                <div className="fixed bottom-6 right-6 z-[60] max-w-sm w-full bg-slate-800 text-white p-4 rounded-lg shadow-2xl border-l-4 border-green-400 animate-in slide-in-from-right-full duration-300">
                    <div className="flex items-start gap-3">
                        <div className="bg-green-500/20 p-2 rounded-full">
                             <MailCheck size={20} className="text-green-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Éxito</h4>
                            <p className="text-xs text-gray-300 mt-1">{emailSuccess}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast de Error para Email */}
            {emailError && (
                <div className="fixed bottom-6 right-6 z-[60] max-w-sm w-full bg-slate-800 text-white p-4 rounded-lg shadow-2xl border-l-4 border-red-400 animate-in slide-in-from-right-full duration-300">
                    <div className="flex items-start gap-3">
                        <div className="bg-red-500/20 p-2 rounded-full">
                             <X size={20} className="text-red-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Error al enviar email</h4>
                            <p className="text-xs text-gray-300 mt-1">{emailError}</p>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-slate-900 text-white shadow-md z-40 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => currentUser.role === 'ADMIN' && setAdminView('LIST')}>
                        <Construction className="text-yellow-400" />
                        Compliance<span className="text-gray-400 font-light">Cloud</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* LEY 21.719 ARCO+P PORTAL BUTTON */}
                        <button 
                            onClick={() => setIsArcoModalOpen(true)} 
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            title="Portal de Derechos ARCO+P Ley 21.719"
                        >
                            <ShieldCheck size={16} className="text-emerald-400" />
                            <span className="hidden md:inline">Ley 21.719</span>
                        </button>

                        {/* THEME SELECTOR BUTTON */}
                        <button 
                            onClick={() => setIsThemeModalOpen(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:border-slate-500"
                            title="Cambiar Tema Visual (5 opciones)"
                        >
                            <Palette size={16} className="text-purple-400" />
                            <span className="hidden lg:inline">{THEMES[currentTheme].badgeText}</span>
                        </button>

                        {/* THEME TOGGLE (DARK/LIGHT) */}
                        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors" title="Modo Claro / Oscuro">
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        
                        {/* LANGUAGE TOGGLE (Simulated) */}
                        <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors" title="Cambiar Idioma">
                            <Globe size={20} />
                        </button>

                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-white">{currentUser.name}</div>
                            <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                {currentUser.role === 'ADMIN' ? 'Mandante (Admin)' : 'Contratista'}
                            </div>
                        </div>
                        {currentUser.role === 'CONTRACTOR' && (
                            <NotificationCenter 
                                notifications={myNotifications} 
                                onMarkAsRead={handleMarkAsRead}
                                onClearAll={handleClearAll}
                            />
                        )}
                        <div className="bg-slate-800 p-2 rounded-full border border-slate-700">
                            <UserCircle size={20} className="text-gray-300" />
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="ml-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                        >
                            <LogOut size={14} /> Salir
                        </button>
                    </div>
                </div>

                {/* BARRA DE DEMOSTRACIÓN & SELECTOR DE ENTORNOS */}
                <div className="bg-slate-950 border-t border-b border-slate-800/80 px-4 py-1.5">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-slate-300 font-bold">Modo de Demostración Activo:</span>
                            <span className="hidden md:inline text-slate-400">Alterna entre visiones para reuniones comerciales o pruebas.</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                            <button 
                                onClick={() => { setShowLandingPage(false); handleLogin('owner@compliance.cl', 'masterowner2026'); }}
                                className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${currentUser.role === 'MASTER_ADMIN' ? 'bg-amber-500/30 text-amber-300 border-amber-500' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                            >
                                <Key size={12} className="text-amber-400" />
                                Master Owner (Llaves)
                            </button>
                            <button 
                                onClick={() => { setShowLandingPage(false); handleLogin('admin@compliance.cl', 'admin'); }}
                                className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${currentUser.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                            >
                                <ShieldCheck size={12} className="text-amber-400" />
                                Demo Mandante EHS
                            </button>
                            <button 
                                onClick={() => { setShowLandingPage(false); handleLogin('contacto@andes.cl', '123'); }}
                                className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${currentUser.role === 'CONTRACTOR' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                            >
                                <Building2 size={12} className="text-emerald-400" />
                                Demo Contratista
                            </button>
                            <button 
                                onClick={() => { setShowLandingPage(false); handleLogin('sub@electro.cl', '123'); }}
                                className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${currentUser.companyId === 'comp_sub1' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                            >
                                <Network size={12} className="text-blue-400" />
                                Demo Subcontratista
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {currentUser.role === 'MASTER_ADMIN' ? (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <MasterOwnerControlCenter 
                            companies={companies} 
                            currentUser={currentUser} 
                            onRefreshCompanies={refreshData} 
                        />
                    </div>
                ) : currentUser.role === 'ADMIN' ? (
                    <>
                        {/* VIEW: COMPANY MANAGEMENT (CRUD) */}
                        {adminView === 'LIST' && (
                            <CompanyManagement 
                                companies={companies}
                                onAddCompany={handleAddCompany}
                                onUpdateCompany={handleUpdateCompany}
                                onDeleteCompany={handleDeleteCompany}
                                onSelectCompany={(id) => {
                                    setSelectedCompanyId(id);
                                    setAdminView('DASHBOARD');
                                }}
                                onAddProject={handleAddProject}
                                onGoToControlCenter={() => setAdminView('CONTROL_CENTER')}
                                onGoToAudits={() => setAdminView('AUDITS')}
                                onGoToGlobalPerformance={() => setAdminView('GLOBAL_PERFORMANCE')}
                            />
                        )}

                        {/* VIEW: CONTROL CENTER (NEW) */}
                        {adminView === 'CONTROL_CENTER' && (
                            <MandanteControlCenter 
                                companies={companies}
                                onBack={() => setAdminView('LIST')}
                            />
                        )}

                        {/* VIEW: GLOBAL PERFORMANCE DASHBOARD (D3 ANALYTICS) */}
                        {adminView === 'GLOBAL_PERFORMANCE' && (
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <GlobalPerformanceDashboard 
                                    companies={companies}
                                    onBack={() => setAdminView('LIST')}
                                />
                            </div>
                        )}

                        {/* VIEW: AUDITS DASHBOARD (NEW) */}
                        {adminView === 'AUDITS' && (
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <ComplianceAudits 
                                    companies={companies}
                                    onBack={() => setAdminView('LIST')}
                                />
                            </div>
                        )}

                        {/* VIEW: INDIVIDUAL COMPANY DASHBOARD (AUDIT) */}
                        {adminView === 'DASHBOARD' && currentCompany && (
                            <div className="relative">
                                <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-16 z-30 shadow-sm">
                                    <div className="max-w-7xl mx-auto px-4 py-2">
                                        <button 
                                            onClick={() => setAdminView('LIST')}
                                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 font-medium py-2 dark:text-gray-300"
                                        >
                                            &larr; Volver a lista de empresas
                                        </button>
                                    </div>
                                </div>
                                <AdminDashboard 
                                    company={currentCompany} 
                                    onStatusChange={handleStatusChange}
                                    onAuthorizeAccess={handleAuthorizeAccess}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    currentCompany ? (
                        <ContractorPortal 
                            company={currentCompany} 
                            onUpload={handleUpload} 
                            onAddWorker={handleAddWorker}
                            onAddVehicle={handleAddVehicle}
                            onDeleteWorker={handleDeleteWorker}
                            onDeleteVehicle={handleDeleteVehicle}
                            onRefresh={refreshData} // NUEVO: Pasamos la función de refresco
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
                             <div className="bg-red-100 p-4 rounded-full mb-4">
                                <Construction className="h-10 w-10 text-red-600" />
                             </div>
                             <h2 className="text-xl font-bold text-gray-900">Error de Vinculación</h2>
                             <p className="text-gray-500 max-w-md mt-2">Su usuario está activo pero no se ha encontrado la empresa vinculada. Contacte al administrador.</p>
                             <button onClick={handleLogout} className="mt-6 text-blue-600 underline">Volver al inicio</button>
                        </div>
                    )
                )}
            </main>
            
            <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-auto">
                 <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                        &copy; {new Date().getFullYear()} Compliance Cloud Platform. Todos los derechos reservados.
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsPrivacyModalOpen(true)}
                            className="hover:text-blue-600 dark:hover:text-blue-400 underline transition-colors flex items-center gap-1"
                        >
                            <Lock size={12} /> Política de Tratamiento de Datos (Ley 21.719)
                        </button>
                        <span>|</span>
                        <button 
                            onClick={() => setIsArcoModalOpen(true)}
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 underline transition-colors flex items-center gap-1 font-semibold"
                        >
                            <ShieldCheck size={12} className="text-emerald-500" /> Portal Derechos ARCO+P
                        </button>
                    </div>
                </div>
            </footer>
            
            {/* Chatbot Assistant */}
            <Chatbot />

            {/* Modales Ley 21.719 */}
            <PrivacyPolicyModal 
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
            />

            <ArcoPortalModal 
                isOpen={isArcoModalOpen}
                onClose={() => setIsArcoModalOpen(false)}
                currentUser={currentUser}
                companies={companies}
                onRefresh={refreshData}
            />

            {/* Modal de Temas Personalizados */}
            <ThemeSelectorModal 
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                currentTheme={currentTheme}
                onSelectTheme={(themeId) => setCurrentTheme(themeId)}
            />
        </div>
    );
};

export default App;
