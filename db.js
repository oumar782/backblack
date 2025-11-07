import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuration flexible pour tous les environnements
const getDbConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSupabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase');
  
  // Configuration de base
  const config = {
    connectionString: process.env.DATABASE_URL,
  };

  // SSL configuration adaptative
  if (isProduction || isSupabase) {
    config.ssl = { 
      rejectUnauthorized: false 
    };
  } else {
    // En développement local, SSL optionnel
    config.ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
  }

  // Configuration alternative via variables individuelles
  if (!process.env.DATABASE_URL) {
    config.host = process.env.DB_HOST || 'localhost';
    config.port = process.env.DB_PORT || 5432;
    config.database = process.env.DB_NAME || 'book_db';
    config.user = process.env.DB_USER || 'postgres';
    config.password = process.env.DB_PASSWORD;
    
    // SSL pour les connexions externes même en dev
    if (config.host !== 'localhost' && config.host !== '127.0.0.1') {
      config.ssl = { rejectUnauthorized: false };
    }
  }

  return config;
};

const pool = new Pool(getDbConfig());

// Gestion robuste des erreurs de connexion
pool.on('connect', () => {
  console.log('🔄 Connexion à la base de données établie');
});

pool.on('error', (err) => {
  console.error('💥 Erreur de connexion à la base de données:', err.message);
});

// Test de connexion au démarrage
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Connecté à PostgreSQL avec succès:');
    console.log('   📅 Heure du serveur:', result.rows[0].current_time);
    
    // Détection automatique de l'environnement
    const isSupabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase');
    console.log('   🌍 Environnement:', isSupabase ? 'Supabase' : (process.env.NODE_ENV || 'development'));
    
    client.release();
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données:');
    console.error('   Message:', err.message);
    
    if (err.message.includes('SSL')) {
      console.error('   💡 Astuce: Vérifiez la configuration SSL');
    } else if (err.message.includes('authentication')) {
      console.error('   💡 Astuce: Vérifiez le nom d\'utilisateur/mot de passe');
    } else if (err.message.includes('connect')) {
      console.error('   💡 Astuce: Vérifiez l\'URL de connexion et le réseau');
    }
    
    // Ne pas quitter le processus en production pour éviter les redémarrages en boucle
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Exécuter le test de connexion
testConnection();

export default pool;