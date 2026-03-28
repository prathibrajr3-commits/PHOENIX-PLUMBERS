import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/send-confirmation", async (req, res) => {
    const { email, name, service, address, phone } = req.body;

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: "Phoenix Plumbers <onboarding@resend.dev>",
        to: [email],
        subject: "Service Request Confirmation - Phoenix Plumbers",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ea580c;">Service Request Received!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for choosing Phoenix Plumbers. We have received your request for <strong>${service}</strong>.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; font-size: 16px;">Request Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Service:</strong> ${service}</li>
                <li><strong>Address:</strong> ${address}</li>
                <li><strong>Phone:</strong> ${phone}</li>
              </ul>
            </div>
            <p>Our team will contact you shortly to confirm the appointment time.</p>
            <p>If you have any urgent questions, please call us at <strong>+91 98765 43210</strong>.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">Phoenix Plumbers - Professional Plumbing Services in Thoothukudi</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(400).json({ error });
      }

      res.status(200).json({ message: "Email sent successfully", data });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
