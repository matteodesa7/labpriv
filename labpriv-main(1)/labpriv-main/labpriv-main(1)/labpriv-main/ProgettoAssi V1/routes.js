// routes.js
const express = require('express');
const session = require('express-session');
const router = express.Router();
const { Client } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const passport=require('passport');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'progettolab7@gmail.com',
    pass: 'tunzkwebkqwzvrel'
  }
});


const mailOptions = {
    from: "progettolab7@gmail.com", // L'indirizzo email da cui invii l'email (stesso dell'auth user)
    to: "",
    subject: 'Benvenuto al nostro sito!',
    text: '',
  };
const mailOptionsText='Grazie per esserti iscritto al nostro sito. Conferma la mail per accedere: http://localhost:8000/Login/conferma.html?destinatario=';
  
const mailOptions2 = {
    from: "progettolab7@gmail.com", // L'indirizzo email da cui invii l'email (stesso dell'auth user)
    to: "",
    subject: 'Reimposta la tua password',
    text: '',
  };
const mailOptions2Text='Reimposta la tua password a questo link: http://localhost:8000/Login/Reimpostapw.html?destinatario=';




router.use(express.json());

router.use(express.urlencoded());

router.use(express.static('public'));

router.use(session({
  secret: generateRandomPassword(16), // Cambia con una stringa segreta
  resave: false,
  saveUninitialized: true
}));


// siamo in registrazione
router.post('/adminverify',async (req, res) => {
  console.log(req.body);
  try{
    await verificaMailAdmin(req.body.email);
    var done=true;
    return res.json({done});

  }
  catch(error){
    var done=false;
    console.log(error.stack);
    return res.json({done});
  }
});

router.post('/verifyAdminToken',async (req, res) => {
  console.log(req.body.token);
  try{
    await verificaTokenAdmin(req.body.email,req.body.token);
    var done=true;
    req.session.admin=true;
    return res.json({done});

  }
  catch(error){
    var done=false;
    console.log(error.stack);
    return res.json({done});
  }
});

router.post('/verifyAdmin',async (req, res) => {
  var Admin=req.session.admin;
  var done=false;
  if(Admin==true){
    done=true;
    console.log("Si è un admin");
  }
  return res.json({done});
});

router.post('/blockGoogle',async (req, res) => {
  req.session.google="blocked";
  done=true;
  return res.json({done});
});

router.post('/unblockGoogle',async (req, res) => {
  delete req.session.google;
  done=true;
  return res.json({done});
});

router.post('/checkGoogle',async (req, res) => {
  var done=false;
  if(req.session.google){
    done=true;
  }
  return res.json({done});
});


router.post('/receiveSuggestion',async(req,res)=>{
  console.log(req.body);
  try{
    var place=req.body.place.toLowerCase();
    var zone= req.body.zone.toLowerCase();
    await inserisciConsigliati(place,zone,req.body.email);
    return res.redirect("/elemnavbar/contattaci.html?sent=true");
  }
  catch(err){
    var queryErr; 
    var errore=err.stack;
    if(errore.includes('consigliati_pkey')){
      queryErr="primary";

    }
    else{
      queryErr="false";
    }
    console.log(errore);
    return res.redirect("/elemnavbar/contattaci.html?sent="+queryErr);

  }
 
});
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
      req.session.temporaryMessage = "tobeConfirmed"; // Cambia il messaggio come preferisci

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

router.get('/auth/google/redirect',passport.authenticate('google'),async (req, res) => {
const email = req.user.email+"Google";
const nome=req.user.nome;
await inserisciGoogle(email,nome);
req.session.email=email;
req.session.loggedIn=true;
req.session.firstTime=true;
req.session.nome=nome;
await inserisciPreferiti(email,req);
return res.redirect('/index.html');
// Controllare che l'utente che sia già registrato:
//caso registrato: accesso
//caso non registrato: registrazione+accesso
//p.s. con accesso si intende settaggio dei preferiti tramite funzione già esistente
//redirect all'index dopo aver settato tutte le variabili di sessione


});

router.get('/google',passport.authenticate('google',{
  scope:['profile','email']
}));


router.get('/get-temporary-messages', (req, res) => {
  const temporaryMessage = req.session.temporaryMessage;
  delete req.session.temporaryMessage;
  res.json({ temporaryMessage});
});

router.post('/access', async (req, res) => {
  try{
    await inserisciLogin(req.body.email,req.body.password,req); //query 1
    req.session.loggedIn=true;
    req.session.firstTime=true;
    await inserisciPreferiti(req.body.email,req);
    return res.redirect('/index.html');
  }
  catch(err){
    var errore= err.stack;
    console.log(err);
    if(errore.includes('mail non trovata')){
      req.session.temporaryMessage="emailnontrovata";
    }
    if(errore.includes("password errata")){
      req.session.temporaryMessage="passerrata";
    }
    if(errore.includes("Email non confermata")){
      req.session.temporaryMessage = "notConfirmed";
    }
    console.log(req.session.temporaryMessage);
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
    delete req.session.admin;
    return res.json({done});
  }
  catch(error){
    throw(error);
  }
});

