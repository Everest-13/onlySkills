var Sqlite = require('better-sqlite3');
let db = new Sqlite(__dirname + '/../Database/db.sqlite');


const path = require('path');


const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

exports.ifExistAccount = function (email) {

    let prepareExistAccount = db.prepare('SELECT * FROM user WHERE email = ?');

    let resultAccount = prepareExistAccount.get(email);

    return (resultAccount != undefined ? true : false);

}

exports.signUpGlobal = function (data) {
    let corporation = "";
    if (data.corporationName != undefined) {
        corporation = data.corporationName

    } else {
        corporation = "NULL"
    }


    if (!this.ifExistAccount(data.email)) {

        let prepareSignUp = db.prepare('INSERT INTO user (firstName, lastName, email, password, typeAccount, questionForgot, responseForgot,CompanyName) VALUES (?, ?, ?, ?, ?, ?, ?,?)');

        let resultSignUp = prepareSignUp.run(data.firstName, data.lastName, data.email, data.password, (data.corporationName != undefined ? 1 : 0), data.personalQuestion, data.personalResponse, corporation);

        if (data.corporationName != undefined) {

            this.signUpEntreprise(data, resultSignUp.lastInsertRowid);
        } else {
            data.corporationName = "NULL"
            this.signUpEmployee(data, resultSignUp.lastInsertRowid);
        }

        return (resultSignUp != undefined ? resultSignUp.lastInsertRowid : -1);

    }

    return -2;

}

exports.signUpEmployee = function (data, id) {

    let prepareSignUpEmploye = db.prepare('INSERT INTO user_employe (id, avatar) VALUES (?, ?)');

    let resultSignUp = prepareSignUpEmploye.run(id, this.generateAvatar(id, data.firstName + " " + data.lastName));

}

exports.signUpEntreprise = function (data, id) {

    let prepareSignUpEntreprise = db.prepare('INSERT INTO user_entreprise (id, avatar) VALUES (?, ?)');

    let resultSignUp = prepareSignUpEntreprise.run(id, this.generateAvatar(id, data.firstName + " " + data.lastName));

}

exports.generateAvatar = function (id, name) {

    let path = "public/store/avatar/" + id + ".png";

    const file = fs.createWriteStream(path);
    const request = https.get("https://eu.ui-avatars.com/api/?name=" + encodeURIComponent(name), function (response) {
        response.pipe(file);
    });

    return path;
}

exports.signIn = function (email, password) {

    let prepareSignIn = db.prepare('SELECT * FROM user WHERE email = ? AND password = ?');

    let resultSignUp = prepareSignIn.get(email, password);


    return (resultSignUp != undefined ? resultSignUp : -1);

}


exports.getUserResponse = function (mail) {

    let response = db.prepare('SELECT responseForgot As r   FROM USER WHERE  email = ?');


    let returner = (mail == undefined) ? null : (response.get(mail).r)
    return returner

}


exports.getUserNameWithMail = function (mail) {

    let response = db.prepare('SELECT firstName As name   FROM USER WHERE  email = ?');


    let returner = (mail == undefined) ? null : (response.get(mail).name)
    return returner

}


exports.getUserNameWithId = function (id) {

    let response = db.prepare('SELECT firstName As name   FROM USER WHERE  id = ?');


    let returner = (id == undefined) ? null : (response.get(id).name)
    return returner
}


exports.getUserLastNameWithId = function (id) {

    let response = db.prepare('SELECT LastName As name   FROM USER WHERE  id = ?');


    let returner = (id == undefined) ? null : (response.get(id).name)
    return returner
}


exports.getCompanyNameWithId = function (id) {

    let response = db.prepare('SELECT CompanyName As name   FROM USER WHERE  id = ?');


    let returner = (id == undefined) ? null : (response.get(id).name)
    return returner
}


exports.UpdatePassword = function (mail, new_password) {
    let update = db.prepare('UPDATE User SET password = ? WHERE email = ?')
    update.run(new_password, mail);
}

exports.downloadDataEmployee = function(user_id) {

    let response = db.prepare('SELECT * FROM user LEFT JOIN user_employe ON user.id = user_employe.id WHERE user.id = ' + user_id);
    return response.get();

}

exports.downloadDataCompany = function(user_id) {

    let response = db.prepare('SELECT * FROM user LEFT JOIN user_entreprise ON user.id = user_entreprise.id WHERE user.id = ' + user_id);
    return response.get();

}

