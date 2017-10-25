import websocket
import json
import time

def on_message(ws, msg):
    json.loads(msg)
    print(msg)
    time.sleep(0.1)

def on_error(ws, err):
    print(err)

def on_open(ws):
    print('ws open')

def on_close(ws):
    print('ws closed')

if __name__ == "__main__":
    ws = websocket.WebSocketApp('ws://localhost:3000',
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
        on_open=on_open)
    ws.run_forever()
