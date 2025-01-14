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
            // Zapisz sesję użytkownika w tabeli user_session
            await pool.query(
                'INSERT INTO user_session (user_id, login_datetime) VALUES ($1, CURRENT_TIMESTAMP)',
                [user.user_id]
            );

            // Przekierowanie na nową stronę po zalogowaniu
            req.session.user = { id: user.user_id, email: user.email, first_name: user.first_name }; // Zapisanie danych użytkownika w sesji
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
router.get('/dashboard', async (req, res) => {
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

// Trasa wylogowania
router.get('/logout', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Błąd przy wylogowywaniu:', err);
            return res.redirect('/dashboard');
        }
        res.redirect('/login');
    });
});

module.exports = router;
