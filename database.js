const { Pool } = require('pg');
require('dotenv').config(); // Wczytaj zmienne środowiskowe z pliku .env

console.log('DB_PASSWORD:', process.env.DB_PASSWORD); // Sprawdź, czy hasło jest poprawnie wczytane

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
});

module.exports = pool;
