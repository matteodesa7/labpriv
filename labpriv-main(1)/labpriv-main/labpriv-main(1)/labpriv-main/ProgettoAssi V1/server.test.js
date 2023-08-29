const request = require('supertest');
const server = require('./server.js');

describe("Test sulla registrazione",()=>{

    it ("Dato un username, una mail e una password corretti dovrebbe creare l'utente",async ()=>{
        //Dovrebbe salvare i dati nel database
        const response= await request(server).post("/redirect").send({
            nome:"TestCorretto",
            email:"progettolab@gmail.com",
            password:"Ciccione01." 
        })
        expect(response.status).toBe(307); // Verify the status code
    })

    it ("Mancanza di username dovrebbe dare errore",async ()=>{
        //Dovrebbe salvare i dati nel database
        const response= await request(server).post("/redirect").send({
            nome:"",
            email:"progettolab7@gmail.com",
            password:"Ciccione01." 
        })
        expect(response.status).toBe(302); // Verify the status code
    })

    it ("Email scoretta dovrebbe dare errore",async ()=>{
        //Dovrebbe salvare i dati nel database
        const response= await request(server).post("/redirect").send({
            nome:"prova",
            email:"@progettolab7gmail.com",
            password:"Ciccione01." 
        })
        expect(response.status).toBe(302); // Verify the status code
    })

    it ("Password con formato errato, dovrebbe dare errore",async ()=>{
        //Dovrebbe salvare i dati nel database
        const response= await request(server).post("/redirect").send({
            nome:"prova",
            email:"progettolab7@gmail.com",
            password:"Cicci" 
        })
        expect(response.status).toBe(302); // Verify the status code
    })

})

describe("Test sul login",()=>{
    it ("Data la mail e la password corretta permette l'accesso",async ()=>{
        const response= await request(server).post("/access").send({
            email:"progettolab@gmail.com",
            password:"Ciccione01." 
        })
        expect(response.status).toBe(307); // Verify the status code
    })

    it ("Data la mail e la password corretta,ma con l'email non verificata, non permette l'accesso",async ()=>{
        const response= await request(server).post("/access").send({
            email:"progettolab7@gmail.com",
            password:"Ciccione01." 
        })
        expect(response.status).toBe(302); // Verify the status code
    })

    it ("Data la mail errata non permette l'accesso",async ()=>{
        const response= await request(server).post("/access").send({
            email:"progettolab9@gmail.com",
            password:"Ciccione01." 
        })
        expect(response.status).toBe(302); // Verify the status code
    })

    it ("Data la passworrd errata non permette l'accesso",async ()=>{
        const response= await request(server).post("/access").send({
            email:"progettolab7@gmail.com",
            password:"Ciccione01" 
        })
        expect(response.status).toBe(302); // Verify the status code
    })
})
describe("Test sul logout",()=>{
    it ("Effettua salvataggio dei preferiti e logout",async ()=>{
        const response= await request(server).post("/exit").send({
            list:'[]',
            email:"progettolab@gmail.com",
            list2:"[]" 
        })
        expect(response.body.done).toBe(true); // Verify the status code
    })

})
describe("Test sul controllo se esiste un possibile admin",()=>{
    it ("Se la mail appartiene a un possibile admin restituisce true",async ()=>{
        const response= await request(server).post("/adminverify").send({
            email:"marc.capobianco01@gmail.com"
        })
        expect(response.body.done).toBe(true); // Verify the status code
    })
    it ("Se la mail non appartiene a un possibile admin restituisce false",async ()=>{
        const response= await request(server).post("/adminverify").send({
            email:"marccapobianco01@gmail.com"
        })
        expect(response.body.done).toBe(false); // Verify the status code
    })

})

describe("Test sull'accesso dell'admin",()=>{
    it ("Se il token inserito è corretto allora l'admin effettua l'accesso",async ()=>{
        const response= await request(server).post("/verifyAdminToken").send({
            email:"marc.capobianco01@gmail.com",
            token:"1234"
        })
        expect(response.body.done).toBe(true); // Verify the status code
    })
    it ("Se la mail non appartiene a un possibile admin restituisce false",async ()=>{
        const response= await request(server).post("/verifyAdminToken").send({
            email:"marc.capobianco01@gmail.com",
            token:"123"
        })
        expect(response.body.done).toBe(false); // Verify the status code
    })

})

describe("Test sulla conferma della mail",()=>{
    it ("Se la mail non è verificata la conferma",async ()=>{
        const response= await request(server).post("/confirmemail").send({
            email:"progettolab7@gmail.com"
        })
        expect(response.body.done).toBe(true); // Verify the status code
    })
    it ("Se la mail è già verificata restituisce false",async ()=>{
        const response= await request(server).post("/confirmemail").send({
            email:"progettolab@gmail.com"
        })
        expect(response.body.done).toBe(true); // Verify the status code
    })

})