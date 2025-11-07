import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📖 READ - Récupérer tous les défis
router.get("/", async (req, res) => {
    try {
        console.log("📥 Requête GET /api/defis reçue");
        const result = await pool.query("SELECT * FROM Defis ORDER BY id");
        console.log("✅ Données récupérées:", result.rows.length, "défis");
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 📖 READ - Récupérer un défi par ID
router.get("/id/:id", async (req, res) => {
    try {
        console.log(`📥 Requête GET /api/defis/id/${req.params.id} reçue`);
        const result = await pool.query("SELECT * FROM Defis WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Défi non trouvé" 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 📖 READ - Récupérer un défi par section_key
router.get("/:section_key", async (req, res) => {
    try {
        console.log(`📥 Requête GET /api/defis/${req.params.section_key} reçue`);
        const result = await pool.query("SELECT * FROM Defis WHERE section_key = $1", [req.params.section_key]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Défi non trouvé" 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ➕ CREATE - Créer un nouveau défi
router.post("/", async (req, res) => {
    try {
        console.log("📥 Requête POST /api/defis reçue", req.body);
        const { section_key, title, color, stats, content, full_content } = req.body;
        
        // Validation des champs requis
        if (!section_key || !title || !color || !stats || !content || !full_content) {
            return res.status(400).json({
                success: false,
                error: "Tous les champs sont requis"
            });
        }
        
        const result = await pool.query(
            `INSERT INTO Defis (section_key, title, color, stats, content, full_content) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [section_key, title, color, stats, content, full_content]
        );
        
        console.log("✅ Défi créé avec ID:", result.rows[0].id);
        res.status(201).json({
            success: true,
            message: "Défi créé avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        if (err.code === '23505') { // Violation de contrainte unique
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

// ✏️ UPDATE - Mettre à jour un défi par ID
router.put("/id/:id", async (req, res) => {
    try {
        console.log(`📥 Requête PUT /api/defis/id/${req.params.id} reçue`, req.body);
        const { section_key, title, color, stats, content, full_content } = req.body;
        
        const result = await pool.query(
            `UPDATE Defis 
             SET section_key = $1, title = $2, color = $3, stats = $4, content = $5, full_content = $6
             WHERE id = $7 
             RETURNING *`,
            [section_key, title, color, stats, content, full_content, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Défi non trouvé" 
            });
        }
        
        console.log("✅ Défi mis à jour:", result.rows[0].id);
        res.json({
            success: true,
            message: "Défi mis à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
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

// ✏️ UPDATE - Mettre à jour un défi par section_key
router.put("/:section_key", async (req, res) => {
    try {
        console.log(`📥 Requête PUT /api/defis/${req.params.section_key} reçue`, req.body);
        const { title, color, stats, content, full_content } = req.body;
        
        const result = await pool.query(
            `UPDATE Defis 
             SET title = $1, color = $2, stats = $3, content = $4, full_content = $5
             WHERE section_key = $6 
             RETURNING *`,
            [title, color, stats, content, full_content, req.params.section_key]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Défi non trouvé" 
            });
        }
        
        console.log("✅ Défi mis à jour:", result.rows[0].section_key);
        res.json({
            success: true,
            message: "Défi mis à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🗑️ DELETE - Supprimer un défi par ID
router.delete("/id/:id", async (req, res) => {
    try {
        console.log(`📥 Requête DELETE /api/defis/id/${req.params.id} reçue`);
        const result = await pool.query("DELETE FROM Defis WHERE id = $1 RETURNING *", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Défi non trouvé" 
            });
        }
        
        console.log("✅ Défi supprimé:", result.rows[0].id);
        res.json({
            success: true,
            message: "Défi supprimé avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🗑️ DELETE - Supprimer un défi par section_key
router.delete("/:section_key", async (req, res) => {
    try {
        console.log(`📥 Requête DELETE /api/defis/${req.params.section_key} reçue`);
        const result = await pool.query("DELETE FROM Defis WHERE section_key = $1 RETURNING *", [req.params.section_key]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Défi non trouvé" 
            });
        }
        
        console.log("✅ Défi supprimé:", result.rows[0].section_key);
        res.json({
            success: true,
            message: "Défi supprimé avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Erreur:", err.message);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

export default router;