router.post('/confirmemail',async (req, res) => {
  console.log(req.body)
  try{
    await confirmEmail(req.body.destinatario);
    var done=true;
    return res.json({done});
  }
  catch(error){
    throw(error);
  }
});


router.post('/checkemail',async (req, res) => {
  console.log(req.body)
  try{
    var done;
    await checkEmail(req.body.destinatario);
    done=true;
    return res.json({done});
  }
  catch(error){
    done=false;
    return res.json({done});
  }
});
router.post('/recuperoPass',async (req, res) => {
  try{
    await changePassReq(req.body.email);
    req.session.temporaryMessage="recPwS";
    return res.redirect('/Login/Login.html');
  }
  catch(error){
    req.session.temporaryMessage="recPwNS";
    return res.redirect('/Login/Login.html');
  }
});







module.exports = router;






//funzioni varie
async function changePassReq(email){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'SELECT confirmed FROM registrazioni WHERE email=$1';
    const values = [email];
    const result= await client.query(query,values);
    if(result.rows.length==0){
      throw Error("Email non presente");
    }
    mailOptions2.to=email;
    mailOptions2.text=mailOptions2Text+email;
    transporter.sendMail(mailOptions2, function(error, info){
      if (error) {
     console.log(error);
      } else {
        console.log('Email sent');
      }
    });
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}
async function checkEmail(email){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'SELECT confirmed FROM registrazioni WHERE email=$1';
    const values = [email];
    const result= await client.query(query,values);
    if(result.rows.length==0){
      throw Error("Email non presente");
    }
    else if(result.rows[0].confirmed){
      throw Error("Verifica già effettuata");
    }
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}


async function confirmEmail(email){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'UPDATE registrazioni SET confirmed=true WHERE email=$1';
    const values = [email];
    const result= await client.query(query,values);
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}







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
async function inserisciRegistrazione(nome, email, hs){
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
    mailOptions.to=email;
    mailOptions.text=mailOptionsText+email;
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
     console.log(error);
      } else {
        console.log('Email sent');
      }
    });
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
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

    const query = 'SELECT nome,password,confirmed FROM Registrazioni WHERE email = $1';
    const values = [email];

    const result= await client.query(query,values);

    if (result.rows.length == 0){
      throw Error('mail non trovata');
    }
    const Confirmed= result.rows[0].confirmed;
    if(!Confirmed){
      throw Error("Email non confermata");
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


//registrazione/login dell'utente da google
async function inserisciGoogle(email,name) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();

    const query = 'SELECT email FROM Google WHERE email = $1';
    const values = [email];

    const result= await client.query(query,values);

    if (result.rows.length == 0){
      //registrazione
      const query = 'INSERT INTO Google(nome, email) VALUES ($1, $2)';
      const values = [name,email];
      await client.query(query,values);
      console.log("Utente Registrato: "+name);
    }
    //accesso
    console.log("Utente già registrato, effettuare solo il Login");
  }
  catch(err){
    throw err;
  }
  finally{
    await client.end();
  }
}

async function inserisciConsigliati(place,zone,email){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });
  try{
    await client.connect();

    const query = 'INSERT INTO Consigliati(nome, zona, email) VALUES ($1, $2, $3)';
    const values = [place,zone,email];
    console.log("Adesso inserisco i consigliati");
    await client.query(query,values);
    console.log("Consigliati inseriti con successo!");
  }
  catch(err){
    throw err;
  }
  finally{
    await client.end();
  }

}

async function verificaMailAdmin(email){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'SELECT email FROM registrazioni WHERE email=$1';
    const values = [email];
    const result= await client.query(query,values);
    if(result.rows.length==0){
      throw Error("Email non presente");
    }
    //Email presente possibile utente
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}
async function verificaTokenAdmin(email,token){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'SELECT token FROM utentiprivilegiati WHERE email=$1';
    const values = [email];
    const result= await client.query(query,values);
    if(result.rows.length==0){
      throw Error("Email non presente");
    }
    hashedToken= result.rows[0].token;
    var pwerrata=false;
    await comparePasswords(token, hashedToken)
    .then((result) => {
    if (result) {
      console.log('Password corretta. Accesso consentito.');
    } else {
      console.log('Password errata. Accesso negato.');
      pwerrata=true;   
    }
   })
   if(pwerrata) throw Error("password errata");
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}