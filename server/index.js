const WebSocket = require('@hellstad/ws')
const wss = new WebSocket.Server({ port: 3000 })
const uuid = require('uuid')

const randomData = () => ({
    id: uuid.v4(),
    obj: {
        foo: uuid.v4(),
        bar: uuid.v4()
    },
    arr: [
        uuid.v4(),
        uuid.v4()
    ]
})

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
        clearInterval(this.fakeDataTimer)
        setTimeout(() => this.resume(), 1000)
    }

    resume() {
        // start 100Hz random data generation
        console.log('Resuming fake data stream.')
        this.fakeDataTimer = setInterval(() => this.send(randomData()), 10)
    }

    send(msg) {
        const flushed = this.ws.send(JSON.stringify(msg), err => {
            if (err) return console.error(err)

            this.sentMessages += 1
        })

        // return

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
