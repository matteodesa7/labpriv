//Prendo nota della pagina iniziale
var thispage=1;
//Prendo i pulsanti successivo e precedente
var precedente= document.getElementById('precedente');
var successivo= document.getElementById('successivo');
document.addEventListener("DOMContentLoaded", function(event) {
    fetch('/getSugestions', {
        method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
      })
      .then(response => response.json())
      .then(async data => {
        if(data.done==true){
            var consigliati=data.sug;
            console.log(consigliati);
            localStorage.setItem("consigliati",JSON.stringify(consigliati));
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
const consigliati= localStorage.getItem('consigliati');
const list = JSON.parse(consigliati);
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
    const Stringlist = localStorage.getItem('consigliati');
    const consigliati = JSON.parse(Stringlist);
    //X indica le 6 sezioni delle cards mentre con i calcoliamo l'indice delle liste da cui prendiamo i dati
    var x=0;
    var sezioni = document.querySelectorAll('.container section');
    for(i=6*(page-1);i<6*page;i++){
        if(i<n){
            var titoloCard = sezioni[x].querySelector('.card-title');
            var textCard = sezioni[x].querySelector('.card-text');
            var linkTextCard = sezioni[x].querySelector('.card-link a:nth-child(1)');
            var linkTextCard2 = sezioni[x].querySelector('.card-link a:nth-child(2)');
            titoloCard.textContent = consigliati[i].nome;
            linkTextCard2.textContent="Elimina consigliato"
            textCard.textContent = "Locazione: "+consigliati[i].zona;

            linkTextCard.textContent = "Approva consigliato"
            linkTextCard.addEventListener('click', approveSugestion);
            linkTextCard.href=i;
            linkTextCard2.href=i;
            //Aggiungo un listener al link in modo tale da salvarmi l'id di tale municipio se l'utente dovesse cliccare sul link
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
        sezioni[y].querySelector('.card-text').textContent = "Nessun consigliato presente";
        sezioni[y].querySelector('.card-title').textContent="";
        sezioni[y].querySelector('.card-link a:nth-child(1)').textContent="";
        sezioni[y].querySelector('.card-link a:nth-child(1)').href="";
        sezioni[y].querySelector('.card-link a:nth-child(1)').removeEventListener("click",approveSugestion);
        sezioni[y].querySelector('.card-link a:nth-child(2)').href="";
        sezioni[y].querySelector('.card-link a:nth-child(2)').textContent="";
        sezioni[y].querySelector('.card-link a:nth-child(2)').removeEventListener('click',getRidof);

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
    const Stringlist = localStorage.getItem('consigliati');
    const consigliati = JSON.parse(Stringlist);
    const n=consigliati.length-1;
    var deletedsug= consigliati.splice(pos,1);
    const nome=deletedsug[0].nome;
    const zona=deletedsug[0].zona;
    const email=deletedsug[0].email;
    const params = new URLSearchParams();
    params.append('nome', nome); // Aggiungi il nome del parametro (in questo caso, 'destinatario')
    params.append('zona', zona); 
    params.append('email', email);
    params.append('action','delete');
    
    fetch('/deletesug', {
      method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
      },
      body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
    })
    .then(response => response.json())
    .then(async data => {
      if(data.done){
        localStorage.setItem('consigliati',JSON.stringify(consigliati));
        let MaxPage=Math.ceil(n/6);
        if (thispage>MaxPage)thispage--;//se è vera bisogna diminuire la pagina
        init();
      }
    })
    .catch(error => {
      console.error('Errore:', error);
    });
  }

function approveSugestion(){
  event.preventDefault();
  const pos = this.href.replace(/^.*\//, ''); //Pos sarebbe la posizione esatta del luogo nei due localstorage
  const Stringlist = localStorage.getItem('consigliati');
  const consigliati = JSON.parse(Stringlist);
  const n=consigliati.length-1;
  var deletedsug= consigliati.splice(pos,1);
  const nome=deletedsug[0].nome;
  const zona=deletedsug[0].zona;
  const email=deletedsug[0].email;
  const params = new URLSearchParams();
  params.append('nome', nome); // Aggiungi il nome del parametro (in questo caso, 'destinatario')
  params.append('zona', zona); 
  params.append('email', email);
  params.append('action','approve');
  
  fetch('/deletesug', {
    method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
    },
    body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
  })
  .then(response => response.json())
  .then(async data => {
    if(data.done){
      localStorage.setItem('consigliati',JSON.stringify(consigliati));
      let MaxPage=Math.ceil(n/6);
      if (thispage>MaxPage)thispage--;//se è vera bisogna diminuire la pagina
      init();
    }
  })
  .catch(error => {
    console.error('Errore:', error);
  });
}
