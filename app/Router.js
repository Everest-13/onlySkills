const path = require("path");
module.exports = function (app) {


    var mustache = require('mustache-express');
    const multer = require("multer");

    var bodyParser = require('body-parser');

    var csrf = require('csurf');

    var csrfProtection = csrf({cookie: true});

    var cookieParser = require('cookie-parser');

    app.use(cookieParser());

    var parseForm = bodyParser.urlencoded({extended: false});

    app.use(is_user_connected);

    const {body, validationResult} = require('express-validator');

    app.engine('html', mustache());
    app.set('view engine', 'html');
    app.set('views', './app/Views');

    var offers = require('./Controllers/offersController');

    var messages = require('./Controllers/messagesController');

    var messages_report = require('./Controllers/report_messagesController');

    var userModel = require('./Models/UserModel');

    var userController = require('./Controllers/UserController');


    app.get('/', function (req, res) {
        res.render('index');
    });


    app.get('/signin', redirect_if_logged, function (req, res) {
        res.render('signin');
    });

    app.get('/signup', redirect_if_logged, function (req, res) {
        res.render('signup');
    });

    app.get('/signout', function (req, res) {
        req.session = null;
        res.redirect('/signin');
    });

    app.post('/new-password', function (req, res) {

        let status = (userController.userExistStatus(req.body.email, req.body.firstName, req.body.lastName))


        if (status == 0) {
            userController.getUserQuestion(req.body.email)
            res.render('new-password', {
                question: userController.getUserQuestion(req.body.email),
                name: req.body.firstName,
                email: req.body.email
            })

        }

        if (status == 1) {

            res.render('forgot-password', {
                errors: {
                    allErrors: {
                        msg: 'Aucun mail ne correspond.'
                    }
                }
            });

        }

        if (status == 2) {
            res.render('forgot-password', {
                errors: {
                    allErrors: {
                        msg: 'Aucun nom/prenom ne correspond'
                    }
                }
            });

        }

        if (status == 3) {

            res.render('forgot-password', {
                errors: {
                    allErrors: {
                        msg: 'Aucun nom/prenom ne correspond et  aucun mail ne correspondent.'
                    }
                }
            });

        }


    })
    app.get('/forgot-password', redirect_if_logged,
        function (req, res) {

            res.render('forgot-password')


        });


    app.post('/changepwd', function (req, res) {
        let responseUser = req.body.response.toLowerCase();
        let responseInDB = userController.getUserResponse(req.body.email).toLowerCase();


        if (responseInDB === responseUser) {


            if (req.body.password.length >= 5 && req.body.password === req.body.confirmPassword) {
                userController.UpdatePassword(req.body.email, req.body.password)


                res.render('succesPasswordChanged', {
                    name: userController.getUserNameWithMail(req.body.email)
                })
            }


            if (req.body.password != req.body.confirmPassword) {
                res.render('new-password', {
                    question: userController.getUserQuestion(req.body.email),
                    name: userController.getUserNameWithMail(req.body.email),
                    email: req.body.email,
                    errors: {
                        msg: "Les mots de passe ne coincident pas !"
                    }
                })

            }

            if (req.body.password.length < 5)
                res.render('new-password', {
                    question: userController.getUserQuestion(req.body.email),
                    name: userController.getUserNameWithMail(req.body.email),
                    email: req.body.email,
                    errors: {
                        msg: "Mot de passe trop court "
                    }
                })

        } else {
            res.render('new-password', {
                question: userController.getUserQuestion(req.body.email),
                name: userController.getUserNameWithMail(req.body.email),
                email: req.body.email,
                errors: {
                    msg: "Réponse incorrecte"
                }
            })
        }
    });


    app.get('/offers/', function (req, res) {


        res.render('offers', {offers: offers.listWhere(req.query.q)});
    });


    app.get('/faq', function (req, res) {
        res.render('faq');
    });

    app.get('/contact', function (req, res) {
        res.render('contact');
    });

    app.get('/tos', function (req, res) {
        res.render('tos');
    });

    app.get('/privacy-policy', function (req, res) {
        res.render('privacy-policy');
    });

    app.get('/legalMentions', function (req, res) {
        res.render('legalMentions');
    });


    /*

    Routes des employés

     */

    app.get('/employee/dashboard', is_authentificatedAsEmployee, function (req, res) {
        res.render(__dirname + '/Views/user/employe/dashboard',
            {
                name: userModel.getUserNameWithId(req.session.userid),
                howManyOffers: offers.countOffers(req.session.userid),
                messagesRecieve: messages.countMessagesRecieve(req.session.userid),
                messagesSend: messages.countMessagesSend(req.session.userid)
            });
    });

    app.get('/employee/cv', is_authentificatedAsEmployee, function (req, res) {
        res.render(__dirname + '/Views/user/employe/cv', {results: userModel.getUserCvMotivation(req.session.userid)});
    });

    app.get('/employee/offers', is_authentificatedAsEmployee, function (req, res) {
        res.render(__dirname + '/Views/user/employe/offers', {offers: offers.listWhere(req.query.q)});
    });

    app.get('/employee/messages', is_authentificatedAsEmployee, function (req, res) {
        let conv = messages.getConversations(req.session.userid)

        for (let i = 0; i < conv.length; i++) {
            conv[i].sender = (userModel.isAdministrator(conv[i].sender)) ? 'L\' équipe de  OnlySkills' : 'L\' équipe de ' + userModel.getCompanyNameWithId(conv[i].sender)
            conv[i].title = conv[i].announce
            if (conv[i].title == undefined) {

                conv[i].title = 'Message de l\'équipe de OnlySkills'
            }

        }


        res.render((__dirname + '/Views/user/employe/messages'), {conv: conv});
    })

    app.post('/employee/conversation', is_authentificatedAsEmployee, function (req, res) {

        let CurrentUser = req.session.userid

        let Announce_id = (req.body.IdAnnonce != undefined) ? req.body.IdAnnonce : '0'

        let OtherUser = (req.session.userid != req.body.idSender) ? req.body.idSender : req.body.idDest

        OtherUser = (OtherUser == undefined) ? req.body.other : OtherUser

        if (req.body.newMessageContent != undefined) {
            console.log(Announce_id)
            messages.addMessage(CurrentUser, OtherUser, req.body.newMessageContent, Announce_id)
        }
        res.render(__dirname + '/Views/user/employe/conversation', {

                conv: {
                    name: (OtherUser == 0) ? 'L\'équipe OnlySkills' : 'L\'utilisateur n°' + OtherUser,
                    Company: (userModel.getCompanyNameWithId(OtherUser) == 'NULL') ? (OtherUser != 0) ? 'Futur employé(e)' : 'Aidez nous à resoudre vos problèmes' : "de " + userModel.getCompanyNameWithId(OtherUser)
                },
                messages: messages.getMessagesBetweenBoth(CurrentUser,
                    OtherUser,
                    (userModel.getCompanyNameWithId(OtherUser) == 'NULL' ? '' : userModel.getCompanyNameWithId(OtherUser))),
                users: {
                    current: CurrentUser,
                    other: OtherUser
                }

            }
        );
    });
    app.get('/employee/conversation/:id', is_authentificatedAsEmployee, function (req, res) {
        res.render(__dirname + '/Views/user/employe/conversation');
    });

    app.get('/employee/settings', csrfProtection, is_authentificatedAsEmployee, function (req, res) {

        res.render(__dirname + '/Views/user/employe/settings', {
            results: userModel.getAllUserData(req.session.userid),
            csrfToken: req.csrfToken()
        });
    });


    const storageAvatar = multer.diskStorage({
        destination: function (req, file, cb) {
            // Uploads is the Upload_folder_name
            cb(null, __dirname + "/../public/store/avatar");
        },
        filename: function (req, file, cb) {
            cb(null, req.session.userid + path.extname(
                file.originalname).toLowerCase())
        }
    });

    const uploadAvatar = multer({
        storage: storageAvatar,
        limits: {fileSize: 1 * 1000 * 1000},
        fileFilter: function (req, file, cb) {
            var filetypes = /(png)/;
            var mimetype = filetypes.test(file.mimetype);

            var extname = filetypes.test(path.extname(
                file.originalname).toLowerCase());

            if (mimetype && extname) {
                return cb(null, true);
            }
        }

    }).single("avatar");

    app.post('/employee/settings', function (req, res) {

        uploadAvatar(req, res, function (err) {

            if (err) {
                console.log("not good format")
            }

            /*
            if (typeof req.file !== 'undefined' && req.file.size > 0) {
                userModel.changeUserCv('file', 'store/cv/' + req.session.userid + '.pdf', req.session.userid);
            }
             */
            userModel.modifyUser(req.session.userid, req.body);
        });

        res.redirect('/employee/settings');
    });

    app.get('/employee/settings/download-rgpd', is_authentificatedAsEmployee, function (req, res) {
        res.send(userModel.downloadDataCompany(req.session.userid));
    });

    app.post('/employee/settings/delete-account', parseForm, csrfProtection, is_authentificatedAsEmployee, function (req, res) {
        userModel.deleteUser(req.session.userid);
        req.session = null;
        res.redirect('/signin');
    });


    app.post('/employee/Signaler_message-form', is_authentificatedAsEmployee, function (req, res) {


        res.render(__dirname + '/Views/user/employe/report_message-form', {message: messages.getMessage(req.body.messageId)});

    })


    app.post('/employee/checkSignaler_message', is_authentificatedAsEmployee, function (req, res) {
        messages_report.add_a_report(req.body.id, req.body.desc)
        res.redirect('/employee/messages');

    })

    app.post('/employee/Supprimer_message-form', is_authentificatedAsEmployee, function (req, res) {

        messages.deleteMessage(req.body.messageId)

        let CurrentUser = req.session.userid

        let OtherUser = req.body.other

        res.render(__dirname + '/Views/user/employe/conversation', {
                conv: {
                    name: 'Utilisateur n° :' + OtherUser,
                    Company: (userModel.getCompanyNameWithId(OtherUser) == 'NULL') ? (OtherUser != 0) ? 'Futur employé(e)' : 'Aidez nous à resoudre vos problèmes' : "de " + userModel.getCompanyNameWithId(OtherUser)
                },
                messages: messages.getMessagesBetweenBoth(CurrentUser, OtherUser),
                users: {
                    current: CurrentUser,
                    other: OtherUser,
                }

            }
        );


    })


    /*
    Routes entreprise
     */
    app.get('/company/add-offers', is_authentificatedAsCompany, function (req, res) {

        res.render(__dirname + '/Views/user/company/add-offers-form', {
            companyName: userModel.getCompanyNameWithId(req.session.userid)
        });
    });

    app.post('/company/add-offers', is_authentificatedAsCompany, (req, res) => {

        offers.addOffers(req.body.company, req.body.title, req.body.Job, req.body.city, req.body.pay, req.body.desc, req.session.userid)


        res.render(__dirname + '/Views/user/company/add-offers', {
            companyName: userModel.getCompanyNameWithId(req.session.userid),
            name: userModel.getUserNameWithId(req.session.userid)
        });
    });

    app.get('/company/dashboard', is_authentificatedAsCompany, function (req, res) {
        res.render(__dirname + '/Views/user/company/dashboard', {
            name: userModel.getUserNameWithId(req.session.userid),
            company: userModel.getCompanyNameWithId(req.session.userid),
            howManyOffers: offers.countOffers(req.session.userid),
            messagesRecieve: messages.countMessagesRecieve(req.session.userid),
            messagesSend: messages.countMessagesSend(req.session.userid)
        });
    });


    app.get('/company/messages', is_authentificatedAsCompany, function (req, res) {
        let convs = messages.getConversations(req.session.userid)


        for (let i = 0; i < convs.length; i++) {
            convs[i].title = convs[i].announce
            if (convs[i].title == undefined) {
                convs[i].title = 'Message de l\'équipe de OnlySkills'
            }

        }


        res.render(__dirname + '/Views/user/company/messages', {
            conv: convs
        });
    });

    app.post('/company/conversation', is_authentificatedAsCompany, function (req, res) {

        let CurrentUser = req.session.userid


        let OtherUser = (req.session.userid != req.body.idSender) ? req.body.idSender : req.body.idDest

        OtherUser = (OtherUser == undefined) ? req.body.other : OtherUser

        if (req.body.newMessageContent != undefined) {
            messages.addMessage(CurrentUser, OtherUser, req.body.newMessageContent, '0')
        }

        res.render(__dirname + '/Views/user/company/conversation', {
                conv: {
                    name: (OtherUser == 0) ? 'L\'équipe OnlySkills' : 'L\'utilisateur n°' + OtherUser,
                    Company: (userModel.getCompanyNameWithId(OtherUser) == 'NULL') ? (OtherUser != 0) ? 'Futur employé(e)' : 'Aidez nous à resoudre vos problèmes' : "de " + userModel.getCompanyNameWithId(OtherUser)
                },
                messages: messages.getMessagesBetweenBoth(
                    CurrentUser,
                    OtherUser,
                    'Anonyme'),
                users: {
                    current: CurrentUser,
                    other: OtherUser
                }

            }
        );
    });


    app.get('/company/my-offers', is_authentificatedAsCompany, function (req, res) {


        res.render(__dirname + '/Views/user/company/offers', {
            toAdd: {company: userModel.getCompanyNameWithId(req.session.userid)},
            offers: offers.getOffersWithIdSender(req.session.userid)
        });
    })


    app.post('/company/update', is_authentificatedAsCompany, function (req, res) {


        if (userModel.getCompanyNameWithId(req.body.idSender) == userModel.getCompanyNameWithId(req.session.userid))
            res.render(__dirname + '/Views/user/company/update-offer-form', offers.getAllWithIdOffer(req.body.IdAnnonce));

    })

    app.post('/company/update-checked', is_authentificatedAsCompany, function (req, res) {
        offers.UpdateOffer(req.body.title, req.body.Job, req.body.city, req.body.pay, req.body.desc, req.body.idAnnounce)

        //res.render(__dirname + '/Views/user/company/dashboard', offers.getAllWithIdOffer(req.body.IdAnnonce));
        res.redirect('/company/dashboard');
    })


    app.post('/company/delete', is_authentificatedAsCompany, function (req, res) {

        if (userModel.getCompanyNameWithId(req.body.idSender) == userModel.getCompanyNameWithId(req.session.userid)) {
            offers.DeleteOffer(req.body.IdAnnonce, req.session.userid);
        }
        res.redirect('/company/my-offers')

    })


    app.get('/company/settings', csrfProtection, is_authentificatedAsCompany, function (req, res) {
        res.render(__dirname + '/Views/user/company/settings',
            {
                results: userModel.getAllCompanyData(req.session.userid),
                csrfToken: req.csrfToken()
            });
    });

    app.post('/company/settings', is_authentificatedAsCompany, function (req, res) {

        uploadAvatar(req, res, function (err) {

            if (err) {
                console.log("not good format")
            }

            /*
            if (typeof req.file !== 'undefined' && req.file.size > 0) {
                userModel.changeUserCv('file', 'store/cv/' + req.session.userid + '.pdf', req.session.userid);
            }

             */
            console.log(req.body)
            userModel.modifyCompanyUser(req.session.userid, req.body);
        });

        res.redirect('/company/settings');
    });

    app.get('/company/settings/download-rgpd', is_authentificatedAsCompany, function (req, res) {
        res.send(userModel.downloadDataCompany(req.session.userid));
    });

    app.post('/company/settings/delete-account', parseForm, csrfProtection, is_authentificatedAsCompany, function (req, res) {
        userModel.deleteUser(req.session.userid);
        req.session = null;
        res.redirect('/signin');
    });


    app.post('/company/Signaler_message-form', is_authentificatedAsCompany, function (req, res) {


        res.render(__dirname + '/Views/user/company/report_message-form', {message: messages.getMessage(req.body.messageId)});

    })


    app.post('/company/checkSignaler_message', is_authentificatedAsCompany, function (req, res) {
        messages_report.add_a_report(req.body.id, req.body.desc)
        res.redirect('/company/messages');

    })

    app.post('/company/Supprimer_message-form', is_authentificatedAsCompany, function (req, res) {

        messages.deleteMessage(req.body.messageId)

        let CurrentUser = req.session.userid

        let OtherUser = req.body.other

        res.render(__dirname + '/Views/user/company/conversation', {
                conv: {
                    name: (OtherUser == 0) ? 'L\'équipe OnlySkills' : 'L\'utilisateur n°' + OtherUser,
                    Company: (userModel.getCompanyNameWithId(OtherUser) == 'NULL') ? (OtherUser != 0) ? 'Futur employé(e)' : 'Aidez nous à resoudre vos problèmes' : "de " + userModel.getCompanyNameWithId(OtherUser)
                },
                messages: messages.getMessagesBetweenBoth(
                    CurrentUser,
                    OtherUser,
                    'Anonyme'),
                users: {
                    current: CurrentUser,
                    other: OtherUser
                }

            }
        );


    })

    app.post('/company/profile', is_authentificatedAsCompany, function (req, res) {
        res.render(__dirname + '/Views/user/company/profile', {results: userModel.getUserProfileData(req.body.id)});
    });


    /*
    Routes admin

     */


    app.get('/admin/dashboard', is_authentificatedAsdmin, function (req, res) {
        let display = []
        let numberUser = userController.countUser()
        let numberMessages = messages.countMessages()
        let numberOffers = offers.countOffers()

        display.push({
            numberUser: numberUser,
            numberMessages: numberMessages,
            numberOffers: numberOffers,
        })

        res.render(__dirname + '/Views/admin/dashboard', {display: display});
    });

    app.get('/admin/users', is_authentificatedAsdmin, function (req, res) {

        user = []
        for (const reqElement of userController.getUsersList(req.query.q)) {
            user.push({
                id: reqElement.id,
                company: (reqElement.companyName == 'NULL') ? 'futur employé' : reqElement.companyName,
                name: reqElement.lastName + " " + reqElement.firstName,
                mail: reqElement.email,
                pwd: reqElement.password,


            })

        }


        res.render(__dirname + '/Views/admin/users-info', {users: user});
    });


    app.get('/admin/messages', is_authentificatedAsdmin, function (req, res) {

        let convs = messages.getConversations(req.session.userid)


        res.render(__dirname + '/Views/admin/messages', {
            conv: convs
        });
    });

    app.post('/admin/conversation', is_authentificatedAsdmin, function (req, res) {
        let CurrentUser = req.session.userid


        let OtherUser = (req.body.other == undefined) ? req.body.idSender : req.body.other


        if (req.body.newMessageContent != undefined) {

            messages.addMessage(CurrentUser, req.body.other, req.body.newMessageContent, '0')
        }

        res.render(__dirname + '/Views/admin/conversation', {
                conv: {
                    name: userModel.getUserNameWithId(OtherUser) + "  " + userModel.getUserLastNameWithId(OtherUser),
                    Company: (userModel.getCompanyNameWithId(OtherUser) == 'NULL') ? 'Futur employé(e)' : "de " + userModel.getCompanyNameWithId(OtherUser)
                },
                messages: messages.getMessagesBetweenBoth(CurrentUser, OtherUser),
                users: {
                    current: CurrentUser,
                    other: OtherUser
                }

            }
        );
    });


    app.post('/admin/conversation/add-message', is_authentificatedAsdmin, function (req, res) {
        let CurrentUser = req.session.userid

        let OtherUser = req.body.other

        res.redirect('/admin/conversation/', {
            idSender: CurrentUser,
            idDest: OtherUser
        })


    });

    app.post('/admin/deleteAccount', is_authentificatedAsdmin, function (req, res) {
        res.render(__dirname + '/Views/admin/confirmDeleteAccount', {user: userController.getUsersInfo(req.body.idAccount)});
    })
    app.post('/admin/deletedAccount', is_authentificatedAsdmin, function (req, res) {
        userModel.deleteUser(req.body.id)
        res.redirect('/admin/dashboard/');
    })


    app.post('/admin/userProfil', is_authentificatedAsdmin, function (req, res) {

        let userInfo = userController.getUsersInfo(req.body.idAccount)

        let user = [
            {
                accountType: (userInfo.typeAccount == 0) ? 'Compte Employé' : 'Compte Entreprise',
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                mail: userInfo.email,
                password: userInfo.password,
                date: userInfo.created_at,
                question: (userInfo.questionForgot == undefined || userInfo.responseForgot == undefined) ? 'L\'utilisateur n\'a pas proposé de question ni de réponse  lors de l\'incription' : 'La question de l\'utilisateur  est :  ' + userInfo.questionForgot + ' à la quelle il faut répondre  : ' + userInfo.responseForgot,

                typeAccount: (userInfo.typeAccount == 0) ? 'Cet utilisateur est  à la recherche d\'un emploi ' : 'Cet utilisateur travaille pour ' + userInfo.companyName
            }
        ]


        res.render(__dirname + '/Views/admin/userProfile', {user});
    })


    app.post('/admin/Signaler_message-form', is_authentificatedAsdmin, function (req, res) {


        res.render(__dirname + '/Views/admin/report_message-form', {message: messages.getMessage(req.body.messageId)});

    })


    app.post('/admin/checkSignaler_message', is_authentificatedAsdmin, function (req, res) {
        messages_report.add_a_report(req.body.id, req.body.desc)
        res.render(__dirname + '/Views/admin/checkedReportingMessage', {name: userModel.getUserNameWithId(req.session.userid)});


    })

    app.post('/admin/Supprimer_message-form', is_authentificatedAsdmin, function (req, res) {

        messages.deleteMessage(req.body.messageId)

        let CurrentUser = req.session.userid

        let OtherUser = req.body.other

        res.render(__dirname + '/Views/admin/conversation', {
                conv: {
                    name: userModel.getUserNameWithId(OtherUser) + "  " + userModel.getUserLastNameWithId(OtherUser),
                    Company: (userModel.getCompanyNameWithId(OtherUser) == 'NULL') ? 'Futur employé(e)' : "de " + userModel.getCompanyNameWithId(OtherUser)
                },
                messages: messages.getMessagesBetweenBoth(CurrentUser, OtherUser),
                users: {
                    current: CurrentUser,
                    other: OtherUser
                }

            }
        );


    })

    app.get('/admin/offers/', function (req, res) {

        res.render(__dirname + '/Views/admin/offers', {offers: offers.listWhere(req.query.query)});

    });
    app.post('/admin/delete', function (req, res) {
        offers.DeleteOffer(req.body.IdAnnonce)

        res.redirect('/admin/offers')
    })

    app.get('/admin/report', function (req, res) {
        res.render(__dirname + '/Views/admin/reportMessages', {messages: messages.getMessagesReports()});
    });
    app.post('/admin/deleteReport', function (req, res) {
        messages.deleteReport(req.body.id)
        res.render(__dirname + '/Views/admin/reportMessages', {messages: messages.getMessagesReports()});
    });


    /*
    Routes Utilisateurs
     */

    app.post('/signup',
        [
            body('firstName').not().isEmpty().withMessage('Le prenom doit faire au moins 5 caractères'),
            body('lastName').not().isEmpty().withMessage('Le nom doit faire au moins 5 caractères'),
            body('personalQuestion').not().isEmpty().withMessage('La question personnelle  doit faire au moins 5 caractères'),
            body('personalResponse').not().isEmpty().withMessage('La reponse personnelle doit faire au moins 5 caractères'),
            body('email', 'Your email is not valid').not().isEmpty(),
            body('corporationName', 'Choose a weekday').isLength({min: 2}).withMessage('Le nom de l\'entreprise  doit faire au moins 5 caractères').optional(),
            body("password", "'Le mot de passe  doit faire au moins 5 caractères")
                .isLength({min: 5})
                .custom((value, {req, loc, path}) => {
                    if (value !== req.body.confirmPassword) {
                        throw new Error("Les mots de passes ne correspondent pas ");
                    } else {
                        return value;
                    }
                }),
        ],
        function (req, res) {

            const errors = validationResult(req);

            var errorArray = errors.array();


            if (errors.isEmpty()) {
                let userSignUp = userModel.signUpGlobal(
                    {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        password: req.body.password,
                        corporationName: req.body.corporationName,
                        personalQuestion: req.body.personalQuestion,
                        personalResponse: req.body.personalResponse,
                        company: req.body.corporationName


                    }
                );


                if (userSignUp == (-1 || undefined)) {
                    res.render('signup', {errors: {allErrors: {msg: 'Une erreur est survenue, veuillez réessayer.'}}});
                } else if (userSignUp == -2) {
                    res.render('signup', {errors: {allErrors: {msg: 'Adresse-email déjà prise !'}}});
                } else {
                    res.render("checkedSignup", {name: req.body.firstName, mail: req.body.email});
                }
            } else {
                res.render('signup', {errors: {allErrors: errorArray}});
            }

        });

    /* Route pour le login */

    app.post('/signin',
        [
            body('email', 'Le mail est invalide').not().isEmpty(),
            body("password", "Le mot de passe doit contenir au moins 5 caratères").not().isEmpty().withMessage('Mauvais mot de passe'),
        ],
        function (req, res) {

            const errors = validationResult(req);

            var errorArray = errors.array();

            if (errors.isEmpty()) {

                let userSignInResponse = userModel.signIn(
                    req.body.email,
                    req.body.password,
                );

                if (userSignInResponse != -1) {

                    req.session.userid = userSignInResponse.id;
                    req.session.username = userSignInResponse.firstName + ' ' + userSignInResponse.lastName;
                    switch (userController.redirectUser(userSignInResponse.typeAccount)) {
                        case 0:
                            req.session.typeAccount = 'employee';
                            break;

                        case 1:
                            req.session.typeAccount = 'company';
                            break;
                        case 2:
                            req.session.typeAccount = 'admin';
                            break;

                    }

                    res.redirect('/' + req.session.typeAccount + '/dashboard');


                } else {
                    res.render('signin', {
                        errors: {
                            allErrors: {
                                msg: 'Mauvaise combinaison Adresse-mail / Mot de passe'
                            }
                        }
                    });
                }

            } else {

                res.render('signin', {
                    errors: {
                        allErrors: errorArray
                    }
                });

            }

        });

    /*
        Route pour la création d'un CV + Motivation.
     */

    app.post('/employee/delete', function (req, res) {

        switch (req.body.delete) {
            case "cv":
                userModel.deleteFile("cv", req.session.userid);
                break;
            case "motivation":
                userModel.deleteFile("motivation", req.session.userid);
                break;
            default:
                break;
        }

        res.redirect('/employee/cv');

    });

    const storageCv = multer.diskStorage({
        destination: function (req, file, cb) {
            // Uploads is the Upload_folder_name
            cb(null, __dirname + "/../public/store/cv");
        },
        filename: function (req, file, cb) {
            cb(null, req.session.userid + ".pdf")
        }
    });

    const uploadCv = multer({
        storage: storageCv,
        limits: {fileSize: 1 * 1000 * 1000},
        fileFilter: function (req, file, cb) {
            var filetypes = /pdf/;
            var mimetype = filetypes.test(file.mimetype);

            var extname = filetypes.test(path.extname(
                file.originalname).toLowerCase());

            if (mimetype && extname) {
                return cb(null, true);
            }
        }

    }).single("cv-file");

    const storageMotivation = multer.diskStorage({
        destination: function (req, file, cb) {
            // Uploads is the Upload_folder_name
            cb(null, __dirname + "/../public/store/motivation");
        },
        filename: function (req, file, cb) {
            cb(null, req.session.userid + ".pdf")
        }
    });

    const uploadMotivation = multer({
        storage: storageMotivation,
        limits: {fileSize: 1 * 1000 * 1000},
        fileFilter: function (req, file, cb) {
            var filetypes = /pdf/;
            var mimetype = filetypes.test(file.mimetype);

            var extname = filetypes.test(path.extname(
                file.originalname).toLowerCase());

            if (mimetype && extname) {
                return cb(null, true);
            }
        }

    }).single("motivation-file");

    app.post('/employee/cv',
        function (req, res) {

            if (req.body['cv-text'] !== null && req.body['cv-text'] !== '' && req.body['cv-text'] != undefined) {
                userModel.changeUserCv('text', req.body['cv-text'], req.session.userid);
            }

            if (req.body['motivation-text'] !== null && req.body['motivation-text'] !== '' && req.body['motivation-text'] != undefined) {
                userModel.changeUserMotivation('text', req.body['motivation-text'], req.session.userid);
            }

            uploadCv(req, res, function (err) {

                if (err) {
                    //Rajouter message erreur
                }

                //Check si il y a bien un fichier qui s'upload
                if (typeof req.file !== 'undefined' && req.file.size > 0) {
                    userModel.changeUserCv('file', 'store/cv/' + req.session.userid + '.pdf', req.session.userid);
                }
            });


            uploadMotivation(req, res, function (err) {

                if (err) {
                    //Rajouter message erreur
                }

                if (typeof req.file !== 'undefined' && req.file.size > 0) {
                    userModel.changeUserMotivation('file', 'store/motivation/' + req.session.userid + '.pdf', req.session.userid);
                }
            });

            res.redirect('/employee/cv');

        });

    /*

    MiddleWares :

     */

    function is_authentificatedAsCompany(req, res, next) {

        if (req != undefined) {
            if (req.session.length == 0) {
                res.render(__dirname + '/Views/errors/403');
            } else if (userController.redirectUser(req.session.typeAccount) == 'company') {
                next();
            } else {
                res.render(__dirname + '/Views/errors/403');
            }
        }


    }

    function is_authentificatedAsEmployee(req, res, next) {

        if (req.session.length == 0) {
            res.render(__dirname + '/Views/errors/403');
        } else if (userController.redirectUser(req.session.typeAccount) == 'employee') {
            next();
        } else {
            res.render(__dirname + '/Views/errors/403');


        }

    }

    function is_authentificatedAsdmin(req, res, next) {

        if (req != undefined) {
            if (req.session.length == 0) {
                res.render(__dirname + '/Views/errors/403');
            } else if (req.session.typeAccount == 'admin') {
                next();
            } else {
                res.render(__dirname + '/Views/errors/403');


            }
        }


    }


    function redirect_if_logged(req, res, next) {
        if (res.locals.authenticated) {
            res.redirect('/' + userController.redirectUser(req.session.typeAccount) + '/dashboard')
        } else {
            next();
        }
    }

    function is_user_connected(req, res, next) {
        if (req.session.length == 0) {
            res.locals.authenticated = false;
        } else {
            res.locals.authenticated = true;
            res.locals.userId = req.session.userid;
            res.locals.userName = req.session.username;
            res.locals.typeAccount = req.session.typeAccount;
        }
        next();
    }

    /*
    Routes pour les erreurs
     */

    app.use(function (req, res, next) {
        res.render(__dirname + '/Views/errors/404');
    });


}
