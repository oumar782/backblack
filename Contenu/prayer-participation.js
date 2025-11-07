import express from "express";
import pool from "../db.js";

const router = express.Router();

/* -------------------------
   CRUD PRAYER PARTICIPATIONS
-------------------------- */

// ➕ Participer à une prière
router.post("/", async (req, res) => {
    try {
        const { prayer_id, user_name, user_email, user_country, user_message, timezone } = req.body;
        
        // Validation des champs requis
        if (!user_name || !user_email) {
            return res.status(400).json({ error: "Le nom et l'email sont obligatoires" });
        }

        const result = await pool.query(
            "INSERT INTO prayer_participations (prayer_id, user_name, user_email, user_country, user_message, timezone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [prayer_id, user_name, user_email, user_country, user_message, timezone]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Lire toutes les participations
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pp.*, p.title as prayer_title 
            FROM prayer_participations pp 
            LEFT JOIN prayers p ON pp.prayer_id = p.id 
            ORDER BY pp.participated_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Lire une participation par ID
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pp.*, p.title as prayer_title 
            FROM prayer_participations pp 
            LEFT JOIN prayers p ON pp.prayer_id = p.id 
            WHERE pp.id = $1
        `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Participation non trouvée" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Lire les participations d'un utilisateur par email
router.get("/user/:email", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pp.*, p.title as prayer_title 
            FROM prayer_participations pp 
            LEFT JOIN prayers p ON pp.prayer_id = p.id 
            WHERE pp.user_email = $1 
            ORDER BY pp.participated_at DESC
        `, [req.params.email]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Lire les participations à une prière
router.get("/prayer/:prayer_id", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pp.*, p.title as prayer_title 
            FROM prayer_participations pp 
            LEFT JOIN prayers p ON pp.prayer_id = p.id 
            WHERE pp.prayer_id = $1 
            ORDER BY pp.participated_at DESC
        `, [req.params.prayer_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✏️ Modifier une participation
router.put("/:id", async (req, res) => {
    try {
        const { user_name, user_email, user_country, user_message, timezone } = req.body;
        const result = await pool.query(
            "UPDATE prayer_participations SET user_name = $1, user_email = $2, user_country = $3, user_message = $4, timezone = $5 WHERE id = $6 RETURNING *",
            [user_name, user_email, user_country, user_message, timezone, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Participation non trouvée" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ Supprimer une participation
router.delete("/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM prayer_participations WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Participation non trouvée" });
        }
        res.json({ message: "Participation supprimée ✅", deletedParticipation: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;