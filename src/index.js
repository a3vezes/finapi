const express = require('express')
const { v4: uuid } = require('uuid')

const app = express()
app.use(express.json())

function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers
    
    const customer = Customers.find(customer => customer.cpf === cpf)

    if(!customer){
        return res.status(400).json({error: 'Customer Not Found'})
    }

    req.customer = customer

    return next()
}

function getAccountBalance(statement) {
    const balance = statement.reduce((acc, item) => {
        if(item.type === 'credit'){
            return acc + item.amount
        } else {
            return acc - item.amount
        }
    },0)

    return balance
}

app.get('/', (req, res)=>{
    return res.status(200).json({message: 'Hello World!'})
})

const Customers = []

app.get('/account', (req, res)=>{
    return res.status(200).json({customers: Customers})
})

app.post('/account', (req, res)=>{
    const { cpf, name } = req.body

    if(Customers.some(customer => customer.cpf == cpf)){
        return res.status(400).json({error: "Your Credentials Could Not Be Verified"})
    }

    const user = {
        id : uuid(),
        cpf,
        name,
        statement: []
    }

    Customers.push(user)

    return res.status(201).json({user})
})

app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
    return res.json(req.customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (req,res) => {
    const { description, amount } = req.body
    const { customer } = req

    const depositOperation = {
        description, 
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(depositOperation)

    return res.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (req,res)=>{
    const { customer } = req
    const { amount } = req.body

    const balance = getAccountBalance(customer.statement)

    if(balance < amount) {
        return res.status(400).json({ error: 'Insufficient Funds'})
    }

    const withdrawOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(withdrawOperation)


    return res.status(201).send()
})

app.get('/statement/:date', verifyIfExistsAccountCPF, (req, res) => {
    const { statement } = req.customer
    const { date } = req.params

    const statements = statement.filter((s) => s.created_at.toLocaleDateString() === new Date(date).toLocaleDateString())

    return res.json(statements)
})

app.put('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body
    const { customer } = req

    customer.name = name

    return res.status(201).send()
})

app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
    Customers.splice(req.customer, 1)

    return res.status(204).send()
})

const PORT = process.env.PORT || 3333

app.listen(PORT, ()=>{
    console.log(`Server is listening to PORT: ${PORT}`)
})