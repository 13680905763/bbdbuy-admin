import { message } from "antd";

let ws: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];
const reconnectListeners: (() => void)[] = [];

let reconnectTimer: number | null = null;
let reconnectCount = 0;

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT = 10;

/** 🚀 连接 WebSocket */
export function connectWS() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  const url =
    process.env.NODE_ENV === "development"
      ? "ws://api.bbdtest.local:8080/ws"
      : "wss://www.bbdbuy1.com/admin-api/ws";

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("✅ WebSocket 已连接");
    reconnectCount = 0;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // 🔔 通知外部（用于显示“会话连接成功”）
    reconnectListeners.forEach((cb) => cb());
  };

  ws.onmessage = (event) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch {
      console.warn("WS 收到非 JSON:", event.data);
      return;
    }
    listeners.forEach((cb) => cb(data));
  };

  ws.onclose = () => {
    console.log("❌ WS 关闭，尝试重连...");
    message.error("会话连接断开，正在尝试重连...");
    ws = null;
    tryReconnect();
  };

  ws.onerror = (err) => {
    console.error("⚠️ WS 错误:", err);
    ws?.close(); // 触发 onclose
  };

  return ws;
}

/** 🔁 自动重连逻辑 */
function tryReconnect() {
  if (reconnectCount >= MAX_RECONNECT) {
    console.warn("⚠️ 重连次数已达上限");
    message.error("会话连接失败，请刷新页面重试");
    return;
  }
  if (reconnectTimer) return;

  reconnectCount++;
  reconnectTimer = window.setTimeout(() => {
    console.log(`🔄 正在进行第 ${reconnectCount} 次重连...`);
    connectWS();
    reconnectTimer = null;
  }, RECONNECT_INTERVAL);
}

/** 📩 订阅消息 */
export function subscribeWS(callback: (data: any) => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/** 🪢 注册重连成功回调 */
export function addReconnectListener(cb: () => void) {
  reconnectListeners.push(cb);
  return () => {
    const idx = reconnectListeners.indexOf(cb);
    if (idx >= 0) reconnectListeners.splice(idx, 1);
  };
}

/** ✉️ 发送消息 */
export function sendWS(data: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("⚠️ WS 未连接，消息未发送");
    return;
  }
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  ws.send(msg);
}

/** ❌ 关闭连接 */
export function closeWS() {
  if (ws) ws.close();
  ws = null;
  listeners.length = 0;
  reconnectListeners.length = 0;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectCount = 0;
}

/** 🧩 获取当前实例 */
export function getWS() {
  return ws;
}
window.getWS = getWS;
