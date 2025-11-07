import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📖 READ - Récupérer tous les articles (publiés seulement)
router.get("/", async (req, res) => {
    try {
        const { category, featured, level, search } = req.query;
        
        let query = `
            SELECT id, title, category, description, stats, publish_date, tags, level, is_featured 
            FROM Cameleon 
            WHERE is_published = true
        `;
        const params = [];
        let paramCount = 0;

        // Filtre par catégorie
        if (category && category !== 'all') {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        // Filtre articles en vedette
        if (featured === 'true') {
            paramCount++;
            query += ` AND is_featured = $${paramCount}`;
            params.push(true);
        }

        // Filtre par niveau
        if (level && level !== 'all') {
            paramCount++;
            query += ` AND level = $${paramCount}`;
            params.push(level);
        }

        // Recherche par texte
        if (search) {
            paramCount++;
            query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += " ORDER BY publish_date DESC";

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
        const result = await pool.query(`
            SELECT id, title, category, description, stats, publish_date, tags, level, is_featured, is_published, created_at 
            FROM Cameleon 
            ORDER BY created_at DESC
        `);
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
        const result = await pool.query("SELECT * FROM Cameleon WHERE id = $1", [req.params.id]);
        
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

// 📖 READ - Récupérer les articles en vedette
router.get("/featured", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, category, description, stats, publish_date, tags, level 
            FROM Cameleon 
            WHERE is_featured = true AND is_published = true 
            ORDER BY publish_date DESC 
            LIMIT 6
        `);
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

// 📖 READ - Récupérer les articles par catégorie
router.get("/category/:category", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, category, description, stats, publish_date, tags, level 
            FROM Cameleon 
            WHERE category = $1 AND is_published = true 
            ORDER BY publish_date DESC
        `, [req.params.category]);
        
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

// 📖 READ - Récupérer les catégories disponibles
router.get("/categories", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT category, COUNT(*) as article_count 
            FROM Cameleon 
            WHERE is_published = true 
            GROUP BY category 
            ORDER BY category
        `);
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

// ➕ CREATE - Créer un nouvel article
router.post("/", async (req, res) => {
    try {
        const { 
            title, 
            category, 
            description, 
            content, 
            stats, 
            publish_date, 
            tags, 
            is_featured, 
            level, 
            is_published 
        } = req.body;
        
        // Validation des champs requis
        if (!title || !category || !description || !content || !stats || !publish_date || !level) {
            return res.status(400).json({
                success: false,
                error: "Tous les champs obligatoires sont requis: title, category, description, content, stats, publish_date, level"
            });
        }
        
        const result = await pool.query(
            `INSERT INTO Cameleon 
                (title, category, description, content, stats, publish_date, tags, is_featured, level, is_published) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [
                title, 
                category, 
                description, 
                content, 
                stats, 
                publish_date, 
                tags || [], 
                is_featured || false, 
                level, 
                is_published !== false
            ]
        );
        
        res.status(201).json({
            success: true,
            message: "Article créé avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Erreur création article:", err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour un article par ID
router.put("/id/:id", async (req, res) => {
    try {
        const { 
            title, 
            category, 
            description, 
            content, 
            stats, 
            publish_date, 
            tags, 
            is_featured, 
            level, 
            is_published 
        } = req.body;
        
        const result = await pool.query(
            `UPDATE Cameleon 
             SET 
                title = $1, 
                category = $2, 
                description = $3, 
                content = $4, 
                stats = $5, 
                publish_date = $6, 
                tags = $7, 
                is_featured = $8, 
                level = $9, 
                is_published = $10,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $11 
             RETURNING *`,
            [
                title, 
                category, 
                description, 
                content, 
                stats, 
                publish_date, 
                tags, 
                is_featured, 
                level, 
                is_published, 
                req.params.id
            ]
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

// ✏️ UPDATE - Mettre à jour partiellement un article
router.patch("/id/:id", async (req, res) => {
    try {
        const updates = req.body;
        const allowedFields = [
            'title', 'category', 'description', 'content', 'stats', 'publish_date', 
            'tags', 'is_featured', 'level', 'is_published'
        ];
        
        // Filtrer les champs autorisés
        const validUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                validUpdates[key] = updates[key];
            }
        });

        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({
                success: false,
                error: "Aucun champ valide à mettre à jour"
            });
        }

        // Construction dynamique de la requête
        const setClause = Object.keys(validUpdates)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');
        
        const values = [...Object.values(validUpdates), req.params.id];

        const result = await pool.query(
            `UPDATE Cameleon 
             SET ${setClause}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${values.length} 
             RETURNING *`,
            values
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Article non trouvé" 
            });
        }
        
        res.json({
            success: true,
            message: "Article mis à jour partiellement avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Basculer l'état de publication
router.patch("/id/:id/toggle-publish", async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE Cameleon 
             SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING id, title, is_published`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Article non trouvé" 
            });
        }
        
        const article = result.rows[0];
        res.json({
            success: true,
            message: `Article ${article.is_published ? 'publié' : 'dépublié'} avec succès`,
            data: article
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Basculer l'état vedette
router.patch("/id/:id/toggle-featured", async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE Cameleon 
             SET is_featured = NOT is_featured, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING id, title, is_featured`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Article non trouvé" 
            });
        }
        
        const article = result.rows[0];
        res.json({
            success: true,
            message: `Article ${article.is_featured ? 'mis en vedette' : 'retiré des vedettes'} avec succès`,
            data: article
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
        const result = await pool.query("DELETE FROM Cameleon WHERE id = $1 RETURNING *", [req.params.id]);
        
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

// 📊 STATS - Statistiques des articles
router.get("/stats/overview", async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_articles,
                COUNT(*) FILTER (WHERE is_published = true) as published_articles,
                COUNT(*) FILTER (WHERE is_featured = true) as featured_articles,
                COUNT(DISTINCT category) as categories_count,
                ARRAY_AGG(DISTINCT category) as categories
            FROM Cameleon
        `);
        
        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

export default router;