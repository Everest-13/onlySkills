var Sqlite = require('better-sqlite3');
var db = new Sqlite('app/Database/db.sqlite');


exports.redirectUser = function (typeUser) {
    return typeUser;
}



/*
Status 0 : User exist
Status 1 : Mail incorrect
Status 2 : Firstname and LastName incorrect
Status 3 : Firstname , LastName and Mail incorrect

 */
exports.userExistStatus = function (mailUser , firstName , lastName){
    let countNames = db.prepare('SELECT COUNT(*)  AS current FROM USER WHERE   firstName = ? AND lastName = ?');

    let Names = countNames.get(firstName, lastName).current   ;

    let countMail = db.prepare('SELECT COUNT(*)  AS current FROM USER WHERE  email = ?');

    let Mail = countMail.get(mailUser).current  ;


    if( Mail === 1  && Names >= 1)return 0;


    if(Mail === 0  && Names >= 1) return 1;

    if(Mail === 1  && Names === 0) return 2;

    if(Mail === 0  && Names === 0)return 3;


}

exports.getUserQuestion =function (mail){
    let question = db.prepare('SELECT questionForgot  AS q FROM USER WHERE  email = ?');

    return (question.get(mail).q)
}


exports.getUserResponse =function (mail){

    let response = db.prepare('SELECT responseForgot As r   FROM USER WHERE  email = ?');

    return (mail == undefined  ) ? null :(response.get(mail).r)
}


exports.getUserName = function (mail){

    let response = db.prepare('SELECT firstName As name   FROM USER WHERE  email = ?');
    return (mail == undefined  ) ? null :(response.get(mail).name)

}


exports.UpdatePassword =function (mail,new_password){
    let update =  db.prepare('UPDATE User SET password = ? WHERE email = ?')
     update.run(new_password,mail);
}




exports.getUserNameWithId = function (id)
{

    let response = db.prepare('SELECT firstName As name   FROM USER WHERE  id = ?');


    let returner = (response.get(id) == undefined) ? 'Admin' : (response.get(id).name)
    return returner
}


exports.getUserLastNameWithId = function (id)
{

    let response = db.prepare('SELECT lastName As name   FROM USER WHERE  id = ?');


    let returner = (response.get(id) == undefined) ? 'Admin' : (response.get(id).name)
    return returner
}

exports.getCompanyNameWithId = function (id)
{

    let response = db.prepare('SELECT CompanyName As name   FROM USER WHERE  id = ?');


    let returner = (response.get(id) == undefined) ? 'Futur(e) employé(e)' : (response.get(id).name)
    return returner
}

/*
 For admin only
 */


exports.getUsersList =function (info){
    if(info == undefined || info == ''){
    let SELECT = db.prepare('SELECT * from user  group by id ')
    return SELECT.all();}
    else {
        let SELECT = db.prepare('SELECT * from user WHERE id=? OR firstName =? OR lastName =?  OR companyName =? group by id ')
        return SELECT.all(info,info,info ,info);

    }
}
exports.getUsersInfo =function (UserID){
    let SELECT = db.prepare('SELECT * from user Where id = ?  ')
    return SELECT.get(UserID);
}

exports.countUser = function (){
    let response = db.prepare('SELECT DISTINCT count(*) As number   FROM USER');
    return response.get().number

}