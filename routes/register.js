const express = require('express');
const router = express.Router();
const pool = require('../database');
const bcrypt = require('bcrypt');

// Funkcja walidująca hasło
function validatePassword(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Hasło musi mieć co najmniej 8 znaków.');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Hasło musi zawierać co najmniej jedną wielką literę.');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Hasło musi zawierać co najmniej jedną cyfrę.');
    }
    return errors;
}

router.get('/', (req, res) => {
    // Wyświetl stronę rejestracji
    res.render('register');
});

router.post('/', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Walidacja hasła
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        req.flash('error', passwordErrors.join(' '));
        return res.redirect('/register');
    }

    // Sprawdź, czy hasła są zgodne
    if (password !== confirmPassword) {
        req.flash('error', 'Hasła nie pasują!');
        return res.redirect('/register');
    }

    try {
        // Sprawdź, czy e-mail już istnieje
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
            req.flash('error', 'Użytkownik z takim adresem e-mail już istnieje!');
            return res.redirect('/register');
        }

        // Hashuj hasło
        const hashedPassword = await bcrypt.hash(password, 10);

        // Dodaj użytkownika do bazy danych
        await pool.query(
            'INSERT INTO users (first_name, last_name, email, password, email_confirmed, registration_datetime) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
            [firstName, lastName, email, hashedPassword, 0]
        );

        req.flash('success', 'Konto zostało utworzone pomyślnie!');
        res.redirect('/register');
    } catch (error) {
        console.error('Błąd serwera:', error);
        req.flash('error', 'Wystąpił błąd serwera. Spróbuj ponownie.');
        res.redirect('/register');
    }
});

module.exports = router;
