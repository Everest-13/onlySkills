var Sqlite = require('better-sqlite3');
var db = new Sqlite('app/Database/db.sqlite');
var offers = require('./offersController');
var User = require('./UserController');


exports.add_a_report= function (idMessage ,reason){
    let Insert = db.prepare('INSERT INTO report_messages (idMessage,reason) VALUES (?,?)')
    Insert.run(idMessage,reason)

}

exports.Remove_a_report= function (idMessage ,reason){
    let Remove = db.prepare('DELETE INTO report_messages (idMessage,reason) VALUES (?,?)')
    Remove.run(idMessage,reason)

}


exports.List_report= function (){

    let Select = db.prepare('Select * FROM report_messages ')
    Select.all()

}


exports.List_report= function (idMessage ,reason){

    let Select = db.prepare('Select * FROM report_messages WHERE idMessage = ? AND reason = ? ')
    Select.all(idMessage,reason)

}