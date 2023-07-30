require('dotenv').config()
const Person = require('./models/person')
const morgan = require('morgan')
const express = require('express')
const app = express()
const PORT = process.env.PORT

app.use(express.json())
app.use(express.static('build'))
app.use(morgan(function(tokens, req, res){
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        JSON.stringify(req.body)
      ].join(' ')
}))

app.listen(PORT, () => {
    console.log(`Server is listening on Port ${PORT}`)
})

app.get('/', (request, response) => {
    response.send("<h1>Welcome<h1>")
})

app.get('/info', (request, response) => {
    Person.countDocuments({}).then((count) => {
        response.send(
        `   <p>Phonebook has info for ${count} people 
            <br/>        
            <p>${Date()}</p>`
        )
    })
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(result => {
        response.send(result)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(person => {
        if (person) {
            response.send(person)
        }
        else {
            response.statusMessage = `No entry found with ID: ${request.params.id}`
            response.status(404).end()
        }
    }).catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => response.status(204).end())
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    if (Object.keys(request.body).length === 0 && request.body.constructor === Object) {
        response.status(400).json({error: "Missing or invalid POST body data"})
    }
    else if (!request.body.name || typeof(request.body.name) !== "string") {
        response.status(400).json({error: "Missing or invalid name"})
    }
    else if (!request.body.number || typeof(request.body.number) !== "string") {
        response.status(400).json({error: "Missing or invalid number"})
    }
    else {
        Person.findOne({name: request.body.name}).then(result => {
            if (result) {  // update number
                const person = {
                    name: request.body.name,
                    number: request.body.number
                }
                updatePerson(result.id, person, response, next)
            }
            else {  // add new entry
                const person = new Person({
                    name: request.body.name,
                    number: request.body.number
                })
                person.save()
                    .then(result => response.send(result))
                    .catch(error => next(error))
            }
        })
    }
})

app.put('/api/persons/:id', (request, response, next) => {
    if (Object.keys(request.body).length === 0 && request.body.constructor === Object) {
        response.status(400).json({error: "Missing or invalid POST body data"})
    }
    else if (!request.body.id || typeof(request.body.id) !== "string") {
        response.status(400).json({error: "Missing or invalid ID"})
    }
    else if (!request.body.name || typeof(request.body.name) !== "string") {
        response.status(400).json({error: "Missing or invalid name"})
    }
    else if (!request.body.number || typeof(request.body.number) !== "string") {
        response.status(400).json({error: "Missing or invalid number"})
    }
    else {
        Person.findById(request.params.id).then(result => {
            const person = {
                name: request.body.name,
                number: request.body.number
            }
            
            if (result) { 
                updatePerson(result.id, person, response, next)
            }
            else {
                response.status(400).json({error: `Unable to find [${request.body.name}] within phonebook`})
            }
        })
    }
})

const updatePerson = (id, person, response, next) => {
    Person.findByIdAndUpdate(id, person, {new: true, runValidators: true, context: 'query'})
        .then(updatedPerson => {
            response.send(updatedPerson)
        })
        .catch(error => next(error))
}

// These middleware functions should remain at the bottom of page
const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({error: 'malformatted id'})
    }
    else if (error.name === 'ValidationError') {
        return response.status(400).json({error: error.message})
    }
    next(error)
}

app.use(unknownEndpoint)
app.use(errorHandler)

var env = process.env.NODE_ENV || 'development'
console.log(env)