exports.getAllUserData = function (user_id) {
    let response = db.prepare('SELECT * FROM user LEFT JOIN user_employe ON user.id = user_employe.id WHERE user.id = ' + user_id);
    let result = response.get();
    result.show_cv = result.show_cv == "txt" ? true : false;
    result.show_motivation = result.show_motivation == "txt" ? true : false;
    return result;
}

exports.getUserProfileData = function (user_id) {
    let response = db.prepare('SELECT * FROM user LEFT JOIN user_employe ON user.id = user_employe.id WHERE user.id = ' + user_id);
    let result = response.get();
    result.show_cv = result.show_cv == "txt" ? true : false;
    result.show_motivation = result.show_motivation == "txt" ? true : false;
    return result;
}

exports.getAllCompanyData = function (user_id) {
    let response = db.prepare('SELECT * FROM user LEFT JOIN user_entreprise ON user.id = user_entreprise.id WHERE user.id = ' + user_id);
    return response.get();
}

exports.getUserName = function (mail) {

    let response = db.prepare('SELECT firstName As name   FROM USER WHERE  email = ?');

    let returner = (mail == undefined) ? null : (response.get(mail).name)
    return returner

}


exports.UpdatePassword = function (mail, new_password) {
    let update = db.prepare('UPDATE User SET password = ? WHERE email = ?')
    update.run(new_password, mail);

}


exports.modifyUser = function (user_id, data) {

    let allUserData = this.getAllUserData(user_id);

    if (allUserData.cv_file == null) {
        show_cv = 'txt';
    } else {
        show_cv = (data.cv_choose == 'pdf' ? 'pdf' : 'txt');
    }

    if (allUserData.motivation_file == null) {
        show_motivation = 'txt';
    } else {
        show_motivation = (data.motivation_choose == 'pdf' ? 'pdf' : 'txt');
    }

    let update = db.prepare('UPDATE user_employe SET description = ?, phone = ?, country = ?, language = ?, show_cv = ?, show_motivation = ? WHERE id = ?');

    update.run(data.description, data.phone_number, data.country, data.language, show_cv, show_motivation, user_id);

}

exports.modifyCompanyUser = function (user_id, data) {

    let update = db.prepare('UPDATE user_entreprise SET description = ?, phone = ?, country = ?, language = ? WHERE id = ?');

    update.run(data.description, data.phone_number, data.country, data.language, user_id);

}

exports.deleteUser = function (user_id) {

    let update = db.prepare('DELETE FROM user WHERE id = ?');

    update.run(user_id);

}

exports.deleteFile = function (type, user_id) {

    let filesInfos = this.getUserCvMotivation(user_id);

    if (type == "cv" && filesInfos.cv_file !== null) {

        fs.exists(__dirname + '/../../' + filesInfos.cv_file, function (exists) {
            if (exists) {
                fs.unlink(filesInfos.cv_file);
            }
        });

        let result = db.prepare('UPDATE user_employe SET cv_file = NULL WHERE id = ' + user_id);

        result.run();
    }

    if (type == "motivation" && filesInfos.motivation_file !== null) {

        fs.exists(__dirname + '/../../' + filesInfos.motivation_file, function (exists) {
            if (exists) {
                fs.unlink(filesInfos.motivation_file);
            }
        });

        let result = db.prepare('UPDATE user_employe SET motivation_file = NULL WHERE id = ' + user_id);

        result.run();
    }

}

exports.getUserCvMotivation = function (user_id) {

    let getFiles = db.prepare('SELECT cv_text, cv_file, motivation_text, motivation_file FROM user_employe WHERE id = ?');
    return getFiles.all(user_id)[0];
}

exports.changeUserCv = function (type, text, user_id) {

    if (type == "text") {
        let updateCvText = db.prepare('UPDATE user_employe SET cv_text = ? WHERE id = ' + user_id)
        updateCvText.run(text);
    }

    if (type == "file") {
        let updateCvFile = db.prepare('UPDATE user_employe SET cv_file = ? WHERE id = ' + user_id)
        updateCvFile.run(text);
    }

}

exports.changeUserMotivation = function (type, text, user_id) {

    if (type == "text") {
        let updateCvText = db.prepare('UPDATE user_employe SET motivation_text = ? WHERE id = ' + user_id)
        updateCvText.run(text);
    }

    if (type == "file") {
        let updateCvFile = db.prepare('UPDATE user_employe SET motivation_file = ? WHERE id = ' + user_id)
        updateCvFile.run(text);
    }

}
