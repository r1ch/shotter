//Libraries
const WebSocket = require("ws")
const BROADCAST_INTERVAL = 500;
let BROADCAST_POSITION = 0;

const wss = new WebSocket.Server({ port : 8080 });

const broadcast = ()=>{
	wss.clients.forEach(sendJson({
		position: (BROADCAST_POSITION+=BROADCAST_INTERVAL/1000)
	}),BROADCAST_INTERVAL)
}

setInterval(broadcast,BROADCAST_INTERVAL)

const sendJson = json => client => {
	if(client.readyState === WebSocket.OPEN) client.send(JSON.stringify(json))
}