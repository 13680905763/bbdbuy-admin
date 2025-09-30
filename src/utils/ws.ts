let ws: WebSocket | null = null;
const listeners: ((data: any) => void)[] = [];

/** 连接 WebSocket，如果已经连接则返回现有 ws */
export function connectWS() {
  if (ws) return ws;

  const url =
    process.env.NODE_ENV === "development"
      ? "ws://api.bbdtest.local:8080/ws"
      : "wss://www.bbdbuy1.com/admin-api/ws";

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("✅ WebSocket 连接成功");
  };

  ws.onmessage = (event) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch (err) {
      console.warn("WS 收到非 JSON:", event.data);
      return;
    }

    console.log("📩 收到消息:", data);
    // 广播给所有订阅者
    listeners.forEach((cb) => cb(data));
  };

  ws.onclose = () => {
    console.log("❌ WebSocket 已关闭");
    ws = null;
  };

  ws.onerror = (err) => {
    console.error("⚠️ WebSocket 错误:", err);
  };

  return ws;
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
    listeners.length = 0;
  }
}

/** 获取当前 WebSocket 实例 */
export function getWS() {
  return ws;
}
