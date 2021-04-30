# PROJET WEB


CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, firstName TEXT, lastName TEXT, email TEXT, password TEXT, typeAccount INTEGER, questionForgot TEXT, responseForgot TEXT, companyName TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
Pour eviter que ce soit le bordel dans la table USER

CREATE TABLE user_employe (id INTEGER, avatar TEXT);

CREATE TABLE user_entreprise (id INTEGER, avatar TEXT);

Pour utilisateur 0 est employé et entreprise 1

CREATE TABLE user_cv_motivation (user_id INTEGER NOT NULL, cv_text TEXT NULL, cv_upload TEXT NULL, motivation_text TEXT NULL, motivation_upload TEXT NULL);

Les utilisateurs non entreprise ont une entreprise qui s'appelle NULL
