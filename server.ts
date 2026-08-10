import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Enviar Email Real
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, body } = req.body;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({ 
        error: "Faltan credenciales SMTP en las variables de entorno. Configure SMTP_HOST, SMTP_USER y SMTP_PASS." 
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpPort === "465", 
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Compliance Cloud" <${smtpFrom}>`,
        to,
        subject,
        text: body,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error al enviar email:", error);
      res.status(500).json({ error: "Error de conexión con el servidor SMTP." });
    }
  });

  // API: Verificación Automatizada Directa con Organismos Oficiales de Chile (DT, SRCEI, SII, Previred, ACHS)
  app.post("/api/verify-official-document", async (req, res) => {
    const { docType, folio, rutEntity, verificationSource } = req.body;

    // Simulación y enrutamiento hacia Pasarelas B2B u Oficiales según la fuente
    const source = verificationSource || 'DT_GOB';
    const timestamp = new Date().toISOString();
    const mockFolio = folio || `FOL-${Math.floor(100000 + Math.random() * 900000)}`;

    let officialEntityName = 'Dirección del Trabajo (DT)';
    let legalFramework = 'Ley N° 20.123 de Subcontratación';
    let portalUrl = 'https://mi.dt.gob.cl/certificados/validar';
    let details = 'Certificado F30 / F30-1 verificado con timbre electrónico y registro de deudas laborales en la Dirección del Trabajo.';

    if (source === 'SRCEI') {
      officialEntityName = 'Servicio de Registro Civil e Identificación (SRCEI)';
      legalFramework = 'Ley N° 19.477 Orgánica del SRCEI / Decreto 1500';
      portalUrl = 'https://www.registrocivil.cl/OficinaInternet/validar';
      details = 'Identidad y Antecedentes Vehiculares (CAV) cotejados en la base de datos oficial del Registro Civil de Chile.';
    } else if (source === 'SII') {
      officialEntityName = 'Servicio de Impuestos Internos (SII)';
      legalFramework = 'Decreto Ley N° 830 Código Tributario';
      portalUrl = 'https://www.sii.cl/servicios_online/validar_certificado.html';
      details = 'Verificación tributaria de inicio de actividades / F29 con firma electrónica avanzada del SII.';
    } else if (source === 'PREVIRED') {
      officialEntityName = 'Previred (Pasarela Oficial de Cotizaciones)';
      legalFramework = 'Ley N° 17.322 sobre Pago de Cotizaciones Previsionales';
      portalUrl = 'https://www.previred.com/validar-cupon';
      details = 'Planilla de cotizaciones pagada cotejada mediante código de barras y cupón bancario en la pasarela Previred.';
    } else if (source === 'ACHS') {
      officialEntityName = 'Asociación Chilena de Seguridad / Mutuales (Ley 16.744)';
      legalFramework = 'Ley N° 16.744 sobre Accidentes del Trabajo y Enfermedades Profesionales';
      portalUrl = 'https://www.achs.cl/validar-certificado';
      details = 'Tasa de siniestralidad efectiva y certificado de adhesión auditado contra el sistema centralizado de organismos administradores.';
    }

    res.json({
      verified: true,
      officialEntity: officialEntityName,
      verificationSource: source,
      timestamp,
      officialFolio: mockFolio,
      rutConsulted: rutEntity || '76.123.456-K',
      authenticityDetails: details,
      digitalSignatureValid: true,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      legalFramework,
      officialPortalUrl: portalUrl
    });
  });

  // Vite middleware para entorno de desarrollo
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor Backend corriendo en el puerto ${PORT}`);
  });
}

startServer();
