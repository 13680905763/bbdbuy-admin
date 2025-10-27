import {
  acceptUser,
  fetchChatHistory as apiFetchChatHistory,
} from "@/services";
import {
  addReconnectListener,
  connectWS,
  getWS,
  sendWS,
  subscribeWS,
} from "@/utils/ws";
import { message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatUser {
  id: number | string;
  user: string;
  email?: string;
  avatar?: string;
  lastMessage?: string;
  unread?: number;
  msgtype?: string;
}

export interface ChatMessage {
  id: string | number;
  sender: "SERVER" | "CUSTOMER";
  text: string;
  sendTime?: string;
  type?: string;
}

export interface PaginatedMessages {
  list: ChatMessage[];
  page: number;
  hasMore: boolean;
}

export default function useChatModel() {
  const [pendingUsers, setPendingUsers] = useState<ChatUser[]>([]);
  const [repliedUsers, setRepliedUsers] = useState<ChatUser[]>([]);
  const [messagesMap, setMessagesMap] = useState<
    Record<string, PaginatedMessages>
  >({});

  // 当前活跃用户
  const [activeUser, setActiveUserState] = useState<ChatUser | null>(null);

  const firstLoadRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const activeUserRef = useRef<ChatUser | null>(null);

  // 同步 activeUserRef
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  const keyOf = (id: number | string | undefined) =>
    id === undefined ? "" : String(id);
  const messages = activeUser
    ? messagesMap[keyOf(activeUser.id)]?.list || []
    : [];

  /** 发送消息 */
  const sendMessage = useCallback((content: string, type = "TEXT") => {
    const user = activeUserRef.current;
    if (!user) return console.warn("sendMessage: no activeUser");

    const payload = {
      sender: "SERVER",
      type,
      content,
      receiverId: user.id,
      sendTime: new Date().toISOString(),
    };

    const newMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      sender: "SERVER",
      text: content,
      sendTime: payload.sendTime,
      type,
    };

    setMessagesMap((prev) => {
      const k = keyOf(user.id);
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

    sendWS(payload);
    firstLoadRef.current = true;
    setRepliedUsers((prev) =>
      prev.map((u) =>
        String(u.id) === String(user.id) ? { ...u, lastMessage: content } : u
      )
    );
  }, []);

  /** 拉历史分页 */
  const loadHistory = useCallback(
    async (userId: string | number, page: number) => {
      try {
        const res: any = await apiFetchChatHistory(userId, page);
        console.log("拉去历史分页");

        const records: any[] = res.data.records || [];
        const lastPage: number = res.data.pages;

        const converted: ChatMessage[] = records.reverse().map((it) => ({
          id: it.id ?? `srv-${Math.random()}`,
          sender: it.sender,
          text: it.content ?? it.text ?? "",
          sendTime: it.sendTime ?? it.createTime ?? "",
          type: it.contentType ?? "TEXT",
        }));

        setMessagesMap((prev) => {
          const k = keyOf(userId);
          const oldList = prev[k]?.list || [];
          const merged = [...converted, ...oldList];
          const deduped = merged.filter(
            (v, i, a) => a.findIndex((x) => x.id === v.id) === i
          );

          return {
            ...prev,
            [k]: {
              list: deduped,
              page,
              hasMore: page < lastPage,
            },
          };
        });
      } catch (err) {
        console.error("fetchChatHistory failed", err);
      }
    },
    []
  );

  /** 激活用户 */
  const setActiveUserAsync = useCallback(
    async (user: ChatUser | null) => {
      if (!user) {
        setActiveUserState(null);
        return;
      }
      try {
        await acceptUser(user.id);
        console.log("向服务器激活用户");
        setMessagesMap((prev: any) => {
          const k = keyOf(user.id);
          return {
            ...prev,
            [k]: {},
          };
        });
      } catch (err) {
        console.warn("acceptUser failed", err);
      }

      setActiveUserState(user);

      // 更新用户列表
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      setRepliedUsers((prev) => {
        const exists = prev.find((u) => u.id === user.id);
        if (exists) {
          return prev.map((u) =>
            String(u.id) === String(user.id) ? { ...u, unread: 0 } : u
          );
        }
        return [{ ...user, unread: 0 }, ...prev];
      });

      const k = keyOf(user.id);
      await loadHistory(user.id, 1);

      firstLoadRef.current = true;
      // disableScrollLoadRef.current = false;
    },
    [messagesMap, loadHistory]
  );

  /** 收到消息 */
  const handleIncoming = useCallback((raw: any) => {
    if (!raw) return;

    if (raw.type === "HALL" || raw.type === "RECEIVE") {
      const list = Array.isArray(raw.content) ? raw.content : [];
      const mapped = list.map((u: any) => ({
        id: u.id,
        user: u.name || u.nick || `user-${u.id}`,
        email: u.email,
        avatar: u.avatarUrl || u.avatar || "",
        lastMessage: "",
        unread: 0,
      }));
      if (raw.type === "HALL") setPendingUsers(mapped);
      if (raw.type === "RECEIVE") setRepliedUsers(mapped);
      return;
    }

    const userId = raw.senderId;
    const uid = keyOf(userId);
    if (!uid) return;

    const chatMsg: ChatMessage = {
      id: raw.id ?? `srv-${Date.now()}`,
      sender: raw.sender === "CUSTOMER" ? "CUSTOMER" : "SERVER",
      text: raw.content ?? "",
      sendTime: raw.sendTime ?? new Date().toISOString(),
      type: raw.type ?? "TEXT",
    };

    if (activeUserRef?.current?.id) {
      setMessagesMap((prev) => {
        const oldList = prev[uid]?.list || [];
        const merged = [...oldList, chatMsg];
        const deduped = merged.filter(
          (v, i, a) => a.findIndex((x) => x.id === v.id) === i
        );
        return {
          ...prev,
          [uid]: {
            list: deduped,
            page: prev[uid]?.page || 1,
            hasMore: prev[uid]?.hasMore ?? true,
          },
        };
      });
      firstLoadRef.current = true;
    }
    setRepliedUsers((prev) => {
      const exists = prev.find((u) => String(u.id) === uid);
      if (exists) {
        return prev.map((u) =>
          String(u.id) === uid
            ? {
                ...u,
                lastMessage: chatMsg.text,
                msgtype: chatMsg.type,
                unread:
                  String(activeUserRef.current?.id) !== uid
                    ? (u.unread ?? 0) + 1
                    : 0,
              }
            : u
        );
      } else {
        const newU: ChatUser = {
          id: uid,
          user: raw.fromName ?? raw.userName ?? `用户-${uid}`,
          email: raw.email,
          avatar: raw.avatar || "",
          lastMessage: chatMsg.text,
          unread: String(activeUserRef.current?.id) !== uid ? 1 : 0,
        };
        return [newU, ...prev];
      }
    });
  }, []);

  useEffect(() => {
    connectWS();
    wsRef.current = getWS();

    const unsubscribe = subscribeWS(handleIncoming);
    const unsubscribeReconnect = addReconnectListener(() => {
      const user = activeUserRef.current;
      if (!user) return;

      console.log("🔁 WS 重连，刷新当前用户聊天");
      message.success("会话连接成功");

      wsRef.current = getWS();

      // 只清空消息 活跃用户
      setMessagesMap({});
      setActiveUserState(null);
    });

    return () => {
      unsubscribe();
      unsubscribeReconnect();
    };
  }, [handleIncoming, loadHistory]);

  return {
    pendingUsers,
    repliedUsers,
    messages,
    messagesMap,
    activeUser,
    setActiveUserAsync,
    setActiveUser: setActiveUserState,
    sendMessage,
    loadHistory,
    setPendingUsers,
    setRepliedUsers,
    setMessagesMap,
    firstLoadRef,
  };
}
