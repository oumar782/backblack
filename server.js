import express from "express";
import dotenv from "dotenv";
import pool from "./db.js";
import Apex from "./Contenu/apex.js";
import Priere from "./Contenu/priere.js";
import participated_at from "./Contenu/prayer-participation.js";
import Defis from "./Contenu/defis.js";
import Lada from "./Contenu/lada.js";
import Principe from "./Contenu/principe.js";
import Cameleon from "./Contenu/cameleon.js";
import Event from "./Contenu/event.js";
import Fracture from "./Contenu/fracture.js";

dotenv.config();

const app = express();

// ✅ Middleware CORS
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",
  "https://black-book.netlify.app",
  "https://dashblacks.netlify.app",
  "https://bacmeyody.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// 🏥 Test route
app.get("/api/health", async (req, res) => {
  try {
    const dbCheck = await pool.query("SELECT NOW()");
    res.status(200).json({
      status: "healthy",
      dbTime: dbCheck.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "unhealthy", error: err.message });
  }
});

// ✅ Routes
app.use("/api/apex", Apex);
app.use("/api/priere", Priere); // ✅ Changé de "Priere" à "priere" (minuscule)
app.use("/api/participation", participated_at); // ✅ Changé de "Participation" à "participation"
app.use("/api/defis", Defis); // ✅ SUPPRIMÉ l'espace après "defis"
app.use("/api/lada", Lada); // ✅ SUPPRIMÉ l'espace après "defis"
app.use("/api/principe", Principe); // ✅ SUPPRIMÉ l'espace après "defis"
app.use("/api/cameleon", Cameleon); // ✅ SUPPRIMÉ l'espace après "defis"
app.use("/api/event", Event); // ✅ SUPPRIMÉ l'espace après "defis"
app.use("/api/fracture",Fracture); // ✅ SUPPRIMÉ l'espace après "defis"

app.get("/", (req, res) => {
  res.send("✅ Backend Blackbook opérationnel (CORS activé)");
});

// Pour le développement local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
});

export default app;