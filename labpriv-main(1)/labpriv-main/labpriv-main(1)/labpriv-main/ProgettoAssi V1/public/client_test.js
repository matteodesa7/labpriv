var assert=require('assert');
describe('Test Login e Registrazione',function(){
    describe('Test BadLogin',function(){
        it('Dovrebbe dare un messaggio di email non presente',function(){
            var result=checkBadLogIn('email');
            assert.equal(result,'emailerror');
        });

        it('Dovrebbe dare un messaggio di password sbagliata',function(){
          var result=checkBadLogIn('pass');
          assert.equal(result,'passerror');
      });

      it('Dovrebbe dare un messaggio di email non confermata',function(){
        var result=checkBadLogIn('notConfirmed');
        assert.equal(result,'ncerror');
      });

      it('Dovrebbe dare un messaggio di account bloccato',function(){
        var result=checkBadLogIn('blocked');
        assert.equal(result,'blockederror');
      });
    });


    describe('Test Registered',function(){
      it('Dovrebbe dare un messaggio registrazione confermata con email da confermare',function(){
          var result=checkRegistered('tobeConfirmed');
          assert.equal(result,'mailconfirmed');
      });

      it('Dovrebbe dare un messaggio di errore generico',function(){
        var result=checkRegistered('false');
        assert.equal(result,'falseerror');
    });

    it('Dovrebbe dare un messaggio di email già presente nel database, quindi account già registrato',function(){
      var result=checkRegistered('primary');
      assert.equal(result,'primaryerror');
    });

    it('Dovrebbe dare un messaggio di password sbagliata',function(){
      var result=checkRegistered('badpass');
      assert.equal(result,'badpasserror');
    });
    it('Dovrebbe dare un messaggio di nome non inserito',function(){
      var result=checkRegistered('noName');
      assert.equal(result,'noNameerror');
    });
    it('Dovrebbe dare un messaggio di email scritta male',function(){
      var result=checkRegistered('noMail');
      assert.equal(result,'noMailerror');
    });
    it('Dovrebbe dare un messaggio di email confermata',function(){
      var result=checkRegistered('true');
      assert.equal(result,'true');
    });
  });
});


function checkBadLogIn(Test){
    var badLogin;
    if(Test){
      badLogin=Test;
    }
    else{
      badLogin= localStorage.getItem('badLogin');
    }
    switch(badLogin){
      case 'pass':
        return 'passerror';
        
        break;
      case 'email':
        return 'emailerror';

      break;
      case 'notConfirmed':
        return 'ncerror';
           
      break;
      case 'blocked':
        return 'blockederror';
        
    }
  }
function removeL(){
    return;
}
function removeR(){
  return;
}
function checkRegistered(test){
    switch(test){
      case 'tobeConfirmed':
        return 'mailconfirmed';
        break;
      case 'false':
        return 'falseerror';
        break;
      case 'primary':
        return 'primaryerror';
        break;
      case 'badpass':
        return 'badpasserror';
        break;
      case 'noName':
        return 'noNameerror';
          break;
      case 'noMail':
      return 'noMailerror';
          break; 
      case 'true':
      return 'true';
          break;  
      default:
        //utente non registrato
        break;
    }
}