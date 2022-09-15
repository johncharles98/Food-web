const mongoose = require("mongoose")

const foodSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true 
    },
    price: {
        type: String,
        required: true 
    },
    foodtype:{
        type: String, 
    },
    image: {
        type: String,
        required: true ,    
    }
})


module.exports = mongoose.model("Product" , foodSchema)