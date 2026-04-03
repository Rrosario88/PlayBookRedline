import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import analyzeRoutes from "./routes/analyze.js";
import exportRoutes from "./routes/export.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const defaultOrigins = ["http://localhost:5173", "http://localhost:8080"];
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
app.use(cors({ origin: corsOrigin }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "PlaybookRedline API" });
});

app.use("/api", analyzeRoutes);
app.use("/api", exportRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err instanceof Error ? err.message : "Internal server error" });
});

app.listen(port, () => {
  console.log(`PlaybookRedline server listening on http://localhost:${port}`);
});
