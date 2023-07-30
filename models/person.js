const mongoose = require('mongoose')
const url = process.env.MONGO_DB_URL

mongoose.set('strictQuery', false)
mongoose.connect(url)

const phonebook_Schema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true
  },
  number: {
    type: String,
    minLength: 8,
    required: true,
    validate: {
      validator: number => /^\d{2,3}-\d+$/.test(number),
      message: props => `${props.value} is not a valid phone number!`
    }
 
  }
})

phonebook_Schema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Person', phonebook_Schema)