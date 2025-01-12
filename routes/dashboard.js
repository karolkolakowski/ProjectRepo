const express = require('express');
const router = express.Router();
const pool = require('../database');

// Trasa dashboard
router.get('/', async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Musisz się najpierw zalogować.');
        return res.redirect('/login');
    }

    try {
        // Pobierz imię użytkownika z bazy danych
        const userResult = await pool.query('SELECT first_name FROM users WHERE user_id = $1', [req.session.user.id]);

        if (userResult.rows.length === 0) {
            req.flash('error', 'Nie znaleziono użytkownika.');
            return res.redirect('/login');
        }

        const user = userResult.rows[0];
        res.render('dashboard', { user });
    } catch (error) {
        console.error('Błąd serwera:', error);
        req.flash('error', 'Wystąpił błąd serwera. Spróbuj ponownie.');
        res.redirect('/login');
    }
});

module.exports = router;
