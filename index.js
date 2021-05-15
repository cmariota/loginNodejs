const express = require('express');
var jwt = require('jsonwebtoken')
const session = require('express-session');
var bodyParser = require('body-parser');
port = process.env.port || 4000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// conection Redis

var { createClient } = require('then-redis')
const client = createClient({
    port: 6379,
    host: "localhost",
    password: "carla.lamejor",
});
// client.select(1)
client.on('error', (err) => {
    console.error("Ha ocurrido un error", err)
})
client.on('ready', () => {
    console.info(`[  DB  ]  *** Conected :)`)
})

/////////////////////////////////////////////////////////////////////////

function RegisterPerson(req,res){
    const {username,password} = req.body;
    let user = {
        username,
        password
    }
    if (user.username ==='' || user.password === ''){
        res.respuesta= {
            error: true, 
            codigo:501,
            mensaje:'Se requiere que llene todos los campos :('
        };
        res.json(res.respuesta);
    }else{
        client.set(`person_${username}`,JSON.stringify(user))
        jwt.sign({user:user},'secretkey',{expiresIn:'3600s'},(err,token) =>{ // esto crea el token 
            res.respuesta = {
                error:false,
                codigo:200,
                mensaje: 'El usuario creado correctamente :)',
                respuesta: token
            };
            res.json(res.respuesta);
        }); 
    }

}

async function LoginPerson(req,res){
    const{username,password}= req.body;
    let user = {
        username,
        password
    } 
    if(username == "" || password ==""){
        res.respuesta= {
            error: true, 
            codigo:501,
            mensaje:'Usuario no esta registrado en la base de datos:('
        };
        res.json(res.respuesta);
    }else{
        var resultado = await client.get(`person_${username}`)
        
        if (resultado == null){
                res.respuesta = {
                    error:false,
                    codigo:200,
                    mensaje: 'El usuario no se encuentra :(',
                    respuesta: ""
                };
                res.json(res.respuesta);
            
        }else{
                var persona = JSON.parse(resultado)
                
            if (persona.password != user.password){
                res.respuesta ={
                    error:false,
                    codigo:200,
                    mensaje: 'Contraseña incorrecta :(',
                    respuesta: ""
                };
                res.json(res.respuesta);
            }else{
                jwt.sign({user:user},'secretkey',{expiresIn:'3600s'},(err,token) =>{ // esto crea el token
                    res.respuesta = {
                        error:false,
                        codigo:200,
                        mensaje: 'has ingresado correctamente :)',
                        respuesta: token
                    };
                    res.json(res.respuesta);
                });

            }
            
            
        }

    }
}

function AddService(req,res){
    const{costo,latitud,username,longitud,email}= req.body;
    let service = {
        username,
        costo,
        latitud,
        longitud,
        email
    }
    
    if(service.costo == "" && service.username== "" && service.latitud ==  "" && service.longitud == "" && service.email == ""){
        res.respuesta={
            error:false,
            codigo:200,
            mensaje: 'No pueden estar en blanco los campos :(',
            respuesta: token
        }

        res.json(res.respuesta)
    }else {
        client.set(`service_${username}`,JSON.stringify(service))
        res.respuesta={
            error:false,
            codigo:200,
            mensaje: 'Servicio agregado exitosamente :)',
            respuesta: ""
        }

        res.json(res.respuesta)
    }
}

async function ReadService(req,res){
    console.log("holaaaaa:)")
    const{username}=req.body;
    let service={
        username
    }
    var resultado = await client.keys(`service_${username}*`)
    if (resultado.length >0){
        var persona = await  client.get(resultado)
        var personajson = JSON.parse(persona)
        res.respuesta = {
            error: false,
            codigo: 200,
            mensaje: 'Servicio encontrado exitosamente :)'


        };
        
        return res.json(personajson) 
        

    }else {
        res.respuesta = {
            error: false,
            codigo: 200,
            mensaje: 'No se encontro el servicio con ese id :('

        }
        return res.json(res.respuesta);
        
    }
    
}

async function ReadAllService(req,res){
    var resultado = await client.keys(`service_*`)
    
    if (resultado.length>0){
        var persona = await  client.mget(resultado)
        
        res.respuesta = {
            error: false,
            codigo: 200,
            mensaje: 'Servicio encontrado exitosamente :)',
            resultado: persona
        };
        res.json(res.respuesta)
    }else {
        res.respuesta = {
            error: false,
            codigo: 200,
            mensaje: 'No se encontro el servicio con ese id :('

        }
        return res.json(res.respuesta);
    }
}

async function DeleteService(req,res){
    const{username}= req.body;
    let service = {
        username
    }
    var resultado = await client.keys(`service_${username}*`)
    
    if (resultado.length > 0) {
        
            res.respuesta = {
                error: false,
                codigo: 200,
                mensaje: 'Servicio eliminado exitosamente :)'

            };
            await client.del(resultado);
            res.json(res.respuesta);
    }else {
        console.log(":) jejeeje")
        res.respuesta={
            error:false,
            codigo:200,
            mensaje: 'Servicio no encontrado :())',
            respuesta: ""
        }
        return res.json(res.respuesta);
    }
    

}

function verifyToken(req,res,next){
    const bearerHeader = req.headers['authorization'];
    if(bearerHeader !== undefined){
        const bearerToken = bearerHeader.split(" ")[1];
        req.token = bearerToken;
        next();
    }else {
        res.sendStatus(403);
    }
}



app.post('/register',RegisterPerson);
app.post('/login',LoginPerson);
app.post("/addservice",verifyToken,AddService);
app.del("/deleteservice",verifyToken,DeleteService);
app.get("/readuser",verifyToken,ReadService);
app.get("/readallservice",verifyToken,ReadAllService);


app.use(function(req, res, next) {
    respuesta = {
    error: true, 
    codigo: 404, 
    mensaje: 'URL no encontrada'
    };
    res.status(404).send(respuesta);
});




app.listen(port,function(){
    console.log("server running at port "+port);
});