const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const keys = require('./keys');
const bcrypt=require('bcrypt');


const user = {
    email: "",
    nome: ""
  };
passport.serializeUser((user,done)=>{
    done(null,user.nome,user.email);
});
passport.use(
    new GoogleStrategy({
        // L'URL a cui verrai reindirizzato dopo l'autenticazione
        callbackURL: "/auth/google/redirect",
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret
    }, (accessToken,refreshToken,profile,done) => {


        const email = profile.emails[0].value;
        const nome=profile.displayName;
        
        user.email=email;
        user.nome=nome;


        done(null,user);
    })
);
