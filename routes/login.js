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

        // Sprawdź, czy e-mail jest potwierdzony
        if (user.email_confirmed !== 1) {
            req.flash('error', 'Adres e-mail nie został potwierdzony.');
            return res.redirect('/login');
        }

        // Sprawdź poprawność hasła
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            // Przekierowanie na nową stronę po zalogowaniu
            req.session.user = { id: user.user_id, email: user.email }; // Zapisanie danych użytkownika w sesji
            res.redirect('/dashboard');
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

// Nowa trasa po zalogowaniu
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Musisz się najpierw zalogować.');
        return res.redirect('/login');
    }

    res.render('dashboard', { user: req.session.user });
});

module.exports = router;
