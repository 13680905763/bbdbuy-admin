import { message } from "antd";

let ws: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];
let reconnectTimer: number | null = null;
let reconnectCount = 0;
const RECONNECT_INTERVAL = 3000; // 重连间隔 ms
const MAX_RECONNECT = 10;
let resumeId: string | number | null = null; // resume 协议支持
const messageQueue: string[] = []; // 缓存未发消息
const onReconnectCallbacks: (() => void)[] = []; // 重连成功后执行的回调

/** 连接 WebSocket */
export function connectWS() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  const url =
    process.env.NODE_ENV === "development"
      ? "ws://api.bbdtest.local:8080/ws"
      : "wss://www.bbdbuy1.com/admin-api/ws";

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("✅ WebSocket 连接成功 .");

    reconnectCount = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // 如果支持 resume 协议
    if (resumeId != null) {
      ws?.send(JSON.stringify({ type: "resume", lastMessageId: resumeId }));
    }

    // 🔁 补发缓存消息
    flushMessageQueue();

    // 通知监听者
    listeners.forEach((cb) => cb({ type: "reconnect" }));

    // 调用重连回调（如拉取历史记录）
    onReconnectCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.warn("onReconnect callback error:", err);
      }
    });
  };

  ws.onmessage = (event) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch {
      console.warn("WS 收到非 JSON:", event.data);
      return;
    }

    if (data.id != null) resumeId = data.id;
    listeners.forEach((cb) => cb(data));
  };

  ws.onclose = () => {
    console.log("❌ WebSocket 已关闭");
    ws = null;
    tryReconnect();
  };

  ws.onerror = (err) => {
    console.error("⚠️ WebSocket 错误:", err);
    ws?.close(); // 强制触发 onclose
  };

  return ws;
}

/** 尝试重连 */
function tryReconnect() {
  if (reconnectCount >= MAX_RECONNECT) {
    console.warn("⚠️ WebSocket 重连次数已达上限");
    return;
  }
  if (reconnectTimer) return;

  reconnectCount++;
  reconnectTimer = window.setTimeout(() => {
    console.log(`🔄 WebSocket 尝试第 ${reconnectCount} 次重连...`);
    message.error("当前会话连接不稳定 ，正在尝试重新连接...");

    connectWS();
    reconnectTimer = null;
  }, RECONNECT_INTERVAL);
}

/** ✅ 安全发送消息 */
export function sendWS(data: any) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(msg);
  } else {
    console.warn("⚠️ WS 未连接，缓存消息等待重连");
    messageQueue.push(msg);
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      connectWS();
    }
  }
}

/** 补发消息 */
function flushMessageQueue() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    if (msg) ws.send(msg);
  }
}

/** 订阅消息 */
export function subscribeWS(callback: (data: any) => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/** 注册重连回调（例如重连后刷新聊天记录） */
export function addReconnectListener(cb: () => void) {
  onReconnectCallbacks.push(cb);
  return () => {
    const idx = onReconnectCallbacks.indexOf(cb);
    if (idx >= 0) onReconnectCallbacks.splice(idx, 1);
  };
}

/** 关闭连接 */
export function closeWS() {
  if (ws) {
    ws.close();
    ws = null;
  }
  listeners.length = 0;
  messageQueue.length = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectCount = 0;
}

/** 获取当前实例 */
export function getWS() {
  return ws;
}

window.getWS = getWS;
