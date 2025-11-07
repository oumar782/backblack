import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📖 READ - Récupérer tous les événements (publiés seulement)
router.get("/", async (req, res) => {
    try {
        const { category, type, featured } = req.query;
        
        let query = `
            SELECT id, title, description, type, format, event_date, event_time, duration, 
                   instructor, participants, max_participants, price, level, is_featured, category
            FROM events 
            WHERE is_published = true
        `;
        const params = [];
        let paramCount = 0;

        if (category && category !== 'all') {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        if (type && type !== 'all') {
            paramCount++;
            query += ` AND type = $${paramCount}`;
            params.push(type);
        }

        if (featured === 'true') {
            paramCount++;
            query += ` AND is_featured = $${paramCount}`;
            params.push(true);
        }

        query += " ORDER BY event_date ASC";

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

// 📖 READ - Récupérer tous les événements (admin - inclut non publiés)
router.get("/admin", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM events 
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

// 📖 READ - Récupérer un événement par ID
router.get("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM events WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Événement non trouvé" 
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

// 📖 READ - Récupérer les événements en vedette
router.get("/featured", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, description, type, format, event_date, event_time, duration, 
                   instructor, participants, max_participants, price, level, category
            FROM events 
            WHERE is_featured = true AND is_published = true 
            ORDER BY event_date ASC 
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

// 📖 READ - Récupérer les événements à venir
router.get("/upcoming", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, description, type, format, event_date, event_time, duration, 
                   instructor, participants, max_participants, price, level, category
            FROM events 
            WHERE is_published = true 
            ORDER BY event_date ASC 
            LIMIT 8
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

// 📖 READ - Récupérer les catégories disponibles
router.get("/categories", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT category, COUNT(*) as event_count 
            FROM events 
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

// 📖 READ - Récupérer les types disponibles
router.get("/types", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT type, COUNT(*) as event_count 
            FROM events 
            WHERE is_published = true 
            GROUP BY type 
            ORDER BY type
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

// ➕ CREATE - Créer un nouvel événement
router.post("/", async (req, res) => {
    try {
        const { 
            title, description, type, format, event_date, event_time, duration,
            instructor, max_participants, price, level, is_featured, category, is_published
        } = req.body;
        
        // Validation des champs requis
        if (!title || !description || !type || !format || !event_date || !event_time || 
            !duration || !instructor || !max_participants || !price || !level || !category) {
            return res.status(400).json({
                success: false,
                error: "Tous les champs obligatoires sont requis"
            });
        }
        
        const result = await pool.query(
            `INSERT INTO events 
                (title, description, type, format, event_date, event_time, duration,
                 instructor, max_participants, price, level, is_featured, category, is_published) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
             RETURNING *`,
            [
                title, description, type, format, event_date, event_time, duration,
                instructor, max_participants, price, level, is_featured || false, 
                category, is_published !== false
            ]
        );
        
        res.status(201).json({
            success: true,
            message: "Événement créé avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Erreur création événement:", err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour un événement par ID
router.put("/id/:id", async (req, res) => {
    try {
        const { 
            title, description, type, format, event_date, event_time, duration,
            instructor, max_participants, price, level, is_featured, category, is_published
        } = req.body;
        
        const result = await pool.query(
            `UPDATE events 
             SET 
                title = $1, description = $2, type = $3, format = $4, 
                event_date = $5, event_time = $6, duration = $7,
                instructor = $8, max_participants = $9, price = $10, 
                level = $11, is_featured = $12, category = $13, is_published = $14,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $15 
             RETURNING *`,
            [
                title, description, type, format, event_date, event_time, duration,
                instructor, max_participants, price, level, is_featured, category, 
                is_published, req.params.id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Événement non trouvé" 
            });
        }
        
        res.json({
            success: true,
            message: "Événement mis à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour le nombre de participants
router.patch("/id/:id/participants", async (req, res) => {
    try {
        const { participants } = req.body;
        
        const result = await pool.query(
            `UPDATE events 
             SET participants = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 
             RETURNING id, title, participants, max_participants`,
            [participants, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Événement non trouvé" 
            });
        }
        
        res.json({
            success: true,
            message: "Participants mis à jour avec succès",
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
            `UPDATE events 
             SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING id, title, is_published`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Événement non trouvé" 
            });
        }
        
        const event = result.rows[0];
        res.json({
            success: true,
            message: `Événement ${event.is_published ? 'publié' : 'dépublié'} avec succès`,
            data: event
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
            `UPDATE events 
             SET is_featured = NOT is_featured, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 
             RETURNING id, title, is_featured`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Événement non trouvé" 
            });
        }
        
        const event = result.rows[0];
        res.json({
            success: true,
            message: `Événement ${event.is_featured ? 'mis en vedette' : 'retiré des vedettes'} avec succès`,
            data: event
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🗑️ DELETE - Supprimer un événement par ID
router.delete("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING *", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Événement non trouvé" 
            });
        }
        
        res.json({
            success: true,
            message: "Événement supprimé avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 📊 STATS - Statistiques des événements
router.get("/stats/overview", async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_events,
                COUNT(*) FILTER (WHERE is_published = true) as published_events,
                COUNT(*) FILTER (WHERE is_featured = true) as featured_events,
                COUNT(DISTINCT category) as categories_count,
                COUNT(DISTINCT type) as types_count,
                SUM(participants) as total_participants,
                SUM(max_participants) as total_capacity
            FROM events
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