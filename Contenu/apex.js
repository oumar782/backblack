import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📖 Lire tous les articles publiés
router.get("/", async (req, res) => {
    try {
        const { category, search } = req.query;
        
        let query = "SELECT * FROM blog_posts WHERE is_published = true";
        const params = [];

        if (category && category !== 'all') {
            query += " AND category = $1";
            params.push(category);
        }

        if (search) {
            const searchParam = `%${search}%`;
            if (params.length === 0) {
                query += " AND (title ILIKE $1 OR content ILIKE $1)";
            } else {
                query += " AND (title ILIKE $2 OR content ILIKE $2)";
            }
            params.push(searchParam);
        }

        query += " ORDER BY published_at DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Lire un article par ID
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM blog_posts WHERE id = $1 AND is_published = true", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Article non trouvé" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ➕ Créer un article
router.post("/", async (req, res) => {
    try {
        const { title, content, excerpt, category, author_name, read_time } = req.body;
        
        const result = await pool.query(
            "INSERT INTO blog_posts (title, content, excerpt, category, author_name, read_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [title, content, excerpt, category, author_name, read_time]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;