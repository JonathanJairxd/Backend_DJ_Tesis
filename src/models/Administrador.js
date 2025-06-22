import {Schema, model} from 'mongoose';
import bcrypt from "bcryptjs";

const administradorSchema = new Schema({
    nombre:{
        type:String,
        require:true,
        trim:true // elimina espacios innecesarios
    },
    apellido:{
        type:String,
        require:true,
        trim:true
    },
    direccion:{
        type:String,
        trim:true,
        default:null 
    },
    telefono:{
        type:Number,
        trim:true,
        default:null
    },
    email:{
        type:String,
        require:true,
        trim:true,
		unique:true // debe ser unico
    },
    password:{
        type:String,
        require:true
    },
    descripcion: {
        type: String,
        trim: true,
        default: null   
    },
    status:{
        type:Boolean,
        default:true
    },
    token:{
        type:String,
        default:null
    },

}, {
    timestamps:true  // Crea createdAt y updatedAt de forma automática
})

// Método para cifrar el password del administrador
administradorSchema.methods.encrypPassword = async function(password){
    const salt = await bcrypt.genSalt(10)
    const passwordEncryp = await bcrypt.hash(password,salt)
    return passwordEncryp
}

// Método para verificar si el password ingresado es el mismo de la BDD
administradorSchema.methods.matchPassword = async function(password){
    const response = await bcrypt.compare(password,this.password)
    return response
}

// Método para crear un token 
administradorSchema.methods.crearToken = function(){
    const tokenGenerado = this.token = Math.random().toString(36).slice(2)
    return tokenGenerado
}

// Se exporta el modelo
export default model('Administrador',administradorSchema)