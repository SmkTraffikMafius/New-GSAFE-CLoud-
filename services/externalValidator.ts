

import { VerificationSource } from '../types';

/**
 * SERVICIO DE VALIDACIÓN EXTERNA (MOCK)
 * 
 * En producción, este servicio se conectaría vía REST/SOAP a:
 * 1. Dirección del Trabajo (DT) -> Para F-30-1
 * 2. Registro Civil (SRCEI) -> Para Cédulas (Vigencia de Documento)
 * 3. PRT.cl -> Para Revisiones Técnicas
 * 
 * Como estas APIs requieren certificados digitales y enrolamiento gubernamental,
 * simulamos la respuesta basada en reglas de negocio lógicas.
 */

export interface ValidationResult {
    isValid: boolean;
    source: VerificationSource;
    message: string;
    metadata?: any;
}

export const externalValidator = {

    /**
     * Valida Certificado F-30-1 en la Dirección del Trabajo
     * Endpoint Real (Referencia): https://dt.gob.cl/tramites/validar
     */
    validateF30: async (folio: string, rutEmpresa: string): Promise<ValidationResult> => {
        // Simulación: Si el folio termina en "0", es inválido (para demo)
        const isMockValid = !folio.endsWith('0'); 

        await new Promise(r => setTimeout(r, 800)); // Latencia de API GUB

        if (isMockValid) {
            return {
                isValid: true,
                source: VerificationSource.DT_GOB,
                message: `Certificado F-30-1 Folio ${folio} VIGENTE en Dirección del Trabajo.`,
                metadata: { verifiedAt: new Date().toISOString(), folio }
            };
        } else {
            return {
                isValid: false,
                source: VerificationSource.DT_GOB,
                message: `Certificado F-30-1 Folio ${folio} NO ENCONTRADO o ANULADO en bases de datos de la DT.`
            };
        }
    },

    /**
     * Valida Vigencia de Cédula en Registro Civil
     * Endpoint Real (Referencia): API Integración SRCEI (Requiere Convenio)
     */
    validateIdentityCard: async (rut: string, serialNumber: string): Promise<ValidationResult> => {
        // Simulación: Si el número de serie tiene menos de 9 dígitos, rechazamos
        const isMockValid = serialNumber && serialNumber.length >= 9;

        await new Promise(r => setTimeout(r, 600));

        if (isMockValid) {
            return {
                isValid: true,
                source: VerificationSource.REGISTRO_CIVIL,
                message: `Cédula ${rut} (Serie ${serialNumber}) VIGENTE en Registro Civil.`,
                metadata: { verifiedAt: new Date().toISOString() }
            };
        } else {
            return {
                isValid: false,
                source: VerificationSource.REGISTRO_CIVIL,
                message: `Documento NO VIGENTE o BLOQUEADO en Registro Civil.`
            };
        }
    },

    /**
     * Valida Revisión Técnica en PRT.cl
     */
    validateTechnicalRevision: async (plate: string, expiryDateDetected: string): Promise<ValidationResult> => {
        // Simulación: Validar que la patente tenga formato correcto (XX1111 o XXXX11)
        const plateRegex = /^[A-Z]{2,4}\d{2,4}$/;
        const isValidFormat = plateRegex.test(plate.replace('-', ''));

        await new Promise(r => setTimeout(r, 700));

        if (isValidFormat) {
            return {
                isValid: true,
                source: VerificationSource.PRT_CL,
                message: `Revisión Técnica patente ${plate} VIGENTE hasta ${expiryDateDetected} en PRT.cl`,
                metadata: { verifiedAt: new Date().toISOString() }
            };
        } else {
            return {
                isValid: false,
                source: VerificationSource.PRT_CL,
                message: `Patente ${plate} no registra Revisión Técnica al día en base nacional.`
            };
        }
    }
};
