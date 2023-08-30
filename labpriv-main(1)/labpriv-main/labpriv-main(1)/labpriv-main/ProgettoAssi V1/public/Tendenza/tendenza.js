document.addEventListener('DOMContentLoaded', function () {
    fetch('/getTendencies',{
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      var luoghi=data.tendencies;
      setTendency(luoghi);
    })
    .catch(error => {
      console.error(error);
    });
});


function setTendency(luoghi){
    const cards = document.querySelectorAll('.card');

    cards.forEach((card, index) => {
        const luogo = luoghi[index];
        const cardTitle = card.querySelector('.card-title');
        const cardDescription = card.querySelector('.card-text');
        const cardLink = card.querySelector('.btn');

        cardTitle.textContent = luogo.nome;
        cardDescription.textContent = luogo.descrizione;
        cardLink.href = luogo.municipio;
        cardLink.addEventListener('click',redirect);
    });
}

function redirect(event) {
  event.preventDefault(); // impedisce il comportamento predefinito del link
  const ID = this.href.replace(/^.*\//, ''); // ottiene l'id del link
  const posID= parseInt(ID.replace(/\D/g, ''));
  localStorage.setItem('clickedID',posID);
  var m = ID.replace(/\d+/g, '');
  window.location.href="/Municipi/Municipio "+m+"/Municipio "+m+".html";
}