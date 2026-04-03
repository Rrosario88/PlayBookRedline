import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import analyzeRoutes from "./routes/analyze.js";
import exportRoutes from "./routes/export.js";
import legalRoutes from "./routes/legal.js";
import mattersRoutes from "./routes/matters.js";
import "./services/db.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const defaultOrigins = ["http://localhost:5173", "http://localhost:8080", "https://playbookredline.187-124-249-117.sslip.io"];
const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((entry) => entry.trim()).filter(Boolean) ?? defaultOrigins;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers.accept?.includes("text/event-stream") || res.getHeader("Content-Type") === "text/event-stream") {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "PlaybookRedline API" });
});

app.use("/api", authRoutes);
app.use("/api", legalRoutes);
app.use("/api", mattersRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", exportRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err instanceof Error ? err.message : "Internal server error" });
});

app.listen(port, () => {
  console.log(`PlaybookRedline server listening on http://localhost:${port}`);
});
