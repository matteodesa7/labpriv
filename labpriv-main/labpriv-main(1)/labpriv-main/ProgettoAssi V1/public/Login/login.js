//Variabili che servono per cambiare la pagina da registrati ad accedi e viceversa
let signupBtn= document.getElementById("signupBtn")
let signinBtn= document.getElementById("signinBtn")
let nameField= document.getElementById("nameField")
let passField= document.getElementById("passField")
let forgotPasswordButton= document.getElementById("reset-password-link")
let testoPass=document.getElementById("TestoPass");
let title= document.getElementById("title")
//Variabile che mi serve per ricordare in quale pagina ci si tovasse prima di effettuare il login
const pagina_di_riferimento = document.referrer.replace(/^.*?\/\/[^\/]+(\/.*)$/, "$1");

//funzioni per cambiare da registrazione ad accesso e viceversa
signinBtn.onclick = function(){
    if(!(signinBtn.classList.contains("disable"))){
        console.log("Effettui l'accesso");
        signinBtn.setAttribute("type", "submit");
        if(passField.style.maxHeight != "0px"){
          document.getElementById("login-form").setAttribute("action", "/access");
        }
        else{
          document.getElementById("login-form").setAttribute("action", "/recuperoPass");
        }

    }
    else{
        nameField.style.maxHeight= "0";
        title.innerHTML= "Accedi";
        signupBtn.classList.add("disable");
        signinBtn.classList.remove("disable");
        signupBtn.setAttribute("type", "button");
    }
}
signupBtn.onclick = function(){
    if(!(signupBtn.classList.contains("disable"))){
        console.log("Effettui la registrazione");

        signupBtn.setAttribute("type", "submit");
       
        if(passField.style.maxHeight != "0px"){
          document.getElementById("login-form").setAttribute("action", "/redirect");
        }
        else{
          document.getElementById("login-form").setAttribute("action", "/recuperoPass");
        }
    }
    else{
        nameField.style.maxHeight= "60px";
        title.innerHTML= "Registrati";
        signupBtn.classList.remove("disable");
        signinBtn.classList.add("disable");
        signinBtn.setAttribute("type", "button");
    }
}
//Al caricamento della pagina controlla se vi è stata una registrazione scorretta o un login scorretto
document.addEventListener('DOMContentLoaded', function () {
  // Effettua una richiesta al server per ottenere il temporary message
  fetch('/get-temporary-messages')
    .then(response => response.json())
    .then(data => {
      const temporaryMessage = data.temporaryMessage;
      if (temporaryMessage) {
        // Usa il temporary message come preferisci, ad esempio mostrandolo all'utente
        console.log("Messaggio temporaneo: "+temporaryMessage);
        
        if(temporaryMessage=="badPass"){
          localStorage.setItem("Registered",'badpass');
        }
        else if(temporaryMessage=="false"){
          localStorage.setItem("Registered",false);
        }
        else if(temporaryMessage=="primary"){
          localStorage.setItem("Registered",'primary');
        }
        else if(temporaryMessage=="noName"){
          localStorage.setItem("Registered",'noName');
        }
        else if(temporaryMessage=="noMail"){
          localStorage.setItem("Registered",'noMail');
        }
        else if(temporaryMessage=="tobeConfirmed"){
          localStorage.setItem("Registered","tobeConfirmed");
        }
        else if(temporaryMessage=="notConfirmed"){
          localStorage.setItem("badLogin",'notConfirmed');
        }
        else if(temporaryMessage=="passerrata"){
          localStorage.setItem("badLogin","pass");
        }
        else if(temporaryMessage=="emailnontrovata"){
          localStorage.setItem("badLogin","email");
        }
        else if(temporaryMessage=="blocked"){
          localStorage.setItem("badLogin","blocked");
        }
        else if(temporaryMessage=='recPwS'){
          swal({
            title: 'Fatto',
            text: 'Controlla la tua mail per reimpostare la password',
            icon: 'success',
            ButtonText: 'OK',
          });
        }
        else if(temporaryMessage=='recPwNS'){
          swal({
            title: 'Attenzione',
            text: 'Non hai nessun account iscritto con questo indirizzo email',
            icon: 'warning',
            ButtonText: 'OK',
          })
        }
      }
      checkBadLogIn();
      checkRegistered();
      checkGoogle();
    })
    .catch(error => {
      console.error('Errore nella richiesta del temporary message:', error);
    });
});
//Funzione chiamata se esiste una registrazione non andata a buon fine, mostra una serie di popup e ricarica la pagina in cui si trova l'utente
function checkRegistered(){
  var Registered= localStorage.getItem("Registered");
  console.log("Stato di registrazione: "+Registered);
    switch(Registered){
      case 'tobeConfirmed':
        swal({
          title: 'Ci siamo quasi!',
          text: 'Conferma la tua mail per effettuare il primo login',
          icon: 'success',
          ButtonText: 'OK',
        }).then(() => {
          removeR();
        });
        break;
      case 'false':
        swal({
          title: 'Errore',
          text: 'La registrazione non è andata a buon fine',
          icon: 'error',
          ButtonText: 'OK',
        }).then(() => {
          removeR();
        });
        break;
      case 'primary':
        swal({
          title: 'Errore',
          text: 'Esiste già un account registrato con la mail che hai inserito',
          icon: 'error',
          ButtonText: 'OK',
        }).then(() => {
          removeR();
        });
        break;
      case 'badpass':
        swal({
          title: 'Errore',
          text: 'La password deve essere lunga almeno 8 caratteri e deve includere almeno un carattere maiuscolo e speciale',
          icon: 'error',
          ButtonText: 'OK',
        }).then(() => {
          removeR();
        });
        break;
      case 'noName':
          swal({
            title: 'Errore',
            text: 'Inserire il nome per proseguire',
            icon: 'error',
            ButtonText: 'OK',
          }).then(() => {
            removeR();
          });
          break;
      case 'noMail':
            swal({
              title: 'Errore',
              text: 'Inserire una mail corretta per proseguire',
              icon: 'error',
              ButtonText: 'OK',
            }).then(() => {
              removeR();
            });
          break; 
      case 'true':
            swal({
              title: 'Benvenuto',
              text: 'Adesso puoi effettuare il tuo primo accesso',
              icon: 'success',
              ButtonText: 'OK',
            }).then(() => {
              removeR();
            });
          break;   
      default:
        //utente non registrato
        break;
    }
}
//Funzione chiamata se esiste un login non andato a buon fine, mostra una serie di popup e ricarica la pagina in cui si trova l'utente
function checkBadLogIn(){
  var badLogin= localStorage.getItem('badLogin');
  console.log("Stato di badLogin: "+badLogin);
  switch(badLogin){
    case 'pass':
      swal({
        title: 'Errore',
        text: 'Password non corretta',
        icon: 'error',
        ButtonText: 'OK',
        }).then(() => {
          removeL();
        });
      break;
    case 'email':
      swal({
        title: 'Errore',
        text: 'Email non trovata',
        icon: 'error',
        ButtonText: 'OK',
        }).then(() => {
          removeL();
        });
     break;
    case 'notConfirmed':
          swal({
            title: 'Attenzione',
            text: 'Confermare la mail prima di accedere',
            icon: 'warning',
            ButtonText: 'OK',
          }).then(() => {
            removeL();
          }); 
    break;
    case 'blocked':
      swal({
        title: 'Accesso negato',
        text: 'Siamo spiacenti... risulta che questo account è stato bloccato',
        icon: 'warning',
        ButtonText: 'OK',
      }).then(() => {
        removeL();
      }); 
  }
}

