// routes.js
const express = require('express');
const session = require('express-session');
const router = express.Router();
const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'progettolab7@gmail.com',
    pass: 'tunzkwebkqwzvrel'
  }
});


const mailOptions = {
    from: "progettolab7@gmail.com", // L'indirizzo email da cui invii l'email (stesso dell'auth user)
    to: "progettolab7@gmail.com",
    subject: 'Benvenuto al nostro sito!',
    text: 'Grazie per esserti iscritto al nostro sito. Benvenuto!',
  };






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
      req.session.temporaryMessage = "Registered"; // Cambia il messaggio come preferisci

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
    await inserisciLogin(req.body.email,req.body.password,req); //query 1
    req.session.loggedIn=true;
    req.session.firstTime=true;
    await inserisciPreferiti(req.body.email,req);
    return res.redirect('/index.html');
  }
  catch(err){
    var errore= err.stack;
    console.log('errore '+err);
    if(errore.includes('mail non trovata')){
      console.log("funziona");
      req.session.temporaryMessage="emailnontrovata";
    }
    if(errore.includes("password errata")){
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
  }
  if(req.session.loggedIn){
    loggedIn=req.session.loggedIn;
  }
  return res.json({firstTime,loggedIn});
});

router.get('/get-data', (req, res) => {
  const loggedIn=req.session.loggedIn;
  if(loggedIn && req.session.firstTime){
    const nome=req.session.nome;
    const email=req.session.email;
    const preferiti=req.session.preferiti;
    const preferitiposti=req.session.preferitiposti
    
    delete req.session.nome;
    delete req.session.firstTime;
    delete req.session.email;
    delete req.session.preferiti;
    delete req.session.preferitiposti;

    res.json({nome,email,preferiti,preferitiposti});
  }
});


router.post('/exit',async (req, res) => {
  console.log(req.body)
  try{
    await loadDb(JSON.parse(req.body.list),req.body.email,JSON.parse(req.body.list2));
    var done=true;
    delete req.session.loggedIn;
    return res.json({done});
  }
  catch(error){
    throw(error);
  }
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
//La registrazione dell'utente

  
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  
  try {
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
     console.log(error);
      } else {
        console.log('Email sent');
        // do something useful
      }
    });
    console.log("email sent");
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

//Login dell'utente
async function inserisciLogin(email,pw,req) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();

    const query = 'SELECT nome,password FROM Registrazioni WHERE email = $1';
    const values = [email];

    const result= await client.query(query,values);

    if (result.rows.length == 0){
      throw Error('mail non trovata');
    }
    const hpw= result.rows[0].password;
    var name=result.rows[0].nome;
    var pwerrata=false;
    await comparePasswords(pw, hpw)
    .then((result) => {
    if (result) {
      req.session.nome=name;
      console.log("Stampa del login "+req.session.nome);
      req.session.email=email;
      console.log('Password corretta. Accesso consentito.');
    } else {
      console.log('Password errata. Accesso negato.');
      pwerrata=true;   
    }

  })
  .catch((error) => {
    throw error;
  });
  if(pwerrata) throw Error("password errata");
  }
  catch(err){
    throw err;
  }
  finally{
    await client.end();
  }
}


//Funzione per generare una password random
function generateRandomPassword(length) {
  // Lunghezza della password da generare
  const passwordLength = length || 16;

  // Genera un buffer casuale per la password
  const buffer = crypto.randomBytes(passwordLength);

  // Converti il buffer in una stringa esadecimale
  const password = buffer.toString('hex');

  return password;
}

async function inserisciPreferiti(email,req) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();

    const query = 'SELECT marker_id,places FROM preferiti WHERE email = $1';
    const values = [email];

    req.session.preferiti=[];
    req.session.preferitiposti=[];
    const result= await client.query(query,values);

    result.rows.forEach((row)=>{
      req.session.preferiti.push(row.marker_id);
      req.session.preferitiposti.push(row.places);
    });
  }
  catch(err){
    throw err;
  }
  finally{
    await client.end();
  }
}

async function comparePasswords(pw, hpw) {
  try {
    const result = await bcrypt.compare(pw, hpw);
    return result;
  } catch (error) {
    // Gestisci l'errore come desideri, ad esempio registrandolo o lanciando un'eccezione
    console.error('Errore durante il confronto dell\'hash:', error);
    throw error; // Puoi anche lanciare un'eccezione per indicare un errore
  }
}

async function loadDb(markerlist,email,placelist){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();

    const query = 'DELETE FROM preferiti WHERE email = $1';
    const value = [email];
    await client.query(query,value);
    var i=0;
    while(i<markerlist.length){
      let marker=markerlist[i];
      let place=placelist[i];
      const values=[email,marker,place];
      query2="INSERT INTO Preferiti(email,marker_id,places) VALUES ($1, $2, $3)";
      await client.query(query2,values);
      i++;
    }
  }
  catch(err){
    throw err;
  }
  finally{
    await client.end();
  }
}