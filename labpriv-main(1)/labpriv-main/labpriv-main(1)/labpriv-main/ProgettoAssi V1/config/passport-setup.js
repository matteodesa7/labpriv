const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const keys = require('./keys');

passport.use(
    new GoogleStrategy({
        // L'URL a cui verrai reindirizzato dopo l'autenticazione
        callbackURL: "http://localhost:8000/auth/google/redirect",
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret
    }, () => {
        // Funzione di callback
    })
);
