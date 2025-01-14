const express = require('express');
const router = express.Router();
const pool = require('../database');

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

router.get('/logout', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        // Zaktualizuj logout_datetime w tabeli user_session
        await pool.query(
            'UPDATE user_session SET logout_datetime = CURRENT_TIMESTAMP WHERE user_id = $1 AND logout_datetime IS NULL',
            [req.session.user.id]
        );

        // Zniszcz sesję
        req.session.destroy((err) => {
            if (err) {
                console.error('Błąd przy wylogowywaniu:', err);
                return res.redirect('/dashboard');
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.error('Błąd serwera:', error);
        res.redirect('/dashboard');
    }
});

module.exports = router;
