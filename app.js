require('./global-helper')
const express = require('express')
const bodyParser = require('body-parser')
const expressValidator = require('express-validator')
const {
    filter,
    monitor,
    httplog,
    cors,
    auth,
    queryParser,
    validate,
} = require('./midware')
const { customValidators } = require('./util')
const { errorLogCtrl } = require('./ctrl')
const router = require('./router')
const config = require('./config')

const app = express()
app.get('*', filter)
app.use(monitor)
app.use(queryParser)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(expressValidator({ customValidators }))

app.use(httplog)
app.use(cors)
app.use(auth)
app.use(validate.common)
app.use(router)

app.use((req, res, next) => {
    next(global.MessageErr('NotFound', req.url))
})

app.use(({ code = -1, message, stack }, req, res, next) => { // eslint-disable-line 
    res.fail(code, message)
    if (code > 10001 || req.method === 'OPTIONS') return
    errorLogCtrl.createErrorLog(req, code, message, stack)
})

app.listen(config.API_PORT)

process.on('unhandledRejection', err => {
    console.log('Unhandled Rejection: ', err)
})
