//Prendo nota della pagina iniziale
var thispage=1;
//Prendo i pulsanti successivo e precedente
var precedente= document.getElementById('precedente');
var successivo= document.getElementById('successivo');
document.addEventListener("DOMContentLoaded", function(event) {
    fetch('/getUsers', {
        method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
      })
      .then(response => response.json())
      .then(async data => {
        if(data.done==true){
            var utenti=data.users;
            console.log(utenti);
            localStorage.setItem("Utenti",JSON.stringify(utenti));
            init();
        }
        else{
          window.location.href="http://localhost:8000/index.html";
        }
      })
      .catch(error => {
        console.error('Errore:', error);
      });
});


//La funzione init viene chiamata a inizio a pagina, quando si cambia pagina e quando viene eliminato un elemento e il numero di pagine diminuisce
function init(){
precedente.style.display= 'none';
successivo.style.display= 'none';
azzeraCards();
const users= localStorage.getItem('Utenti');
const list = JSON.parse(users);
console.log(list);
var n=list.length;
if(n>0){
    //Ci sono dei preferiti quindi vanno aggiunti
    //Per prima cosa calcolo quante pagine ci saranno
    var MaxPage=Math.ceil(n/6);

    //Chiamo la funzione per settare la prima pagina e i pulsanti
    setCards(thispage,MaxPage,n);
    }
}
//Funzione per settare le cards
function setCards(page,MaxPage,n) {
    if(MaxPage>1){
        switch(page){ //Lo switch controlla la pagina in cui ci troviamo perchè se è l'ultima mostra solo il tasto precedente, se è la prima solo il tasto successivo o di default mostra entrambi i pulsanti
            case 1:
                precedente.style.display= 'none';
                successivo.style.display= 'block';
                break;
            case MaxPage:
                precedente.style.display= 'block';
                successivo.style.display= 'none';
                break;
            default:
                precedente.style.display= 'block';
                successivo.style.display= 'block';
                break;
        }
    }
    //Prendo il nome del posto e il link per accedere alla pagina in cui si trova
    const Stringlist = localStorage.getItem('Utenti');
    const users = JSON.parse(Stringlist);
    //X indica le 6 sezioni delle cards mentre con i calcoliamo l'indice delle liste da cui prendiamo i dati
    var x=0;
    var sezioni = document.querySelectorAll('.container section');
    for(i=6*(page-1);i<6*page;i++){
        if(i<n){
            var titoloCard = sezioni[x].querySelector('.card-title');
            var textCard = sezioni[x].querySelector('.card-text');
            var linkTextCard = sezioni[x].querySelector('.card-link a:nth-child(1)');
            var linkTextCard2 = sezioni[x].querySelector('.card-link a:nth-child(2)');
            titoloCard.textContent = users[i].nome;
            linkTextCard2.textContent="Elimina Utente"
            textCard.textContent = "Registrazione confermata: "+users[i].confirmed;

            if(users[i].free){
              linkTextCard.textContent = "Blocca Utente";
            }
            else{
              linkTextCard.textContent = "Sblocca Utente";
            }
            linkTextCard.addEventListener('click', ban_or_pardon);
            linkTextCard.href=i;
            linkTextCard2.href=i;
            //Aggiungo un listener al link in modo tale da salvarmi l'id di tale municipio se l'utente dovesse cliccare sul link
            linkTextCard2.removeEventListener('click',addUser);
            linkTextCard2.addEventListener('click', getRidof);


        }
        x++;
        console.log(i);
    }
    console.log("Questa è la pagina "+thispage);
  }


//Funzione e listener per i pulsanti successivo e precedente
successivo.addEventListener("click", function(){
    azzeraCards();
    thispage++;
    init();
});
precedente.addEventListener("click", function(){
    azzeraCards();
    thispage--;
    init();
});
//Funzione che rende le carte 'vuote' prima di essere popolate
function azzeraCards(){
    var y=0;
    while (y<6) {
        let sezioni= document.querySelectorAll('.container section');
        sezioni[y].querySelector('.card-text').textContent = "Nessun utente presente";
        sezioni[y].querySelector('.card-title').textContent="";
        sezioni[y].querySelector('.card-link a:nth-child(1)').textContent="";
        sezioni[y].querySelector('.card-link a:nth-child(1)').href="";
        sezioni[y].querySelector('.card-link a:nth-child(1)').removeEventListener("click",ban_or_pardon);
        sezioni[y].querySelector('.card-link a:nth-child(2)').textContent="Aggiungi utente";
        sezioni[y].querySelector('.card-link a:nth-child(2)').href="";
        sezioni[y].querySelector('.card-link a:nth-child(2)').removeEventListener('click',getRidof);
        sezioni[y].querySelector('.card-link a:nth-child(2)').addEventListener('click',addUser);

        y++;
    }
}
//Funzione per portare l'utente alla pagina del luogo, non solo al municipio preciso ma aprirà anche tale luogo nella mappa

