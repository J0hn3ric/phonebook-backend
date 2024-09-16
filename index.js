require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

morgan.token('body', function getBody (req) {
    return JSON.stringify(req.body)
})

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))


const getMaxId = () => {
    return Person.countDocuments().then(response => {
        console.log(response)
        return response
    })
}

const getCurrentTime = () => {
    let currentTime = new Date()
    return String(currentTime)
}

app.get('/api/persons', (request, response) => {
    Person.find({})
        .then(persons => {
            response.json(persons)
        })
})

app.get('/info', (request, response) => {
    getMaxId().then(max => {
        const maxId = max
        response.send('<p>Phonebook has info for ' + maxId + ' people <br/><br/>' + getCurrentTime() + '</p>' )
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            response.json(person)
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body

    Person.findByIdAndUpdate(request.params.id,
        { name, number },
        { new: true, runValidators: true, context: 'query' })
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

app.post('/api/persons', async (request, response, next) => {
    const { name, number } = request.body

    if(!name || !number){
        next('nonm')
    } else {
        const person = new Person({
            name: name,
            number: number
        })
        person.save()
            .then(savedPerson => {
                response.json(savedPerson)
            })
            .catch(error => next(error))

    }
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown Endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error)

    if(error.name === 'CastError'){
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error === 'nonm') {
        return response.status(404).send({ error: 'name or number missing' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({  error: error.message })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})