import {
  acceptUser,
  fetchChatHistory as apiFetchChatHistory,
  readChatMessages,
  finishWorkOrder,
  receiveSettings
} from "@/services";
import {
  addReconnectListener,
  connectWS,
  getWS,
  sendWS,
  subscribeWS,
} from "@/utils/ws";
import { useModel } from "@umijs/max";
import { message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

/** 已接待用户结构 */
export interface RepliedUser {
  id: string;
  nickName: string;
  email: string;
  avatarUrl: string;
  top: boolean;
  label: string[];
  lastMessage?: string;
  msgtype?: string;
  unread?: number;
  name?: string; // 兼容后端需要的字段
}

/** 大厅未接待用户结构 */
export interface LobbyUser {
  id: string;
  nickName: string;
  email: string;
  avatarUrl: string;
}

/** 聊天用户联合类型 */
export type ChatUser = RepliedUser | LobbyUser;

/** 消息记录结构 */
export interface ChatMessage {
  id: string | number;
  sender: "SERVER" | "CUSTOMER";
  text: string;
  sendTime?: string;
  createTime?: string;
  type?: string;
}

/** 分页消息结构 */
export interface PaginatedMessages {
  list: ChatMessage[];
  page: number;
  hasMore: boolean;
}

export default function useChatModel() {
  const { initialState } = useModel("@@initialState");
  const isLogin = !!initialState?.currentUser;

  // 1. 状态定义
  const [pendingUsers, setPendingUsers] = useState<LobbyUser[]>([]);
  const [repliedUsers, setRepliedUsers] = useState<RepliedUser[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, PaginatedMessages>>({});
  const [activeUser, setActiveUserState] = useState<ChatUser | null>(null);

  // 2. 引用定义 (用于解决闭包陷阱)
  const firstLoadRef = useRef(false);
  const activeUserRef = useRef<ChatUser | null>(null);

  // 3. 辅助函数
  const keyOf = (id: number | string | undefined) => (id === undefined ? "" : String(id));

  const formatLocalDateTime = (date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  /** 获取当前活跃用户的消息列表 */
  const messages = activeUser ? messagesMap[keyOf(activeUser.id)]?.list || [] : [];

  // 同步 Ref
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // ------------------------------------------------------------------------------
  // 4. 业务逻辑函数 (Action)
  // ------------------------------------------------------------------------------

  /** 
   * 拉取历史记录分析 
   */
  const loadHistory = useCallback(async (userId: string | number, page: number) => {
    try {
      const res: any = await apiFetchChatHistory(userId, page);
      const records: any[] = res.data.records || [];
      const lastPage: number = res.data.pages;

      const converted: ChatMessage[] = records.reverse().map((it) => ({
        id: it.id ?? `srv-${Math.random()}`,
        sender: it.sender,
        text: it.content ?? it.text ?? "",
        sendTime: it.sendTime ?? it.createTime ?? "",
        createTime: it.createTime ?? "",
        type: it.contentType ?? "TEXT",
      }));

      setMessagesMap((prev) => {
        const k = keyOf(userId);
        const oldList = prev[k]?.list || [];
        const merged = [...converted, ...oldList];
        const deduped = merged.filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);

        return {
          ...prev,
          [k]: { list: deduped, page, hasMore: page < lastPage },
        };
      });
    } catch (err) {
      console.error("loadHistory failed", err);
    }
  }, []);

  /** 
   * 接待/切换用户 
   */
  const setActiveUserAsync = useCallback(async (user: ChatUser | null) => {
    if (!user) {
      setActiveUserState(null);
      return;
    }
    try {
      // 告诉后端开始接待
      await acceptUser(user.id);
      setActiveUserState(user);
      // 初始加载第一页历史
      await loadHistory(user.id, 1);
      firstLoadRef.current = true;
    } catch (err) {
      message.error("接管用户失败");
    }
  }, [loadHistory]);

  /**
   * 发送消息 
   */
  const sendMessage = useCallback((content: string, type = "TEXT") => {
    const user = activeUserRef.current;
    if (!user) return;

    const sendTime = formatLocalDateTime();
    const payload = { sender: "SERVER", type, content, receiverId: user.id, sendTime };

    // 乐观更新本地 UI
    const newMsg: ChatMessage = { id: `local-${Date.now()}`, sender: "SERVER", text: content, sendTime, type };
    setMessagesMap((prev) => {
      const k = keyOf(user.id);
      const old = prev[k]?.list || [];
      return {
        ...prev,
        [k]: { ...prev[k], list: [...old, newMsg] },
      };
    });

    sendWS(payload);
    firstLoadRef.current = true;

    // 更新左侧列表的最后一条简述
    setRepliedUsers((prev) =>
      prev.map((u) => String(u.id) === String(user.id) ? { ...u, lastMessage: content, msgtype: type } : u)
    );
  }, []);

  /**
   * 更新用户设置 (置顶、标签)
   */
  const updateSettingsAsync = useCallback(async (top: boolean, labels: string[]) => {
    const user = activeUserRef.current;
    if (!user || !('top' in user)) return;

    try {
      await receiveSettings({
        [user.id]: { top, label: labels }
      });
      // 注意：这里我们不手动设置 State，而是等待 WS 推送回来的 RECEIVE 列表自动同步，
      // 以保证单向数据流的一致性。
      message.success("设置已更新");
    } catch (err) {
      message.error("更新设置失败");
    }
  }, []);

  /**
   * 结束会话 
   */
  const finishWorkOrderAsync = useCallback(async () => {
    const user = activeUserRef.current as RepliedUser;
    if (!user) return;

    try {
      await finishWorkOrder({ id: user.id, });
      message.success("会话已结束");
      // 副作用：清理当前活跃用户
      setActiveUserState(null);
    } catch (err) {
      message.error("结束会话失败");
    }
  }, []);

  // ------------------------------------------------------------------------------
  // 5. WebSocket 消息处理
  // ------------------------------------------------------------------------------

  const handleIncoming = useCallback((raw: any) => {
    if (!raw) return;

    // A. 列表同步消息
    if (raw.type === "HALL" || raw.type === "RECEIVE") {
      const list = Array.isArray(raw.content) ? raw.content : [];
      if (raw.type === "HALL") {
        setPendingUsers(list.map((u: any) => ({
          id: String(u.id),
          nickName: u.nickName,
          email: u.email,
          avatarUrl: u.avatarUrl,
        })));
      } else {
        const mappedList: RepliedUser[] = list.map((u: any) => ({
          id: String(u.id),
          nickName: u.nickName,
          email: u.email,
          avatarUrl: u.avatarUrl,
          top: !!u.top,
          label: u?.label || [],
          unread: u.unread || 0,
          lastMessage: u.lastMessage || "",
          msgtype: u.msgtype || "TEXT",
        }));
        setRepliedUsers(mappedList);

        // 同步活跃用户状态
        const currentActive = activeUserRef.current;
        if (currentActive) {
          const newest = mappedList.find((u) => String(u.id) === String(currentActive.id));
          if (newest) setActiveUserState(newest);
        }
      }
      return;
    }

    // B. 单条聊天消息
    const uid = keyOf(raw.senderId);
    if (!uid) return;

    const chatMsg: ChatMessage = {
      id: raw.id ?? `srv-${Date.now()}`,
      sender: raw.sender === "CUSTOMER" ? "CUSTOMER" : "SERVER",
      text: raw.content ?? "",
      sendTime: raw.sendTime ?? formatLocalDateTime(),
      type: raw.type ?? "TEXT",
    };

    // 如果处于当前聊天窗口
    if (String(activeUserRef.current?.id) === uid) {
      if (raw.sender === "CUSTOMER" && raw.id) readChatMessages([String(raw.id)]).catch(() => { });

      setMessagesMap((prev) => {
        const oldList = prev[uid]?.list || [];
        const deduped = [...oldList, chatMsg].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);
        return { ...prev, [uid]: { ...prev[uid], list: deduped } };
      });
      firstLoadRef.current = true;
    }

    // 更新列表摘要和未读
    setRepliedUsers((prev) => {
      const exists = prev.find((u) => String(u.id) === uid);
      if (exists) {
        return prev.map((u) => String(u.id) === uid ? {
          ...u,
          lastMessage: chatMsg.text,
          msgtype: chatMsg.type,
          unread: String(activeUserRef.current?.id) !== uid ? (u.unread ?? 0) + 1 : 0,
        } : u);
      }
      return prev; // 如果列表里没有，通常会在下一波 RECEIVE 推送中处理
    });
  }, []);

  // 6. 生命周期管理
  useEffect(() => {
    if (!isLogin) return;
    connectWS();
    const unsubscribe = subscribeWS(handleIncoming);
    const unsubscribeReconnect = addReconnectListener(() => {
      if (!activeUserRef.current) return;
      message.success("连接已恢复");
      setMessagesMap({});
      setActiveUserState(null);
    });

    return () => {
      unsubscribe();
      unsubscribeReconnect();
    };
  }, [isLogin, handleIncoming]);

  /**
   * 针对特定业务 (如订单) 直接发送消息，无需激活用户
   */
  const sendDirectMessage = useCallback((params: { customerId: string; bizCode: string; content: string; type?: string }) => {
    const { customerId, bizCode, content, type = "TEXT" } = params;
    const sendTime = formatLocalDateTime();
    
    const payload = {
      sender: "SERVER",
      type,
      content,
      receiverId: customerId,
      bizCode, // 携带业务单号
      sendTime,
    };

    sendWS(payload);

    // 同时也更新一下本地的 messagesMap，以便弹窗内能立刻看到（采用乐观更新）
    const newMsg: ChatMessage = {
      id: `direct-${Date.now()}`,
      sender: "SERVER",
      text: content,
      sendTime,
      type,
    };

    setMessagesMap((prev) => {
      const k = keyOf(customerId);
      const old = prev[k]?.list || [];
      return {
        ...prev,
        [k]: {
          list: [...old, newMsg],
          page: prev[k]?.page || 1,
          hasMore: prev[k]?.hasMore ?? true,
        },
      };
    });
  }, []);

  return {
    pendingUsers,
    repliedUsers,
    messages,
    activeUser,
    messagesMap,
    firstLoadRef,
    // Actions
    setActiveUserAsync,
    setActiveUser: setActiveUserState,
    sendMessage,
    sendDirectMessage, // 导出新方法
    loadHistory,
    updateSettingsAsync,
    finishWorkOrderAsync,
    // Setters (慎用，尽量用 Actions)
    setPendingUsers,
    setRepliedUsers,
  };
}
