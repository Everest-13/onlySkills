var Sqlite = require('better-sqlite3');
var db = new Sqlite('app/Database/db.sqlite');
var offers = require('./offersController');
var User = require('./UserController');


exports.getMessage = function (idMessage){
    let SELECT = db.prepare('SELECT * FROM messages  WHERE id = ?');
    return SELECT.get(idMessage)
}


exports.getMessages = function (id){
    let SELECT = db.prepare('SELECT * FROM messages  WHERE idReceiver = ?');
    return SELECT.all(id)





}
exports.getConversations = function ( id){

    let conv = []

    let SELECT = db.prepare(' Select DISTINCT( idSender ),idReceiver  FROM messages WHERE idSender = ? OR idReceiver = ?')
    let response = SELECT.all(id,id)

    let array = []
    for (const responseKey of response) {
        let current_conv = []
        current_conv.push(responseKey.idSender,responseKey.idReceiver)
        current_conv.sort
        if( ! array.includes(current_conv))array.push(current_conv)

    }

    for (let i = 0; i < array.length; i++) {
        other = (array[i][0] == id) ? array[i][1] : array[i][0]

        let SELECT = db.prepare('Select MAX( dateOfSending) AS date  ,idOfAnnoucement as annonce ,idSender  AS sender ,idReceiver as dest FROM messages WHERE idSender = ? AND idReceiver = ? OR idSender = ? AND idReceiver = ?')
        let response =  SELECT.get(id,other,other,id)

        let annonce = (other == 4) ? 'Message de l\ équipe OnlySkills' : 'Réponse à une offre'
        let forAdminCompany =( User.getCompanyNameWithId(other) == 'NULL') ? ' Futur employé' : " de "+User.getCompanyNameWithId(other)

        conv.push( {
            date : response.date,
            dest : id,
            sender : (other == 4) ? 'L\'équipe OnlySKills ' : other,
            forAdmin : User.getUserNameWithId(other)+" "+ User.getUserLastNameWithId(other) + forAdminCompany,
            announce : annonce,
            idDest : id,
            idSender : other

        });
    }

    return conv
}

exports.addMessage = function (idSender , idDest ,  ContentMessage , idAnnounce){
    let insert = db.prepare('INSERT INTO messages (idSender,idReceiver , messageContent ,dateOfSending,idOfAnnoucement) VALUES (?,?,?,?,?)');
    insert.run(idSender,idDest,ContentMessage,getCurrentDate_Format_YYYY_MM_DD_HH_MM_SS(),idAnnounce)
}



function getCurrentDate_Format_YYYY_MM_DD_HH_MM_SS() {
    let date = new Date;
    return date.toUTCString().toString();}



exports.getMessagesBetweenBoth=function(idSender, idDest, userReceiver){
    let messages = []
    if(idSender != undefined && idDest != undefined){

    let SELECT = db.prepare('SELECT * FROM messages WHERE idSender = ? AND idReceiver = ?  OR idSender = ? AND idReceiver = ? Order By dateOfSending ASC')

    let response = SELECT.all(idSender,idDest,idDest,idSender)
    for (let i = 0; i < response.length; i++) {
        let currentMessage = response[i]
       if(currentMessage.idReceiver == idSender){


           messages.push({
               id : currentMessage.id,
               user_id: idDest,
               name: userReceiver,
               content :currentMessage.messageContent,
               button : 'Signaler',
               avatar : (userReceiver == 'Anonyme' ? '/assets/metis-assets/icons/anonyme.png' : '/store/avatar/' + idDest + '.png'),
               maybe_anonyme: true
           })

       }
      if(currentMessage.idSender == idSender){

            messages.push({

               id : currentMessage.id,
               name: 'Vous',
               user_id: idSender,
               content : currentMessage.messageContent,
               button : 'Supprimer',
               avatar : '/store/avatar/' + idSender + '.png',
                maybe_anonyme: false
            })

       }
    }}
    return messages


}
exports.deleteMessage = function(id){
    let Delete = db.prepare('DELETE FROM messages WHERE id = ?')
    Delete.run(id)
}

exports.countMessagesRecieve = function (id) {
    let SELECT = db.prepare('SELECT DISTINCT count (*)  as number FROM messages Where idReceiver = ?');
    return SELECT.get(id).number

}
exports.countMessagesSend= function (id) {
    let SELECT = db.prepare('SELECT DISTINCT count (*)  as number FROM messages Where idSender = ?');
    return SELECT.get(id).number

}


exports.getMessagesReports = function (){

    let MessagesReports = []
    let SelectReports = db.prepare('Select * from report_messages ORDER BY id DESC');
    let SelectMessages = db.prepare('Select * from messages Where id = ?');
    let SelectNameSender  =db.prepare('Select firstName ,lastName , id FROM user Where id = ? ')
    let SelectNameDest  =db.prepare('Select firstName ,lastName , id  FROM user Where id = ? ')

    let responseReports = SelectReports.all()
    for (let i = 0; i <responseReports.length ; i++) {
        let responseMessages = SelectMessages.get(responseReports[i].idMessage)
        let responseNameSender = SelectNameSender.get(responseMessages.idSender)
        let responseNameDest = SelectNameDest.get(responseMessages.idReceiver)
        console.log(responseNameDest.firstName)
    MessagesReports.push({
        id : responseReports[i].id,
        reason:   responseReports[i].reason,
        contentMessage : responseMessages.messageContent,
        date : responseMessages.dateOfSending,
        idSender : responseMessages.idSender,
        idDest : responseMessages.idReceiver,
        NameDest :  responseNameDest.lastName +' '+responseNameDest.firstName ,
        NameSender : responseNameSender.lastName +' '+responseNameSender.firstName ,


    })
    }
    return MessagesReports
}

exports.deleteReport = function (id){
    let DELETE = db.prepare('DELETE FROM report_messages WHERE id = ?')
    DELETE.run(id)
}

exports.countMessages = function (){
    let count = db.prepare('SELECT MAX(id) as Number FROM messages ')
    return count.get().Number
}