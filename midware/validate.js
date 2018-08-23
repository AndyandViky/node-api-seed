const config = require('../config')
const validate = require('../util').validhelper

const Type = {
    String: { name: 'String', func: 'isString' },
    Number: { name: 'Number', func: 'isNumeric' },
    Decimal: { name: 'Decimal', func: 'isDecimal' },
    Boolean: { name: 'Boolean', func: 'isBoolean' },
    Url: { name: 'Url', func: 'isURL' },
    Hash: { name: 'Hash', func: 'isHash' },
    Phone: { name: 'Phone', func: 'isPhone' },
    ObjectId: { name: 'ObjectId', func: 'isMongoId' },
    Stamp: { name: 'Stamp', func: 'isStamp' },
    UnixStamp: { name: 'UnixStamp', func: 'isUnixStamp' },
    StringArray: { name: '[String]', func: 'isStringArray' },
}

module.exports = {

    /**
     * validate common params on every api
     */
    common(req, res, next) {
        // no auth files or paths
        if (
            config.NO_AUTH_PATHS.includes(req.url) ||
            config.NO_AUTH_REG.test(req.url)
        ) {
            return next()
        }

        validate.assertEmptyFromHeader(req, ['ts', 'token'])
        handleResult(req, next)
    },

    /**
     * validate api: login
     */
    login: [
        ['sysType', Type.Number, true],
        ['username', Type.String, true],
        ['password', Type.String, true],
    ],

    /**
     * validate api: register
     */
    register: [
        ['sysType', Type.Number, true],
        ['username', Type.String, true],
        ['password', Type.String, true],
        ['avatar', Type.String, false],
    ],

    validateParams(req, next, fields) {
        fields.forEach(([field, type, required]) => {
            if (required) {
                const key = getEmptyErrorKey(field)
                validate.assertEmptyOne(req, field, global.Message(key).code)
            }
            if (req.query[field] || req.body[field]) {
                validate.assertType(req, field, global.Message('CommonErr').code, type)
            }
        })
        handleResult(req, next)
    },
}

function getEmptyErrorKey(field) {
    const firstLetterToUpper = field.slice(0, 1).toUpperCase()
    const otherLetters = field.slice(1)
    return `${firstLetterToUpper}${otherLetters}Empty`
}

function handleResult(req, next) {
    req.getValidationResult().then(result => {
        if (result.isEmpty()) return next()

        const arr = result.array()[0].msg.split('@@')
        const err = new Error(arr[1])
        err.code = parseInt(arr[0], 10)
        return next(err)
    })
}
