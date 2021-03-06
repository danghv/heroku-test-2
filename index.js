const dotenv = require('dotenv').config()
const express = require('express')
const app = express()
const crypto = require('crypto')
const nonce = require('nonce')()
const cookie = require('cookie')
const querystring = require('querystring')
const request = require('request-promise')
const path = require('path')

const apiKey = process.env.SHOPIFY_API_KEY
const apiSecret = process.env.SHOPIFY_API_SECRET
const scopes = 'read_products'
const forwardingAddress = "https://580ee534.ngrok.io"

// app.get('/', (req, res) => {
//     res.send('Hello world!')
// })

app.use(express.static('client/build'))
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
})

app.get('/shopify', (req, res) => {
    const shop = req.query.shop
    if (shop) {
        const state = nonce()
        const redirectUri = forwardingAddress + '/shopify/callback'
        const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`
        res.cookie('state', state)
        res.redirect(installUrl)
    } else {
        return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request')
    }
})

app.get('/shopify/callback', (req, res) => {
    const { shop, hmac, code, state } = req.query
    console.log('...', req.headers.cookie)
    const stateCookie = cookie.parse(req.headers.cookie).state
    if (state !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified')
    }

    if (shop && hmac && code) {
        const map = Object.assign({}, req.query)
        delete map['signature']
        delete map['hmac']
        const message = querystring.stringify(map)
        // console.log('what does querystring do?', message)
        const providedHmac = Buffer.from(hmac, 'utf-8')
        // console.log('provided hmac', providedHmac)
        const generatedHash = Buffer.from(
            crypto
                .createHmac('sha256', apiSecret)
                .update(message)
                .digest('hex'),
            'utf-8'
        )
        let hashEquals = false

        try {
            hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
        } catch (e) {
            hashEquals = false
        }

        if (!hashEquals) {
            return res.status(400).send('HMAC validation failed')
        }

        const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`
        const accessTokenPayload = {
            client_id: apiKey,
            client_secret: apiSecret,
            code,
        }

        request.post(accessTokenRequestUrl, { json: accessTokenPayload })
            .then((accessTokenResponse) => {
                const accessToken = accessTokenResponse.access_token
                console.log('access token...', accessToken)
                const shopRequestHeaders = {
                    'X-Shopify-Access-Token': accessToken,
                }
                //use the accessToken to get anything from outside or shopify server

                const shopRequestUrl = `https://${shop}/admin/shop.json`
                request.get(shopRequestUrl, { headers: shopRequestHeaders })
                    .then((shopResponse) => {
                        // res.end(shopResponse)
                        res.redirect('/')
                    })
                    .catch((error) => {
                        res.status(error.statusCode).send(error.error.error_description)
                    })

            })
            .catch((error) => {
                res.status(error.statusCode).send(`error....${error.error.error_description}`)
            })

    } else {
        res.status(400).send('Required parameters missing')
    }
})

app.listen(5000, () => {
    console.log('listening on port 5000!')
})
