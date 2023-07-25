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
router.post('/redirect', (req, res) => {
  
  // Qui inserisci la logica dell'handler per la richiesta POST
  console.log(req.body);
  let nome=req.body.nome;
  let email=req.body.email;
  let pw=req.body.pw;
  if (pw.length < 8 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(pw)) {
    req.session.temporaryMessage="badPass";
    res.redirect("/Login/Login.html");

   
  }
  else{
    
    (async()=>{
      // genero l'hash partendo dalla password
    const hs = await createHash(pw);
    console.log('Hash: %s', hs);

    // verifico se la passweord coincide con l'hash
    //const valid = await verifyHash(pw, hs)
    //console.log('Valid: %s', valid);    // true
  })
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });
  client.connect();
  async function inserisciRegistrazione(nome, email, hs) {
    try {
      await client.connect();
  
      const query = `INSERT INTO Registrazioni(Nome, Email, Password) VALUES ($1, $2, $3)`;
      const values = [nome, email, hs];
  
      await client.query(query, values);
      console.log('Registrazione inserita con successo!');
    } catch (err) {
      console.error('Errore durante l\'inserimento:', err.stack);
      req.session.temporaryMessage="false";
      res.redirect("/Login/Login.html");
    } finally {
      await client.end();
    }
  }
  //fine registrazione
  

}


  // Imposta una variabile di sessione temporanea
  req.session.temporaryMessage = "Grazie per esserti registrato!"; // Cambia il messaggio come preferisci

  // Effettua la redirect a /Login/Login.html
  res.redirect('/Login/Login.html');
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