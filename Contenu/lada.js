import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📖 READ - Récupérer tous les articles (publiés seulement)
router.get("/", async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = "SELECT id, title, excerpt, category, read_time, publish_date FROM articleslada WHERE is_published = true";
        const params = [];

        if (category && category !== 'all') {
            query += " AND category = $1";
            params.push(category);
        }

        query += " ORDER BY id DESC";

        const result = await pool.query(query, params);
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

// 📖 READ - Récupérer tous les articles (admin - inclut non publiés)
router.get("/admin", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM articles ORDER BY id DESC");
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

// 📖 READ - Récupérer un article par ID
router.get("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM articleslada WHERE id = $1 AND is_published = true", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Article non trouvé" 
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

// ➕ CREATE - Créer un nouvel article
router.post("/", async (req, res) => {
    try {
        const { title, excerpt, category, read_time, publish_date, content, is_published } = req.body;
        
        if (!title || !excerpt || !category || !read_time || !publish_date || !content) {
            return res.status(400).json({
                success: false,
                error: "Tous les champs sont requis"
            });
        }
        
        const result = await pool.query(
            `INSERT INTO articleslada (title, excerpt, category, read_time, publish_date, content, is_published) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [title, excerpt, category, read_time, publish_date, content, is_published !== false]
        );
        
        res.status(201).json({
            success: true,
            message: "Article créé avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour un article par ID
router.put("/id/:id", async (req, res) => {
    try {
        const { title, excerpt, category, read_time, publish_date, content, is_published } = req.body;
        
        const result = await pool.query(
            `UPDATE articleslada 
             SET title = $1, excerpt = $2, category = $3, read_time = $4, 
                 publish_date = $5, content = $6, is_published = $7
             WHERE id = $8 
             RETURNING *`,
            [title, excerpt, category, read_time, publish_date, content, is_published, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Article non trouvé" 
            });
        }
        
        res.json({
            success: true,
            message: "Article mis à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Publier/Dépublier un article
router.patch("/id/:id/publish", async (req, res) => {
    try {
        const { is_published } = req.body;
        
        const result = await pool.query(
            "UPDATE articleslada SET is_published = $1 WHERE id = $2 RETURNING *",
            [is_published, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Article non trouvé" 
            });
        }
        
        res.json({
            success: true,
            message: `Article ${is_published ? 'publié' : 'dépublié'} avec succès`,
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🗑️ DELETE - Supprimer un article par ID
router.delete("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM articles WHERE id = $1 RETURNING *", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Article non trouvé" 
            });
        }
        
        res.json({
            success: true,
            message: "Article supprimé avec succès",
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