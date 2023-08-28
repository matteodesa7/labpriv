document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const destinatario = urlParams.get('destinatario');
    const hpw=urlParams.get('key');
    if(destinatario && hpw){
        const params = new URLSearchParams();
        params.append('destinatario', destinatario); // Aggiungi il nome del parametro (in questo caso, 'destinatario')   
        params.append('hpw',hpw);
        params.append('action','reimpostapw');
        fetch('/checkemail', {
            method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
            },
            body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
          })
          .then(response => response.json())
          .then(async data => {
            if(!data.done){
                window.location.href = "/Login/Login.html"; // Usa "=" invece di "/"
            }
            else{
                var email=document.getElementById('email');
                email.value=destinatario;
                if(hpw.includes('Admin')){
                  var fromAdmin=document.getElementById('fromAdmin');
                  fromAdmin.value='true';
                  console.log(fromAdmin.value);
                }
            }
          })
          .catch(error => {
            console.error('Errore:', error);
          });
    }
    else{
        window.location.href="http://localhost:8000/";
    }
});
