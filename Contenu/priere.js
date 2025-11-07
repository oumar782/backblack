import express from "express";
import pool from "../db.js";

const router = express.Router();

// ➕ Créer une prière
router.post("/", async (req, res) => {
    try {
        const { title, content, type, category, duration, is_active } = req.body;
        const result = await pool.query(
            "INSERT INTO prayers (title, content, type, category, duration, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [title, content, type, category, duration, is_active]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Lire toutes les prières
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM prayers ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Lire une prière par ID
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM prayers WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Prière non trouvée" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✏️ Modifier une prière
router.put("/:id", async (req, res) => {
    try {
        const { title, content, type, category, duration, is_active } = req.body;
        const result = await pool.query(
            "UPDATE prayers SET title = $1, content = $2, type = $3, category = $4, duration = $5, is_active = $6 WHERE id = $7 RETURNING *",
            [title, content, type, category, duration, is_active, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Prière non trouvée" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ Supprimer une prière
router.delete("/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM prayers WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Prière non trouvée" });
        }
        res.json({ message: "Prière supprimée ✅", deletedPrayer: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;