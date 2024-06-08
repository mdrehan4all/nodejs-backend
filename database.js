const mysql = require("mysql2");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}).promise();

/* Functions */
function sha256(string) {
    return crypto.createHash('sha256').update(string).digest('hex');
}

async function getUsers(){
    let [row] = await pool.query("SELECT * FROM users");
    return row;
}

async function getUser(id){
    let [row] = await pool.query("SELECT id,name,email,token,cdate FROM users WHERE id=?", [id]);
    return row;
}

async function addUser(email, password, name){
    try{
        let [result] = await pool.query("INSERT INTO users (email, password, name)values(?, ?, ?)", [email, password, name]);
        let id = result.insertId;
        await updateToken(id);
        let user = await getUser(id);
        user[0].status = 1;
        user[0].message = 'Successfully Created';
        return user[0];
    }catch(err){
        console.log('addUser Error');
        return { status: 0, message: 'Something went wrong'};
    }
}

async function loginUser(email, password) {
    try {
        let [result] = await pool.query("SELECT id,name,email,password, token FROM users WHERE email=?", [email]);
        // console.log(result[0]?.password, password)
        if(result[0].password == password) {
            let id = result[0].id;
            let name = result[0].name;
            let email = result[0].email;
            let token = await updateToken(id);
            return { status: 1, message: 'Logged', token: token, name: name, email: email}
        } else {
            return { status: 0, message: 'Something went wrong'};
        }
    } catch(err) {
        console.log(err)
    }
}

async function isLogged(token) {
    try {
        let [result] = await pool.query("SELECT id,name,email,cdate, token FROM users WHERE token=?", [token]);
        // console.log(result[0]?.password, password)
        if(result[0]) {
            let id = result[0].id;
            let name = result[0].name;
            let email = result[0].email;
            return { status: 1, id: id, name: name, email: email}
        } else {
            return { status: 0 };
        }
    } catch(err) {
        console.log(err)
    }
}

async function updateToken(id){
    const random = Math.random() * 1000;
    const time = Date.now();
    let token = sha256(random+"-"+time+"-"+id);

    try{
        let [result] = await pool.query("UPDATE users SET token=? WHERE id=?", [token, id]);
        //console.log(result)
    }catch(err){
        console.log('Error')
    }
    return token;
}

module.exports = {getUsers, getUser, addUser, loginUser, isLogged};