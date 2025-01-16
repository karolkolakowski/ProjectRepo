const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const dashboardRoute = require('./routes/dashboard'); 

const app = express();

// Middleware dla sesji
app.use(
    session({
        secret: 'sekretny_klucz',
        resave: false,
        saveUninitialized: true,
    })
);

// Middleware dla flash messages
app.use(flash());

// Middleware do parsowania danych z formularzy
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware do obsługi plików statycznych
app.use(express.static(path.join(__dirname, 'css'))); // Obsługa folderu css

// Ustawienia widoków EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware dla flash messages w widokach
app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    next();
});

// Trasy
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/dashboard', dashboardRoute);


// Strona główna (przekierowanie na login)
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Serwer
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
