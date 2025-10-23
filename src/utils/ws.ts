let ws: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];
let reconnectTimer: number | null = null;
let reconnectCount = 0;
const RECONNECT_INTERVAL = 3000; // 重连间隔 ms
const MAX_RECONNECT = 10;
let resumeId: string | number | null = null; // 可选：记录最后消息ID，用于 resume

/** 连接 WebSocket，如果已经连接则返回现有 ws */
export function connectWS() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  const url =
    process.env.NODE_ENV === "development"
      ? "ws://api.bbdtest.local:8080/ws"
      : "wss://www.bbdbuy1.com/admin-api/ws";

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("✅ WebSocket 连接成功");

    // 重置重连计数
    reconnectCount = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // 如果使用 resume 协议，发送上次消息ID
    if (resumeId != null) {
      ws?.send(JSON.stringify({ type: "resume", lastMessageId: resumeId }));
    }

    // 广播重连成功消息
    listeners.forEach((cb) => cb({ type: "reconnect" }));
  };

  ws.onmessage = (event) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch (err) {
      console.warn("WS 收到非 JSON:", event.data);
      return;
    }

    // 如果后端返回消息带 id，可记录用于 resume
    if (data.id != null) {
      resumeId = data.id;
    }

    // 广播给所有订阅者
    listeners.forEach((cb) => cb(data));
  };

  ws.onclose = () => {
    console.log("❌ WebSocket 已关闭");
    ws = null;
    tryReconnect();
  };

  ws.onerror = (err) => {
    console.error("⚠️ WebSocket 错误:", err);
    // 也尝试重连
    tryReconnect();
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
    connectWS();
    reconnectTimer = null;
  }, RECONNECT_INTERVAL);
}

/** 订阅 WebSocket 消息，返回取消订阅函数 */
export function subscribeWS(callback: (data: any) => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/** 关闭 WebSocket */
export function closeWS() {
  if (ws) {
    ws.close();
    ws = null;
  }
  listeners.length = 0;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectCount = 0;
}

/** 获取当前 WebSocket 实例 */
export function getWS() {
  return ws;
}

window.getWS = getWS;
