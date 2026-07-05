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
        from: `"GSAFE Cloud" <${smtpFrom}>`,
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
