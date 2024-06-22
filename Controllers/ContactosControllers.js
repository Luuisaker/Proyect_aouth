require('dotenv').config();
const express = require('express');
let mysql = require("mysql");
let { datos } = require('pg');
const axios = require('axios');
const nodemailer = require("nodemailer");
const router = express.Router();
router.use(express.urlencoded({ extended: true }));


const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EmailFrom,
        pass: process.env.EmailFromPass,
    }
});

let conection = mysql.createConnection({
    host: process.env.SQLHOST,
    user: process.env.SQLUSER,
    password: process.env.SQLPASSWORD,
    database: process.env.SQLDatabase
});

router.post('/register', (req, res) => {
    let datos = req.body;
    let name = datos.name;
    let email = datos.email;
    let coment = datos.coment;
    const currentDate = new Date();
    const date = currentDate.toLocaleString();
    const recaptchaResponse = req.body['g-recaptcha-response'];

    function verifyRecaptcha(recaptchaResponse) {
        const secretKey = process.env.recaptchaSecretKey;
        axios.post('https://www.google.com/recaptcha/api/siteverify', {
            secret: secretKey,
            response: recaptchaResponse
        }).then((response) => {
            if (response.data.success) {
                

                res.send('Registration successful');
            } else {
                res.status(400).send('reCAPTCHA verification failed');
            }
        }).catch((error) => {
            console.error('Error verifying reCAPTCHA:', error);
            res.status(500).send('Internal server error');
        });
    }

    if (!name || name.length <= 0) {
        res.send(`
    <script>
      alert("Debe colocar un nombre!");
      window.location.href = "/Formulario";
    </script>
  `);
    }

    if (!email || email.length <= 0) {
        res.send(`
    <script>
      alert("Debe colocar un correo electrónico!");
      window.location.href = "/Formulario";
    </script>

  `);

    }
    if (!coment || coment.length <= 0) {
        res.send(` 
    <script>
      alert("Debe colocar un Comentario!");
      window.location.href = "/Formulario";
    </script>
  `);
    }

    else {
        axios.get(process.env.apiUrl)
            .then(response => {
                const { country_name, ip } = response.data;
                const locacion = country_name;
                const ip_adress = ip;
                const nuevoregistro = "INSERT INTO datos(`Nombre`, `Correo`, `Comentario`, `IP`, `Fecha`, `Locacion`) VALUES('" + name + "', '" + email + "', '" + coment + "','" + ip_adress + "','" + date + "','" + locacion + "')";
                conection.query(nuevoregistro, function (error, rows) {
                    if (error) {
                        throw error;
                    } else {
                        res.send(`
    <script>
      alert("Registro Completado!");
      window.location.href = "/";
    </script>
  `);
                        let mailOptions = {
                            from: process.env.EmailFrom,
                            to: process.env.EmailDestiny,
                            subject: 'Nuevo registro',
                            text: `Nuevo registro:\nNombre: ${name}\nCorreo: ${email}\nComentario: ${coment}\nIP: ${ip_adress}\nFecha: ${date}\nLocación: ${locacion}`
                        };
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Email sent: ' + info.response);
                        });
                    }
                });
            })
            .catch((error) => {
                console.error('Error fetching location:', error);
                res.status(500).send('Internal server error');
            });
    }
});
async function verifyRecaptcha(recaptchaResponse) {
    const secretKey = recaptchaSecretKey;
    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', {
            secret: secretKey,
            response: recaptchaResponse
        });
        return response;
    } catch (error) {
        throw error;
    }
}



module.exports = router;