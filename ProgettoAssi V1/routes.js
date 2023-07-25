// routes.js
const express = require('express');
const session = require('express-session');
const router = express.Router();
const { Client } = require('pg');

router.use(express.json());

router.use(express.urlencoded());

router.use(express.static('public'));

router.use(session({
  secret: 'il_tuo_segreto_per_le_sessioni', // Cambia con una stringa segreta
  resave: false,
  saveUninitialized: true
}));

const bcrypt = require('bcrypt');


// siamo in registrazione
router.post('/redirect', async (req, res) => {
  console.log(req.body);
  let nome = req.body.nome;
  let email = req.body.email;
  let pw = req.body.password;
  
  if(nome.length==0){
    req.session.temporaryMessage = "noName";
    return res.redirect("/Login/Login.html");
  }
  if(!isValidEmail(email)){
    req.session.temporaryMessage = "noMail";
    return res.redirect("/Login/Login.html");
  }
  if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[^a-zA-Z0-9]/.test(pw)) {
    req.session.temporaryMessage = "badPass";
    return res.redirect("/Login/Login.html");
  } else {
    try {
      // genero l'hash partendo dalla password
      const hs = await createHash(pw);
      console.log('Hash: %s', hs);

      // verifico se la password coincide con l'hash
      //const valid = await verifyHash(pw, hs)
      //console.log('Valid: %s', valid);    // true

      // Qui inserisci il codice per inserire la registrazione nel database
      await inserisciRegistrazione(nome, email, hs);
      
      // Imposta una variabile di sessione temporanea
      req.session.temporaryMessage = "Grazie per esserti registrato!"; // Cambia il messaggio come preferisci

      // Effettua la redirect a /Login/Login.html
      return res.redirect('/Login/Login.html');
    } catch (err) {
      var errore= err.stack;
      if(errore.includes('registrazioni_pkey')){
        req.session.temporaryMessage = "primary";
      }
      else{
        req.session.temporaryMessage = "false";
      }
      console.error('Errore durante l\'inserimento:', err.stack);
      return res.redirect("/Login/Login.html");
    }
  }
});
router.get('/redirect', (req, res) => {
  // Effettua la redirect a /index.html
  res.redirect('/index.html');
});

router.get('/get-temporary-message', (req, res) => {
  const temporaryMessage = req.session.temporaryMessage;
  delete req.session.temporaryMessage;
  res.json({ temporaryMessage });
});
module.exports = router;



const createHash = async (plainText) => {
  const saltRounds = 10;

  const hash = await bcrypt.hash(plainText, saltRounds);

  return hash;
};



//funzioni varie
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function inserisciRegistrazione(nome, email, hs) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try {
    await client.connect();

    const query = `INSERT INTO Registrazioni(Nome, Email, Password) VALUES ($1, $2, $3)`;
    const values = [nome, email, hs];

    await client.query(query, values);
    console.log('Registrazione inserita con successo!');
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}