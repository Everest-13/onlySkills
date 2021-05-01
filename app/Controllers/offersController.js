var fs = require('fs');
var Sqlite = require('better-sqlite3');
var db = new Sqlite('app/Database/db.sqlite');
var next_id = 0 ;









exports.read = function(id) {



    var SELECT = db.prepare('SELECT * FROM offers  WHERE id = ? ');
    var read = SELECT.get(id);

    if (read == null) {return null};

    return read;
}



exports.listAll = function() {
        var list  = [];
        let SELECT = db.prepare('SELECT * FROM offers');
        for (const offer of SELECT.iterate()) {
            list.push(offer);

        }
        return list;


}

exports.listWhere = function(s) {

if(s == undefined || s ==''){
    let list  = [];
    let SELECT = db.prepare('SELECT * FROM offers');
    for (const offer of SELECT.iterate()) {
        list.push(offer);


    }
    return list;}

    let list  = [];
    let SELECT = db.prepare('SELECT * FROM offers Where city like ? OR company like ? OR job like ? Or title like ? OR pay =?');




    let pay = s
    s = "%"+s+"%"
    return SELECT.all(s,s,s,s,pay);


}


exports.addOffers = function (company , title , job , city ,pay , desc , idSender){


    let addOffers = db.prepare('INSERT  INTO offers (company,title,job,city,pay,desc,date,idSender) VALUES(?,?,?,?,?,?,?,?) ');

    addOffers.run(company,title,job,city,pay,desc,getCurrentDate__Format_DD__MM__YYYY(),idSender);

}



function getCurrentDate__Format_DD__MM__YYYY(){
    let currentDate = new Date();
    let cDay = currentDate.getDate().toString();
    if(cDay.length == 1)cDay = "0"+cDay
    let cMonth = (currentDate.getMonth() + 1).toString();
    if(cMonth.length == 1)cMonth = "0"+cMonth

    let cYear = (currentDate.getFullYear()).toString();
    let date = cDay+"/"+cMonth+"/"+cYear;
    return date;
}


exports.getOffersWithIdSender = function (idSender) {
    let SELECT = db.prepare('SELECT * FROM offers Where idSender = ?');
    return SELECT.all(idSender)

}

exports.getAllWithIdOffer = function (idOffer){
    let SELECT = db.prepare('SELECT * FROM offers Where id = ?');
    return SELECT.get(idOffer)

}




exports.getTitle = function (id) {
    let SELECT = db.prepare('SELECT title  as title from offers Where id = ?')
    return (SELECT.get(id)=== undefined) ?'Message de l\'équipe de OnlySkills' :  SELECT.get(id).title

}



exports.DeleteOffer = function (id) {
    let Delete = db.prepare('DELETE FROM offers WHERE id = ?')
    Delete.run(id)

}



exports.UpdateOffer = function (title , job , city , pay   , desc , id) {
    let Update = db.prepare('UPDATE  offers SET title = ? , job = ? , city = ? ,pay = ?, date = ?, desc = ? WHERE id = ?')
    console.log(id)
    Update.run(title , job , city , pay  , getCurrentDate__Format_DD__MM__YYYY() , desc , id)

}


exports.countOffers = function (id) {
    let SELECT = db.prepare('SELECT DISTINCT count (*)  as number FROM offers Where idSender = ?');
    return SELECT.get(id).number

}

exports.countOffers = function (){
    let count = db.prepare('SELECT count(*) as Number FROM offers ')
    return count.get().Number
}