//Funzioni utilizzate dopo la chiusura dei sweetalert
function removeR(){
  {
    localStorage.removeItem("Registered");
    window.location.href="/Login/Login.html";
  }
}
function removeL(){
  {
    localStorage.removeItem("badLogin");
    window.location.href="/Login/Login.html";
  }
}

forgotPasswordButton.addEventListener("click", function () {
  if(passField.style.maxHeight == "0px"){
    location.reload();
  }
  signinBtn.style.display='none';
  signupBtn.style.display='none';
  var pulsante
  if(!(signinBtn.classList.contains("disable"))){
    pulsante=signinBtn;
  }
  else{
    pulsante=signupBtn;
  }
  pulsante.textContent="Invia";
  pulsante.style.display='block';
  nameField.style.maxHeight= "0";
  passField.style.maxHeight= "0";
  title.innerHTML= "Recupero Password";
  forgotPasswordButton.textContent="Torna indietro";
  testoPass.innerHTML="Hai ricordato la password? ";
});

function checkGoogle(){
  fetch('/checkGoogle', {
    method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
  })
  .then(response => response.json())
  .then(async data => {
    var googleButton = document.createElement("button");
    googleButton.type = "button";
    googleButton.className = "login-with-google-btn";
    googleButton.textContent = "Accedi con Google";

    // Decidi se aggiungerlo normale o disabilitato
    var shouldDisable = true; // Cambia questo valore in base alla tua esigenza

    if(data.done==true){
      googleButton.disabled = true;
    }
    else{
      console.log("Pulsante google funzionante");
    }
    // Aggiungi il pulsante al contenitore
    var googleButtonContainer = document.getElementById("googleButtonContainer");
    googleButtonContainer.appendChild(googleButton);
  })
  .catch(error => {
    swal({
      title: 'Errore',
      icon: 'error',
      ButtonText: 'OK',
    });
    console.error('Errore:', error);
  });
}