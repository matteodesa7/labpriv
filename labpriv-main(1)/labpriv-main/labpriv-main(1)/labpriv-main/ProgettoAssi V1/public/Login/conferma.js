document.getElementById("btnConfermaEmail").addEventListener("click", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const destinatario = urlParams.get('destinatario');
  if (destinatario) {
    const params = new URLSearchParams();
    params.append('destinatario', destinatario); // Aggiungi il nome del parametro (in questo caso, 'destinatario')
    
    fetch('/confirmemail', {
      method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
      },
      body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
    })
    .then(response => response.json())
    .then(async data => {
      if(data.done){
        localStorage.setItem("Registered", true);
        window.location.href = "/Login/Login.html"; // Usa "=" invece di "/"  
      }
    })
    .catch(error => {
      console.error('Errore:', error);
    });
  }
});
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const destinatario = urlParams.get('destinatario');
    const pw=urlParams.get('key');
    if(destinatario && pw){
        console.log("da confermare");
        const params = new URLSearchParams();
        params.append('destinatario', destinatario); // Aggiungi il nome del parametro (in questo caso, 'destinatario')   
        params.append('hpw',pw);
        params.append('action','check');
        
        fetch('/checkemail', {
            method: 'POST', // Metodo HTTP che si desidera utilizzare (in questo caso, POST)
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded', // Cambiato il tipo di dati, nel caso di params utilizza application/x-www-form-urlencoded
            },
            body: params, // Converte l'oggetto URLSearchParams in una stringa per il corpo della richiesta
          })
          .then(response => response.json())
          .then(async data => {
            console.log(data);
            if(!data.done){
                window.location.href = "/Login/Login.html"; // Usa "=" invece di "/"
            }
          })
          .catch(error => {
            console.error('Errore:', error);
          });

    }
    else{
        window.location.href = "/Login/Login.html"; // Usa "=" invece di "/"

    }
});
