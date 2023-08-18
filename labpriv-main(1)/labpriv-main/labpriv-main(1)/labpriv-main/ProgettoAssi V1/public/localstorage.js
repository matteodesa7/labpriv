document.addEventListener("DOMContentLoaded", function(event) {
    // Effettua una richiesta al server per ottenere il temporary message
    fetch('/get-access')
    .then(response => response.json())
    .then(async data => {
      console.log(data);
      const firstTime=data.firstTime;
      const loggedIn=data.loggedIn;
      if(loggedIn){
        localStorage.setItem('loggedIn', true);
        if(firstTime){
          localStorage.setItem('loggedIn','firstTime');
          await retrieveData(); //richiesta fetch per ottenere i dati delle scorse sessioni
        }
      }
    })
    .catch(error => {
      console.error('Errore:', error);
    });
    checkLoggedIn();
});
//Prendo il nome preciso della pagina in cui mi trovo per effettuare ulteriori controlli nelle varie funzioni qui presenti
var pathname = window.location.pathname;  
var pageName = pathname.split('/').pop(); 
//Funzione per controllare il login
function checkLoggedIn() {
    var loggedIn = localStorage.getItem("loggedIn");
    if (loggedIn !== null) {
      var navLinks = document.querySelectorAll('.nav-link'); //Prendo i navlinks che sono presenti in tutte le pagine per settare e rendere visibili alcuni pulsanti
      //setto il nome e rendo visibile la tendina dei preferiti
      var dropdownButton = document.getElementById("dropdownMenuButton");
      const nome= localStorage.getItem('nomeUtente');
      dropdownButton.textContent = nome;
      var dropdownButton = document.getElementById("dropdownMenuButton");
      dropdownButton.style.display = "block";
      var dropdownItems = document.querySelectorAll(".dropdown-item");
      dropdownItems[1].addEventListener("click",Exit);//Aggiungo la funzione d'uscita
      if(pageName=="favourite.html"){ //  Questo controllo serve a non far apparire il pulsante per raggiungere la pagina dei preferiti se già sei all'interno di essa
        var preferiti=dropdownItems[0];
        preferiti.style.display="none";
      }
      //Controllo se è stato appena effettuato il login, in caso positivo mando un messaggio all'utente di benvenuto
      if(loggedIn=='firstTime'){
        swal({
          title: 'Buon Aperitivo '+nome+'!',
          text: 'Speriamo di aiutarti a trovare il tuo posto preferito :)',
          ButtonText: 'OK'
        });
        localStorage.setItem('loggedIn', true);
      }
    } 
    else {
      // l'item "loggedIn" non esiste nel localStorage aggiungo il pulsante per loggare
      var navLinks = document.querySelectorAll('.nav-link'); 
      navLinks[0].insertAdjacentHTML('beforeend', "<i class='fa-regular fa-user fa-2xl'></i>");
      navLinks[0].setAttribute('href', '/Login/Login.html');
      console.log(navLinks);
    }
  }
//Funzione per effettura il logout, prende tutti i dati necessari da salvare e li manda via fetch e poi elimina tutti ciò che è stato salvato nel localstorage sulla sessione dell'utente
function Exit() {
    const Stringlist = localStorage.getItem('preferiti');
    const list = JSON.parse(Stringlist);
    const email = localStorage.getItem('email');
    const Stringlist2 = localStorage.getItem('preferitiposti');
    const list2 = JSON.parse(Stringlist2);

    const params = new URLSearchParams();
    params.append('list', JSON.stringify(list));
    params.append('email', email);
    params.append('list2',JSON.stringify(list2));

    fetch('/exit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })
    .then(response => {
      if (response.ok) {
        console.log('La richiesta è stata inviata con successo!');
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('email');
        localStorage.removeItem('preferiti');
        localStorage.removeItem('preferitiposti');
        localStorage.removeItem("nomeUtente");
        //controllo se sono nella pagina dei preferiti
        if(pageName=="favourite.html"){
          window.location.href = "../index.html";
        }
        else{
          location.reload();
        }
      } else {
        console.error('Si è verificato un errore durante l\'invio della richiesta:', response.statusText);
      }
    })
    .catch(error => {
      console.error('Si è verificato un errore durante l\'invio della richiesta:', error);
    });
}

function retrieveData(){
  fetch('/get-data')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    const nome=data.nome;
    const email=data.email;
    const preferiti=JSON.stringify(data.preferiti);
    const preferitiposti=JSON.stringify(data.preferitiposti);

    localStorage.setItem('nomeUtente',nome);
    localStorage.setItem('email',email);
    localStorage.setItem('preferiti', preferiti);
    localStorage.setItem('preferitiposti', preferitiposti);
    location.reload();
  })
  .catch(error => {
    console.error('Errore:', error);
  });
}
  const socket = new WebSocket('ws://localhost:8000');

  socket.onmessage =async  (event) => {
    console.log(`Messaggio ricevuto dal server: ${event.data}`);
    if(event.data=="Chiusura server"){
      await localStorage.clear();
      window.location.href = "https://www.example.com/";
    }
  };
