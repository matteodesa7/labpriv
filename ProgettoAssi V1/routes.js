// routes.js
const express = require('express');
const session = require('express-session');
const router = express.Router();
const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  service: 'gmail', // Utilizziamo il servizio Gmail
  auth: {
    user: 'progettolab7@gmail.com', // Inserisci qui l'indirizzo email da cui inviare le email
    pass: 'vvrslumzimlcfjfv', // Inserisci qui la password dell'account email
  }
});

function inviaEmailDiBenvenuto(destinatario) {
  const mailOptions = {
    from: 'progettolab7@gmail.com', // L'indirizzo email da cui invii l'email (stesso dell'auth user)
    to: destinatario,
    subject: 'Benvenuto al nostro sito!',
    text: 'Grazie per esserti iscritto al nostro sito. Benvenuto!',
  };
}





router.use(express.json());

router.use(express.urlencoded());

router.use(express.static('public'));

router.use(session({
  secret: generateRandomPassword(16), // Cambia con una stringa segreta
  resave: false,
  saveUninitialized: true
}));


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

router.get('/get-temporary-messages', (req, res) => {
  const temporaryMessage = req.session.temporaryMessage;
  delete req.session.temporaryMessage;
  res.json({ temporaryMessage});
});
router.post('/access', async (req, res) => {
  console.log(req.body);
  try{
    await inserisciLogin(req.body.email,req.body.password); //query 1
    req.session.loggedIn=true;
    //primo login temporarymessage
    req.session.firstTime=true;

    //await query 2
    //localstorage del nome

    //await query 3
    //localstorage dei preferiti 

    //await query 4
    //localstorage dei preferitiposti

 

    return res.redirect('/index.html');
  }
  catch(err){
    var errore= err.stack;
    console.log('errore '+err);
    if(errore.includes('mail non trovata')){
      console.log("funziona");
      req.session.temporaryMessage="emailnontrovata";
    }
    else if(errore.includes('password errata')){
      req.session.temporaryMessage="passerrata";
    }
    return res.redirect('/Login/Login.html');
  }




});
router.get('/access', (req, res) => {
    // Effettua la redirect a /index.html
    res.redirect('/index.html');
});


router.get('/get-access', (req, res) => {
  var firstTime=false;
  var loggedIn=false;
  if(req.session.firstTime){
    firstTime= req.session.firstTime;
    delete req.session.firstTime;
  }
  if(req.session.loggedIn){
    loggedIn=req.session.loggedIn;
  }
  return res.json({firstTime,loggedIn});
});


module.exports = router;






//funzioni varie
const createHash = async (plainText) => {
  const saltRounds = 10;

  const hash = await bcrypt.hash(plainText, saltRounds);

  return hash;
};

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
    inviaEmailDiBenvenuto(email);
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}
async function inserisciLogin(email,pw) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();

    const query = 'SELECT password FROM Registrazioni WHERE email = $1';
    const values = [email];

    const result= await client.query(query,values);

    if (result.rows.length == 0){
      throw Error('mail non trovata');
    }
    const hpw= result.rows[0].password;

    bcrypt.compare(pw, hpw, (err, result) => {
      if (err) {
        // Si è verificato un errore durante il confronto
        console.error('Errore durante il confronto dell\'hash:', err);
      } else {
        // `result` è il risultato del confronto (true o false)
        if (result) {
          // I due hash corrispondono, la password è corretta
          console.log('Password corretta. Accesso consentito.');
        } else {
          // I due hash non corrispondono, la password è errata
          console.log('Password errata. Accesso negato.');
          throw Error('password errata');
        }
      }
    });
  }
  catch(err){
    throw err;
  }
  finally{
    await client.end();
  }
}



function generateRandomPassword(length) {
  // Lunghezza della password da generare
  const passwordLength = length || 16;

  // Genera un buffer casuale per la password
  const buffer = crypto.randomBytes(passwordLength);

  // Converti il buffer in una stringa esadecimale
  const password = buffer.toString('hex');

  return password;
}
