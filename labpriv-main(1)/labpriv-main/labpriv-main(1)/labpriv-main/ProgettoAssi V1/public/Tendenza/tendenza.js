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
    });
}