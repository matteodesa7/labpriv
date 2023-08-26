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
    subject: '',
    text: '',
  };
const mailOptionsText='Grazie per esserti iscritto al nostro sito. Conferma la mail per accedere: http://localhost:8000/Login/conferma.html?destinatario=';
  
const mailOptions2 = {
    from: "progettolab7@gmail.com", // L'indirizzo email da cui invii l'email (stesso dell'auth user)
    to: "",
    subject: '',
    text: '',
  };
const mailOptions2Text='Reimposta la tua password a questo link: http://localhost:8000/Login/Reimpostapw.html?destinatario=';

const mailOptionsText3='Grazie per esserti iscritto al nostro sito. Scegli la tua password personale per confermare la registrazione: http://localhost:8000/Login/Reimpostapw.html?destinatario=';

const mailOptionsText4='Grazie per aver recensito il nostro sito! La recensione verrà pubblicata dopo adeguati controlli e riceverà una mail di conferma';



router.use(express.json());

router.use(express.urlencoded());

router.use(express.static('public'));

router.use(session({
  secret: generateRandomPassword(16), // Cambia con una stringa segreta
  resave: false,
  saveUninitialized: true
}));


// siamo in registrazione
router.post('/getApprovedReviews',async (req, res) => {
  try{
      var approvedReviews=[];
      approvedReviews=await getReviews();
      return res.json({approvedReviews});
  }
  catch(error){
    console.log(error.stack);
    return res.json({approvedReviews});
  }
});



router.post('/inserisciRecensioni',async (req, res) => {
  try{
      await sendReviews(req.body.nome,req.body.cognome,req.body.email,req.body.numero,req.body.recensione);
      return res.redirect("http://localhost:8000/elemnavbar/diconodinoi.html?state=true");
  }
  catch(error){
    var errore=error.stack;
    var state='false';
    if(errore.includes('recensioni_pkey')){
      state='primary';
    }
    console.log(errore);
    return res.redirect("http://localhost:8000/elemnavbar/diconodinoi.html?state="+state);
  }
});




router.post('/ban_or_PardonUser',async (req, res) => {
  try{
    if(req.session.admin){
      var hasGoogle=req.body.email.includes("Google");
      var state = await ban_pardonUser(req.body.email,hasGoogle);
      var done=true;
      return res.json({done,state});
    }
    var done=false;
    return res.json({done});

  }
  catch(error){
    var done=false;
    console.log(error.stack);
    return res.json({done});
  }
});


router.post('/addUser',async (req, res) => {
  try{
    if(req.session.admin){
      var Adminrequest=true;
      const hs = await createHash(req.body.password);
      await inserisciRegistrazione(req.body.nome,req.body.email,hs,Adminrequest);
      delete req.session.AdminRequested;
      var done=true;
      return res.json({done});
    }
    var done=false;
    return res.json({done});

  }
  catch(error){
    var done=false;
    console.log(error.stack);
    return res.json({done});
  }
});


router.post('/updateUser',async (req, res) => {
  try{
    if(req.session.admin){
      await deleteUser(req.body.email);
      var done=true;
      return res.json({done});
    }
    var done=false;
    return res.json({done});

  }
  catch(error){
    var done=false;
    console.log(error.stack);
    return res.json({done});
  }
});

