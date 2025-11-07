import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📖 READ - Récupérer toutes les fractures
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM Fracture ORDER BY date_creation DESC");
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

// 📖 READ - Récupérer une fracture par ID
router.get("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM Fracture WHERE id = $1", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Fracture non trouvée" 
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

// 📖 READ - Récupérer les fractures par statut
router.get("/statut/:statut", async (req, res) => {
    try {
        const validStatuts = ['en_attente', 'en_cours', 'traite'];
        if (!validStatuts.includes(req.params.statut)) {
            return res.status(400).json({
                success: false,
                error: "Statut invalide"
            });
        }
        
        const result = await pool.query(
            "SELECT * FROM Fracture WHERE statut = $1 ORDER BY date_creation DESC", 
            [req.params.statut]
        );
        
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

// 📖 READ - Récupérer les fractures par niveau d'urgence
router.get("/urgence/:urgence", async (req, res) => {
    try {
        const validUrgences = ['faible', 'moyen', 'eleve'];
        if (!validUrgences.includes(req.params.urgence)) {
            return res.status(400).json({
                success: false,
                error: "Niveau d'urgence invalide"
            });
        }
        
        const result = await pool.query(
            "SELECT * FROM Fracture WHERE niveau_urgence = $1 ORDER BY date_creation DESC", 
            [req.params.urgence]
        );
        
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

// 📖 READ - Récupérer les fractures par catégorie
router.get("/categorie/:categorie", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM Fracture WHERE categorie = $1 ORDER BY date_creation DESC", 
            [req.params.categorie]
        );
        
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

// 📊 READ - Récupérer les statistiques des fractures
router.get("/statistiques/total", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_fractures,
                COUNT(CASE WHEN niveau_urgence = 'eleve' THEN 1 END) as fractures_urgentes,
                COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
                COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as en_cours,
                COUNT(CASE WHEN statut = 'traite' THEN 1 END) as traitees
            FROM Fracture
        `);
        
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

// ➕ CREATE - Créer une nouvelle fracture
router.post("/", async (req, res) => {
    try {
        const { titre, categorie, description, lieu, niveau_urgence, contact } = req.body;
        
        // Validation des champs requis
        if (!titre || !categorie || !description || !lieu) {
            return res.status(400).json({
                success: false,
                error: "Les champs titre, categorie, description et lieu sont requis"
            });
        }
        
        // Validation du niveau d'urgence
        const validUrgences = ['faible', 'moyen', 'eleve'];
        const urgence = niveau_urgence && validUrgences.includes(niveau_urgence) ? niveau_urgence : 'moyen';
        
        const result = await pool.query(
            `INSERT INTO Fracture (titre, categorie, description, lieu, niveau_urgence, contact) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [titre, categorie, description, lieu, urgence, contact]
        );
        
        res.status(201).json({
            success: true,
            message: "Fracture créée avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour une fracture par ID
router.put("/id/:id", async (req, res) => {
    try {
        const { titre, categorie, description, lieu, niveau_urgence, contact, statut } = req.body;
        
        // Vérifier si la fracture existe
        const checkResult = await pool.query("SELECT * FROM Fracture WHERE id = $1", [req.params.id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Fracture non trouvée" 
            });
        }
        
        // Validation du niveau d'urgence si fourni
        if (niveau_urgence) {
            const validUrgences = ['faible', 'moyen', 'eleve'];
            if (!validUrgences.includes(niveau_urgence)) {
                return res.status(400).json({
                    success: false,
                    error: "Niveau d'urgence invalide"
                });
            }
        }
        
        // Validation du statut si fourni
        if (statut) {
            const validStatuts = ['en_attente', 'en_cours', 'traite'];
            if (!validStatuts.includes(statut)) {
                return res.status(400).json({
                    success: false,
                    error: "Statut invalide"
                });
            }
        }
        
        const result = await pool.query(
            `UPDATE Fracture 
             SET titre = COALESCE($1, titre),
                 categorie = COALESCE($2, categorie),
                 description = COALESCE($3, description),
                 lieu = COALESCE($4, lieu),
                 niveau_urgence = COALESCE($5, niveau_urgence),
                 contact = COALESCE($6, contact),
                 statut = COALESCE($7, statut),
                 date_maj = CURRENT_TIMESTAMP
             WHERE id = $8 
             RETURNING *`,
            [titre, categorie, description, lieu, niveau_urgence, contact, statut, req.params.id]
        );
        
        res.json({
            success: true,
            message: "Fracture mise à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// ✏️ UPDATE - Mettre à jour le statut d'une fracture
router.patch("/id/:id/statut", async (req, res) => {
    try {
        const { statut } = req.body;
        
        if (!statut) {
            return res.status(400).json({
                success: false,
                error: "Le champ statut est requis"
            });
        }
        
        const validStatuts = ['en_attente', 'en_cours', 'traite'];
        if (!validStatuts.includes(statut)) {
            return res.status(400).json({
                success: false,
                error: "Statut invalide"
            });
        }
        
        const result = await pool.query(
            `UPDATE Fracture 
             SET statut = $1, date_maj = CURRENT_TIMESTAMP
             WHERE id = $2 
             RETURNING *`,
            [statut, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Fracture non trouvée" 
            });
        }
        
        res.json({
            success: true,
            message: "Statut de la fracture mis à jour avec succès",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
});

// 🗑️ DELETE - Supprimer une fracture par ID
router.delete("/id/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM Fracture WHERE id = $1 RETURNING *", [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: "Fracture non trouvée" 
            });
        }
        
        res.json({
            success: true,
            message: "Fracture supprimée avec succès",
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