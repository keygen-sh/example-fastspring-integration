// Be sure to add these ENV variables!
const {
  FASTSPRING_API_USERNAME,
  FASTSPRING_API_PASSWORD,
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID,
  KEYGEN_POLICY_ID,
  PORT = 8080
} = process.env

// Base64 encode FastSpring credentials to use for API requests
const FASTSPRING_API_CREDS = new Buffer(`${FASTSPRING_API_USERNAME}:${FASTSPRING_API_PASSWORD}`).toString("base64")

const fetch = require('node-fetch')
const crypto = require('crypto')
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const app = express()

app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(morgan('combined'))

app.set('view engine', 'ejs')

// 1. Our FastSpring checkout form will redirect here after a successful purchase. Inside
//    this route, we'll verify that the passed order reference is valid within FastSpring
//    and then create a Keygen license resource. After that has successfully been done,
//    we'll render a 'success' page containing our user's license key which they can
//    use inside of our software product, e.g.:
//
//    curl -X POST https://api.keygen.sh/v1/accounts/$KEYGEN_ACCOUNT_ID/licenses/actions/validate-key \
//      -H 'Content-Type: application/vnd.api+json' \
//      -H 'Accept: application/vnd.api+json' \
//      -d '{
//            "meta": {
//              "key": "$KEYGEN_LICENSE_KEY"
//            }
//          }'
app.get('/success', async (req, res) => {
  const { query } = req

  // If we aren't supplied with an order ID, the request is invalid.
  if (!query.orderId) {
    res.render('error', {
      error: 'Missing order details'
    })
    return
  }

  // 2. Fetch the FastSpring resource to make sure our request is valid. We'll get back
  //    an order resource if the licensee was charged successfully.
  const fsres = await fetch(`https://api.fastspring.com/orders/${query.orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${FASTSPRING_API_CREDS}`,
      'Accept': 'application/json'
    }
  })
  if (fsres.status !== 200) { // Invalid! Bail early before we create a license.
    res.render('error', {
      error: 'Invalid order ID'
    })
    return
  }

  const { orders: [order] } = await fsres.json()

  // 3. Create a user-less Keygen license for our new FastSpring customer.
  const kreq = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    },
    body: JSON.stringify({
      data: {
        type: 'licenses',
        attributes: {
          // Generate a short license key in the form of 'XXXX-XXXX-XXXX-XXXX' that we can
          // send to our customer via email and display on the success page.
          key: crypto.randomBytes(8).toString('hex').split(/(.{4})/).filter(Boolean).join('-'),
          metadata: {
            fastSpringOrderId: query.orderId
          }
        },
        relationships: {
          policy: {
            data: { type: 'policies', id: KEYGEN_POLICY_ID }
          }
        }
      }
    })
  })

  const { data: license, errors } = await kreq.json()
  if (errors) {
    const error = errors.map(e => e.detail).toString()

    // If you receive an error here, then you may want to handle the fact the customer
    // may have been charged for a license that they didn't receive e.g. easiest way
    // would be to create the license manually, or refund their payment.
    console.error(`Received error while creating license for ${JSON.stringify(query)}:\n ${error}`)

    res.render('error', { error })
    return
  }

  // 4. All is good! License was successfully created for the new FastSpring customer.
  //    Next up would be for us to email the license key to our customer's email
  //    using `order.customer.email`.

  // 5. Render our success page with the new license resource.
  res.render('success', {
    license,
    order
  })
})

app.get('/', async (req, res) => {
  res.render('index')
})

process.on('unhandledRejection', err => {
  console.error(`Unhandled rejection: ${err}`, err.stack)
})

const server = app.listen(PORT, 'localhost', () => {
  const { address, port } = server.address()

  console.log(`Listening at http://${address}:${port}`)
})