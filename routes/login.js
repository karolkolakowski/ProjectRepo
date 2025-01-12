const express = require('express');
const router = express.Router();
const pool = require('../database');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    // Wyświetl stronę logowania
    res.render('login');
});

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Sprawdź, czy użytkownik istnieje
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            req.flash('error', 'Niewłaściwe hasło lub email');
            return res.redirect('/login');
        }

        const user = userResult.rows[0];

        // Sprawdź poprawność hasła
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            req.flash('success', 'Poprawne');
            res.redirect('/login');
        } else {
            req.flash('error', 'Niewłaściwe hasło lub email');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Błąd serwera:', error);
        req.flash('error', 'Wystąpił błąd serwera. Spróbuj ponownie.');
        res.redirect('/login');
    }
});

module.exports = router;
