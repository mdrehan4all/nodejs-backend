const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');
var cors = require('cors')
const database = require("./database");

dotenv.config();
const app = express();

const PORT = process.env.PORT;
const ROOTDIR = process.env.ROOTDIR

app.use(express.json());
app.use(cors());
app.use((err, req, res, next)=>{
    console.log(err);
})

/* Functions */
function sha256(string) {
    return crypto.createHash('sha256').update(string).digest('hex');
}


app.get(ROOTDIR + "/", async (req, res)=>{
    res.status(200);
    res.send({
        "message": "Hello World from REST API"
    });
});

app.get(ROOTDIR + "/user/:id", async (req, res)=>{
    let id = req.params.id;
    
    // Check Token
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) { return res.status(401).send({ error: 'Unauthorized: Missing bearer token' }); }
    let isLogged = await database.isLogged(token);
    if(isLogged.status == 0){ return res.status(401).send({ error: 'Unauthorized: Invalid bearer token' }); }
    if(isLogged.status == 1){ console.log("Authorized") }
    // Check Token End

    let user = await database.getUser(id);

    res.status(200)
    res.send(user);
});

app.get(ROOTDIR + "/users", async (req, res)=>{
    
    // Check Token
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) { return res.status(401).send({ error: 'Unauthorized: Missing bearer token' }); }
    let isLogged = await database.isLogged(token);
    if(isLogged.status == 0){ return res.status(401).send({ error: 'Unauthorized: Invalid bearer token' }); }
    if(isLogged.status == 1){ console.log("Authorized") }
    // Check Token End

    let users = await database.getUsers();
   
    res.status(200);
    res.send(users);
});

app.post(ROOTDIR + "/signup", async (req, res)=>{
    let body = req.body;
    let name = body.name;
    let email = body.email;
    let password = body.password;
    let password_sha256 = sha256(password);

    let user = await database.addUser(email, password_sha256, name);
    
    res.status(200)
    res.send(user);
});

app.post(ROOTDIR + "/login", async (req, res)=>{
    let body = req.body;
    let email = body.email;
    let password = body.password;
    let password_sha256 = sha256(password);

    let result = await database.loginUser(email, password_sha256);

    res.status(200);
    res.send(result);
});


app.listen(PORT, ()=>{
    console.log(`App is listening at ${PORT}`);
})