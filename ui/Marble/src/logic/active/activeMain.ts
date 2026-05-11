import { Handelers, Request } from "./activeTypes";

let ws: WebSocket | null = null;
let handlersRef: { current: Handelers } = { current: {} };
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export function setHandlers(handlers: Handelers) {
    handlersRef.current = handlers;
}

export function openConnection() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    ws = new WebSocket('ws://localhost:6280/actv');

    ws.onmessage = (event) => {
        try {
            const request: Request = JSON.parse(event.data) as Request
            const handeler = handlersRef.current[request.channel]
            if (handeler) {
                handeler(request.body)
            } else console.warn(`No handler for channel: ${request.channel}`);
        } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
        }
    }
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onerror = (err) => {
        console.error(`there was an error while running the webSocket ${err.eventPhase}`)
    }
    ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting...');
        ws = null;
        ReconnectWS();
    };
}


function ReconnectWS() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(() => {
        openConnection();
        reconnectTimeout = null;
    }, 500000);
}

export function disconnectWS() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
    }
}

// export function sendMessage(msg: string) {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//         ws.send(JSON.stringify(msg));
//     } else {
//         console.warn('WebSocket not open. Message not sent.');
//     }
// }