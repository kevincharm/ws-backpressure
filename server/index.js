const WebSocket = require('@hellstad/ws')
const wss = new WebSocket.Server({ port: 3000 })
const dummyjson = require('dummy-json')
const dummyTemplate = `
{
  "users": [
    {{#repeat 2}}
    {
      "id": {{@index}},
      "name": "{{firstName}} {{lastName}}",
      "work": "{{company}}",
      "email": "{{email}}",
      "dob": "{{date '1900' '2000' 'YYYY'}}",
      "address": "{{int 1 100}} {{street}}",
      "city": "{{city}}",
      "optedin": {{boolean}}
    }
    {{/repeat}}
  ],
  "images": [
    {{#repeat 3}}
    "img{{@index}}.png"
    {{/repeat}}
  ],
  "coordinates": {
    "x": {{float -50 50 '0.00'}},
    "y": {{float -25 25 '0.00'}}
  },
  "price": "\$\{{int 0 99999 '0,0'}}"
}
`

const randomData = () => dummyjson.parse(dummyTemplate)

class DataSource {
    constructor(ws) {
        this.sentMessages = 0
        this.socketFlushFailures = 0

        this.ws = ws
        this.ws.on('drain', this.resume)
        const printSentMessages = setInterval(() => {
            console.log(`Sent messages: ${this.sentMessages}`)
        }, 5000)
        this.ws.on('close', () => clearInterval(printSentMessages))
    }

    pause() {
        console.log('Pausing fake data stream.')
        if (this.fakeDataTimer) clearInterval(this.fakeDataTimer)
        setTimeout(() => this.resume(), 10000)
    }

    resume() {
        // start 100Hz random data generation
        console.log('Resuming fake data stream.')
        this.fakeDataTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN)
                this.send(randomData())
        }, 1)
    }

    send(msg) {
        const flushed = this.ws.send(msg, err => {
            if (err) return console.error(err)

            this.sentMessages += 1
        })

        if (!flushed) {
            console.error('Failed to flush.')
            this.socketFlushFailures += 1
        } else {
            this.socketFlushFailures = 0
        }

        if (this.socketFlushFailures >= 2) this.pause()
    }
}

wss.on('connection', ws => {
    console.log('socket opened:', ws)

    ws.on('message', msg => {
        console.log('received:', msg)
    })

    const src = new DataSource(ws)
    src.resume()
})
