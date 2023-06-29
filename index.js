const express = require("express")
const cors = require("cors")
const app = express()
const PORT = process.env.PORT || 3001

let notes = [
    {
      id: 1,
      content: "HTML is easy",
      important: true
    },
    {
      id: 2,
      content: "Browser can execute only JavaScript",
      important: false
    },
    {
      id: 3,
      content: "GET and POST are the most important methods of HTTP protocol",
      important: true
    }
  ]

  const generateID = () => {
    const maxID = notes.length > 0 ? Math.max(...notes.map(note => note.id)) : 0
    return maxID + 1
  }

  const requestLogger = (request, response, next) => {
    console.log('Method:', request.method)
    console.log('Path:  ', request.path)
    console.log('Body:  ', request.body)
    console.log('---')
    next()
  }

  app.use(cors())
  app.use(express.json())
  app.use(express.static('build'))
  app.use(requestLogger)
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
  
  app.get('/', (request, response) => {
    response.send('<h1>Hello World</h1>')
  })
  
  app.get('/api/notes', (request, response) => {
    response.json(notes)
  })

  app.get('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    const note = notes.find(note => note.id === id)
    
    if (note) {
      response.json(note)
    }
    else {
      response.statusMessage = `Unable to find note with ID: ${id}` 
      response.status(404).end()
    }
  })

  app.delete('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    notes = notes.filter(note => note.id !== id)
    response.status(204).end()
  })

  app.post('/api/notes', (request, response) => {
    
    const body = request.body

    if(!body.content) {
      response.status(400).json({
        error: "content missing"
      })
    }
    else {
      const note = {
        id: generateID(),
        content: body.content,
        important: body.important || false
      }

      notes = notes.concat(note)
      response.json(note)
    }
  })

  const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
  }
  app.use(unknownEndpoint)