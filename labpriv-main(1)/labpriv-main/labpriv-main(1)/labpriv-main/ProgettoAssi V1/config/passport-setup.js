const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const keys = require('./keys');
const bcrypt=require('bcrypt');

passport.use(
    new GoogleStrategy({
        // L'URL a cui verrai reindirizzato dopo l'autenticazione
        callbackURL: "http://localhost:8000/auth/google/redirect",
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret
    }, (accessToken,refreshToken,profile,done) => {


        const email = profile.emails[0].value;
        const nome=profile.displayName;

       
        console.log("passport callback function");
        console.log(nome,email);
    })
);
