require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ContactosController = require('./Controllers/ContactosControllers');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require('passport');
const session = require('express-session');
const mongoose = require("mongoose");
let mysql = require("mysql");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(ContactosController);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', indexRouter);
app.use('/users', usersRouter);
const uri = process.env.DB_URL;

const client = new mongoose.Mongoose();

async function run() {
    try {
        await mongoose.connect(uri, {
            bufferTimeoutMS: 60000
            serverApi: "1"
        });
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

run().catch(console.error);
const Schema = mongoose.Schema;
const usuarioSechema = new Schema({
    username: String,
    googleId: String,
});

usuarioSechema.plugin(passportLocalMongoose);
usuarioSechema.plugin(findOrCreate);
const Usuario = mongoose.model("Usuario", usuarioSechema);
passport.use(Usuario.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.Client_ID,
    clientSecret: process.env.Client_Secret,
    callbackURL: process.env.Client_URL
},
    async function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        try {
            const user = await Usuario.findOne({ googleId: profile.id }).exec();
            return cb(null, user);
        } catch (err) {
            return cb(err, null);
        }
    }));
app.route("/Login")
    .get(function (req, res) {
        res.render("Login");
    });
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.route("/auth/google/contactos")
    .get(passport.authenticate('google', { failureRedirect: "/Login" }),
        function (req, res) {
            res.redirect("/contactos");
        });



app.route("/Formulario")
    .get(function (req, res) {
        res.render("Formulario");
    });
app.route("/cv")
    .get(function (req, res) {
        const data = {
            title: 'Curriculum',
            Name: 'Luis',
            Lastname: 'Ayala',
            Mail: 'Luisjqayala98@gmail.com',
            School: 'U.E.C.A "Angel De La Guarda" ',
            Phone: '04145861216',
        };
        res.render('cv', data);
    });

app.route("/contactos")
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            const connection = mysql.createConnection({
                host: process.env.SQLHOST,
                user: process.env.SQLUSER,
                password: process.env.SQLPASSWORD,
                database: process.env.SQLDatabase
            });

            connection.connect((err) => {
                if (err) {
                    console.error("Error connecting to database:", err);
                    res.status(500).send("Error connecting to database");
                    return;
                }
                connection.query("SELECT * FROM datos", (err, rows, fields) => {
                    if (err) {
                        console.error("Error running query:", err);
                        res.status(500).send("Error running query");
                        return;
                    }

                    const data = {
                        title: 'contactos',
                        records: rows,
                    };

                    res.render("contactos", data);
                    connection.end();
                });
            });
        } else {
            res.render("Login");
        }
    });





app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
