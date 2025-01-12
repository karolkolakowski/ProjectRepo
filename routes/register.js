const express = require('express');
const router = express.Router();
const pool = require('../database');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { promisify } = require('util');
const randomBytesAsync = promisify(crypto.randomBytes);

// Konfiguracja nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

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
        req.flash('error', passwordErrors.join('<br>'));
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
        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password, email_confirmed, registration_datetime) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING user_id',
            [firstName, lastName, email, hashedPassword, 0]
        );

        const userId = newUser.rows[0].user_id;

        // Generuj token do potwierdzenia
        const token = (await randomBytesAsync(32)).toString('hex');

        // Dodaj token do tabeli email_confirmations
        await pool.query(
            'INSERT INTO email_confirmations (user_id, confirmation_token, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
            [userId, token]
        );

        // Wyślij e-mail z linkiem do potwierdzenia
        const confirmationUrl = `http://localhost:3000/confirm/${token}`;
        await transporter.sendMail({
            to: email,
            subject: 'Potwierdź swoje konto',
            html: `<p>Witaj ${firstName},</p>
                   <p>Dziękujemy za rejestrację. Kliknij poniższy link, aby potwierdzić swój adres e-mail:</p>
                   <a href="${confirmationUrl}">${confirmationUrl}</a>`
        });

        req.flash('success', 'Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.');
        res.redirect('/register');
    } catch (error) {
        console.error('Błąd serwera:', error);
        req.flash('error', 'Wystąpił błąd serwera. Spróbuj ponownie.');
        res.redirect('/register');
    }
});

// Trasa potwierdzenia e-maila
router.get('/confirm/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const confirmationResult = await pool.query('SELECT * FROM email_confirmations WHERE confirmation_token = $1', [token]);

        if (confirmationResult.rows.length === 0) {
            req.flash('error', 'Nieprawidłowy lub wygasły token potwierdzający.');
            return res.redirect('/register');
        }

        const userId = confirmationResult.rows[0].user_id;

        await pool.query('UPDATE users SET email_confirmed = 1 WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM email_confirmations WHERE confirmation_token = $1', [token]);

        req.flash('success', 'Adres e-mail został potwierdzony. Możesz się teraz zalogować.');
        res.redirect('/login');
    } catch (error) {
        console.error('Błąd serwera:', error);
        req.flash('error', 'Wystąpił błąd serwera. Spróbuj ponownie.');
        res.redirect('/register');
    }
});

module.exports = router;
