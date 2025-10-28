// utils/ws.ts
import { message } from "antd";

/**
 * 全局唯一 WebSocket 实例
 */
let ws: WebSocket | null = null;

/**
 * 普通消息监听者
 */
const listeners: ((data: any) => void)[] = [];

/**
 * 重连成功监听者
 */
const reconnectListeners: (() => void)[] = [];

/**
 * 重连定时器与控制参数
 */
let reconnectTimer: number | null = null;
let reconnectCount = 0;
let allowReconnect = true;

const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT = 10;

/**
 * 避免重复 new WebSocket
 * 利用唯一标记检查（重要！）
 */
let wsConnecting = false;

/**
 * 获取 WebSocket 地址
 */
function getWsUrl() {
  if (process.env.NODE_ENV === "development") {
    return "ws://api.bbdtest.local:8080/ws";
  }
  return "wss://www.bbdbuy1.com/admin-api/ws";
}

/**
 * 建立连接
 */
export function connectWS() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    console.log("⚠️ WS 已存在或正在连接，跳过 new WebSocket");
    return ws;
  }
  if (wsConnecting) {
    console.log("⏳ WS 正在建立连接中...");
    return ws;
  }

  wsConnecting = true;

  const url = getWsUrl();
  console.log("🔌 创建 WS 连接：", url);

  try {
    ws = new WebSocket(url);
  } catch (err) {
    console.error("❌ 创建 WS 失败:", err);
    wsConnecting = false;
    return null;
  }

  ws.onopen = () => {
    console.log("✅ WebSocket 已连接");
    wsConnecting = false;
    reconnectCount = 0;
    allowReconnect = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    reconnectListeners.forEach((cb) => cb());
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach((cb) => cb(data));
    } catch {
      console.warn("⚠️ 收到非 JSON 消息:", event.data);
    }
  };

  ws.onclose = (e) => {
    console.log("❌ WS 关闭", e.reason);
    ws = null;
    wsConnecting = false;

    if (allowReconnect) {
      message.error("会话连接断开，正在尝试重连...");
      tryReconnect();
    }
  };

  ws.onerror = (err) => {
    console.error("⚠️ WS 错误:", err);
    wsConnecting = false;
    ws?.close(); // 主动触发 onclose 统一处理
  };

  return ws;
}

/**
 * 尝试重连
 */
function tryReconnect() {
  if (!allowReconnect) return;
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

/**
 * 订阅普通消息
 */
export function subscribeWS(callback: (data: any) => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * 订阅重连成功事件
 */
export function addReconnectListener(cb: () => void) {
  reconnectListeners.push(cb);
  return () => {
    const idx = reconnectListeners.indexOf(cb);
    if (idx >= 0) reconnectListeners.splice(idx, 1);
  };
}

/**
 * 发送消息
 */
export function sendWS(data: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("⚠️ WS 未连接，消息未发送");
    return;
  }
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  ws.send(msg);
}

/**
 * 关闭 WS 并清理状态
 */
export function closeWS() {
  console.log("🔒 手动关闭 WS 连接");
  allowReconnect = false;
  wsConnecting = false;

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

/**
 * 获取当前实例
 */
export function getWS() {
  return ws;
}

window.getWS = getWS; // 调试方便