/*Funzione per eliminare il luogo dalle cards, prima ovviamente lo elimina dai localstorage e poi chiama init, facendo però un controllo 
se bisogna diminuire il numero della pagina corrente
*/
function getRidof(event) {
    event.preventDefault();
    const pos = this.href.replace(/^.*\//, ''); //Pos sarebbe la posizione esatta del luogo nei due localstorage
    const Stringlist = localStorage.getItem('Utenti');
    const users = JSON.parse(Stringlist);
    const n=users.length-1;
    var deleteduser= users.splice(pos,1);
    const email=deleteduser[0].email;
    const params = new URLSearchParams();
    params.append('email', email); // Aggiungi il nome del parametro (in questo caso, 'destinatario')
    fetch('/updateUser', {
      method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
      },
      body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
    })
    .then(response => response.json())
    .then(async data => {
      if(data.done){
        localStorage.setItem('Utenti',JSON.stringify(users));
        let MaxPage=Math.ceil(n/6);
        if (thispage>MaxPage)thispage--;//se è vera bisogna diminuire la pagina
        init();
      }
    })
    .catch(error => {
      console.error('Errore:', error);
    });
  }
function addUser(event){
    event.preventDefault();
    var nome;
    var password;
    var email;
    swal("Inserire il nome utente", {
      content: "input",
    })
    .then((value) => {
        if (value !== null && value.trim() !== "") { // Controllo se l'input non è nullo o vuoto
            nome = value;
            swal("Inserire l'email", {
                content: "input",
            })
            .then((value) => {
                    var StringList= localStorage.getItem("Utenti");
                    var users=JSON.parse(StringList);
                    var i;
                    var notpresent=true;
                    if(value !== null && value.trim() !== ""){
                      for(i=0;i<users.length;i++){
                        var utente=users[i];
                        if(utente.email==value.toLowerCase()||utente.email==value.toLowerCase()+"Google")notpresent=false;
                      }
                    }
                if (value !== null && value.trim() !== "" && notpresent) { // Controllo se l'input non è nullo o vuoto
                    var email = value;
                    swal("Inserire la password", {
                        content: "input",
                    })
                    .then((value) => {
                        if (value !== null) { // Controllo se l'input non è nullo
                            password = value;
                            console.log(nome, email, password);
                            addUserReq(nome,email,password);
                        } 
                        else {
                            // L'utente ha cliccato il tasto Annulla o l'input è vuoto
                            swal("Password non inserita", "La password è obbligatoria", "error");
                        }
                    });
                } else {
                    // L'utente ha cliccato il tasto Annulla o l'input è vuoto
                    if(notpresent){
                      swal("Email non inserita", "L'email è obbligatoria", "error");
                    }
                    else{
                      swal("Email già presente", "Provane un'altra", "error");
                    }
                  
                }
            });
        } else {
            // L'utente ha cliccato il tasto Annulla o l'input è vuoto
            swal("Nome utente non inserito", "Il nome utente è obbligatorio", "error");
        }
    });
}
function addUserReq(nome,email,password){
const params = new URLSearchParams();
params.append('email', email);
params.append('nome',nome);
params.append('password',password);

fetch('/addUser', {
  method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
  },
  body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
})
.then(response => response.json())
.then(async data => {
  if(data.done){
    location.reload();
  }
})
.catch(error => {
  console.error('Errore:', error);
});

}
function ban_or_pardon(event){ 
  event.preventDefault();
  const pos = this.href.replace(/^.*\//, ''); //Pos sarebbe la posizione esatta del luogo nei due localstorage
  const StringList=localStorage.getItem("Utenti");
  var utenti=JSON.parse(StringList);
  var email=utenti[pos].email;
  const params = new URLSearchParams();
  params.append('email', email); // Aggiungi il nome del parametro (in questo caso, 'destinatario')
  fetch('/ban_or_PardonUser', {
    method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
    },
    body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
  })
  .then(response => response.json())
  .then(async data => {
    if(data.done){
      utenti[pos].free=data.state;
      localStorage.setItem("Utenti",JSON.stringify(utenti));
      init();
    }
  })
  .catch(error => {
    swal("Errore", "Non è stato possibile bloccare/sbloccare l'utente", "error");
    console.error('Errore:', error);
  });



}
