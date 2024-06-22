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
        user: "test009@arodu.dev",
        pass: "eMail.test009",
    }
});

let conection = mysql.createConnection({
    host: "dpg-cpqfpjo8fa8c739epsng-a",
    user: "root",
    password: "dGgfscPeVeaJpXMePlrwWgTqJNAuElNI",
    database: "datos_gm0w"
});

router.post('/register', (req, res) => {
    let datos = req.body;
    let name = datos.name;
    let email = datos.email;
    let coment = datos.coment;
    const currentDate = new Date();
    const date = currentDate.toLocaleString();
    const recaptchaResponse = req.body['g-recaptcha-response'];
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS datos(
        ID INT(100) PRIMARY KEY AUTO_INCREMENT,
        Nombre VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
        Correo VARCHAR(70) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
        Comentario VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
        IP VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
        Fecha VARCHAR(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
        Locacion VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
    );
`;

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
                            from: 'test009@arodu.dev',
                            to: `luisjqayala98@gmail.com`,
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