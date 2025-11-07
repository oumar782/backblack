import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📖 READ - Récupérer toutes les sections
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sections_contenu ORDER BY id");
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 📖 READ - Récupérer une section par ID
router.get("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sections_contenu WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Section non trouvée" 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 📖 READ - Récupérer une section par clé
router.get("/:section_key", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sections_contenu WHERE section_key = $1", [req.params.section_key]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Section non trouvée" 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ➕ CREATE - Créer une nouvelle section
router.post("/", async (req, res) => {
    try {
        const { section_key, title, subtitle, content_text } = req.body;
        
        if (!section_key || !title || !subtitle || !content_text) {
            return res.status(400).json({
                success: false,
                error: "Tous les champs sont requis"
            });
        }
        
        const result = await pool.query(
            `INSERT INTO sections_contenu (section_key, title, subtitle, content_text) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [section_key, title, subtitle, content_text]
        );
        
        res.status(201).json({
            success: true,
            message: "Section créée avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({
                success: false,
                error: "Cette clé de section existe déjà"
            });
        }
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour une section par ID
router.put("/id/:id", async (req, res) => {
    try {
        const { section_key, title, subtitle, content_text } = req.body;
        
        const result = await pool.query(
            `UPDATE sections_contenu 
             SET section_key = $1, title = $2, subtitle = $3, content_text = $4 
             WHERE id = $5 
             RETURNING *`,
            [section_key, title, subtitle, content_text, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Section non trouvée" 
            });
        }
        
        res.json({
            success: true,
            message: "Section mise à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({
                success: false,
                error: "Cette clé de section existe déjà"
            });
        }
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour une section par clé
router.put("/:section_key", async (req, res) => {
    try {
        const { title, subtitle, content_text } = req.body;
        
        const result = await pool.query(
            `UPDATE sections_contenu 
             SET title = $1, subtitle = $2, content_text = $3 
             WHERE section_key = $4 
             RETURNING *`,
            [title, subtitle, content_text, req.params.section_key]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Section non trouvée" 
            });
        }
        
        res.json({
            success: true,
            message: "Section mise à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🗑️ DELETE - Supprimer une section par ID
router.delete("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM sections_contenu WHERE id = $1 RETURNING *", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Section non trouvée" 
            });
        }
        
        res.json({
            success: true,
            message: "Section supprimée avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🗑️ DELETE - Supprimer une section par clé
router.delete("/:section_key", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM sections_contenu WHERE section_key = $1 RETURNING *", [req.params.section_key]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Section non trouvée" 
            });
        }
        
        res.json({
            success: true,
            message: "Section supprimée avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

export default router;