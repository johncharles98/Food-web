const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    userid:{
        type: String,
        required: true
    },
    qty:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true 
    },
    price: {
        type: String,
        required: true 
    },
    image: {
        type: String,
        required: true ,    
    }
})


module.exports = mongoose.model("Order" , orderSchema)