router.post('/getUsers',async (req, res) => {
  try{
    if(req.session.admin){
      var users= await getUsers();
      var done=true;
      return res.json({done,users});
    }
    var done=false;
    return res.json({done});

  }
  catch(error){
    var done=false;
    console.log(error.stack);
    return res.json({done});
  }
});

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
      await inserisciRegistrazione(nome, email, hs , false);
      
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
try{
  const email = req.user.email+"Google";
  const nome=req.user.nome;
  await inserisciGoogle(email,nome);
  req.session.email=email;
  req.session.loggedIn=true;
  req.session.firstTime=true;
  req.session.nome=nome;
  await inserisciPreferiti(email,req);
  return res.redirect('/index.html');
}
catch(err){
  var error= err.stack;
  console.log(error);
  if(error.includes("bloccato")){
    req.session.temporaryMessage="blocked";
  }
  return res.redirect('/Login/Login.html');
}



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
    if(errore.includes("bloccato")){
      req.session.temporaryMessage = "blocked";
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
  try{
    var done=false;
    done=await checkEmail(req.body.destinatario,req.body.hpw,req.body.action); 
    return res.json({done});
  }
  catch(error){
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

router.post('/reset-password',async (req, res) => {
  try{
    var pw=req.body.password;
    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[^a-zA-Z0-9]/.test(pw)) {
      console.log("Errore di password");
      return res.redirect("/Login/Login.html");
    } 
    else {      
    // genero l'hash partendo dalla password
    const hs = await createHash(pw);
    var fromAdmin=false;
    if(req.body.fromAdmin=='true'){
      fromAdmin=true;
    }
    await updatePw(hs,req.body.email,fromAdmin);
    console.log("Password aggiornata");
    req.session.temporaryMessage="updatedPw";
    return res.redirect('/Login/Login.html');
    }
  
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
    const query = 'SELECT password FROM registrazioni WHERE email=$1';
    const values = [email];
    const result= await client.query(query,values);
    if(result.rows.length==0){
      throw Error("Email non presente");
    }
    var hs=result.rows[0].password;
    mailOptions2.subject='Richiesta di cambio password';
    mailOptions2.to=email;
    mailOptions2.text=mailOptions2Text+email+"&key="+hs+"AperitivoRomano";
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
async function checkEmail(email,hpw,action){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
    });

  try{
    var pureKey;
    var replace='';
    if(hpw.includes('Aperitivo')){
      replace="AperitivoRomano";
    }
    else if(hpw.includes('Admin')){
      replace="AdminRequest";
    }
    pureKey=hpw.replace(replace,'');


    await client.connect();
    const querymail='SELECT password FROM registrazioni where email=$1';
    const value=[email];
    var commonresult=await client.query(querymail,value);
    if(commonresult.rows.length==0){
      throw Error("Email non presente");
    }
    if(commonresult.rows[0].password!=pureKey){
      throw Error("Richiesta non riconosciuta");
    }
    if(action.includes("check")){
      const query = 'SELECT confirmed FROM registrazioni WHERE email=$1';
      const values = [email];
      const result= await client.query(query,values);
      if(result.rows[0].confirmed){
        throw Error("Verifica già effettuata");
      }
    }
    return true;
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
async function inserisciRegistrazione(nome, email, hs, Adminrequest){
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
    mailOptions.subject='Benvenuto nel nostro sito!';
    mailOptions.to=email;
    if(Adminrequest){
      mailOptions.text=mailOptionsText3+email+"&key="+hs+"AdminRequest";;
    }
    else{
      mailOptions.text=mailOptionsText+email+"&key="+hs+"AperitivoRomano";;
    }

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

    const query = 'SELECT nome,password,confirmed,free FROM Registrazioni WHERE email = $1';
    const values = [email];

    const result= await client.query(query,values);

    if (result.rows.length == 0){
      throw Error('mail non trovata');
    }
    const Confirmed= result.rows[0].confirmed;
    if(!Confirmed){
      throw Error("Email non confermata");
    }
    const Free=result.rows[0].free;
    if(!Free){
      throw Error("Utente bloccato");
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
    else{
    //accesso, controllo che l'utente non sia bloccato
      const statequery = 'SELECT free FROM Google WHERE email=$1';
      const values2= [email];
      const result2= await client.query(statequery,values2);
      var state=result2.rows[0].free;
      if(!state){
        throw Error("Account bloccato");
      }
    }
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
    const query = 'SELECT email FROM utentiprivilegiati WHERE email=$1';
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

async function getUsers(){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'SELECT nome,email,confirmed,free FROM registrazioni UNION SELECT nome,email,true as confirmed,free FROM google';
    const result= await client.query(query);
    // Creiamo un array per immagazzinare i risultati
    const usersArray = [];
    // Iteriamo attraverso ogni riga restituita dalla query e la inseriamo nell'array
    for (const row of result.rows) {
          usersArray.push(row);
    }
    return usersArray;
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

async function deleteUser(email){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    var place="registrazioni";
    if(email.includes("Google")){
      place="google";
    }
    const query = 'DELETE FROM '+place+' WHERE email=$1';
    const values=[email];
    await client.query(query,values);
    const query2 = 'DELETE FROM preferiti WHERE email=$1';
    await client.query(query2,values);

  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

async function ban_pardonUser(email,hasGoogle){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    var place="registrazioni";
    if(hasGoogle){
      place="google";
    }
    const query = 'UPDATE '+place+' SET free=NOT free WHERE email=$1';
    const values=[email];
    await client.query(query,values);
    const statequery = 'SELECT free FROM '+place+' WHERE email=$1';
    const result= await client.query(statequery,values);
    var state=result.rows[0].free;
    return state;
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

async function updatePw(pw,email,fromAdmin){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'UPDATE registrazioni SET password=$1 WHERE email=$2';
    const values=[pw,email];
    await client.query(query,values);
    if(fromAdmin){
      const query = 'UPDATE registrazioni SET confirmed=true WHERE email=$1';
      const values=[email];
      await client.query(query,values);
    }
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

 async function sendReviews(nome,cognome,email,numero,recensione){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'INSERT INTO recensioni(nome, cognome, email ,telefono ,recensione) VALUES ($1, $2, $3, $4, $5)';
    const values=[nome,cognome,email,numero,recensione];
    await client.query(query,values);
    //Invio email di ricevuta recensione
    mailOptions.subject="Recensione AperitivoRomano";
    mailOptions.to=email;
    mailOptions.text=mailOptionsText4;
    transporter.sendMail(mailOptions, function(error, info){
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

 async function getReviews(){
  const client = new Client({
    user: 'postgres',
    host: 'localhost', 
    database: 'Registrazioni',
    password: 'lallacommit',
    port: 5432, // La porta di default per PostgreSQL è 5432
  });

  try{
    await client.connect();
    const query = 'SELECT nome as title,recensione as text FROM recensioni WHERE approved=true';
    var result= await client.query(query);
    const array=result.rows;
    return array;
  }
  catch (err) {
    throw err;
  } finally {
    await client.end();
  }
 }