import {
  acceptUser,
  fetchChatHistory as apiFetchChatHistory,
} from "@/services";
import { connectWS, getWS, subscribeWS } from "@/utils/ws";
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
  page: number; // 当前已加载到第几页
  hasMore: boolean; // 是否还有更多
}

export default function useChatModel() {
  const [pendingUsers, setPendingUsers] = useState<ChatUser[]>([]);
  const [repliedUsers, setRepliedUsers] = useState<ChatUser[]>([]);
  const [messagesMap, setMessagesMap] = useState<
    Record<string, PaginatedMessages>
  >({});
  const [activeUser, setActiveUserState] = useState<ChatUser | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const keyOf = (id: number | string | undefined) =>
    id === undefined ? "" : String(id);

  const messages = activeUser
    ? messagesMap[keyOf(activeUser.id)]?.list || []
    : [];

  /** 发送消息 */
  const sendMessage = useCallback(
    (content: string, type = "TEXT") => {
      if (!activeUser)
        return console.warn("sendMessage: no activeUser selected");

      const ws = wsRef.current || getWS();
      const payload = {
        sender: "SERVER",
        type,
        content,
        receiverId: activeUser.id,
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
        const k = keyOf(activeUser.id);
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

      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(payload));
        } catch (err) {
          console.error("ws.send error", err);
        }
      }

      setRepliedUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(activeUser.id)
            ? { ...u, lastMessage: content }
            : u
        )
      );
    },
    [activeUser]
  );

  /** 拉历史分页 */
  const loadHistory = useCallback(
    async (userId: string | number, page: number) => {
      try {
        const res: any = await apiFetchChatHistory(userId, page);
        const records: any[] = res.data.records || [];
        const lastPage: number = res.data.pages; // 接口返回的最后一页
        console.log("page < lastPage", page < lastPage, page, lastPage);

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

          // 去重
          const deduped: ChatMessage[] = merged.filter(
            (v, i, a) => a.findIndex((x) => x.id === v.id) === i
          );
          console.log("deduped", deduped);

          return {
            ...prev,
            [k]: {
              list: deduped,
              page, // 当前已加载的最大页
              hasMore: page < lastPage, // 还有下一页才 true
            },
          };
        });
      } catch (err) {
        console.error("fetchChatHistory failed", err);
      }
    },
    []
  );

  /** 激活用户并拉第一页历史 */
  const setActiveUserAsync = useCallback(
    async (user: ChatUser | null) => {
      if (!user) {
        setActiveUserState(null);
        return;
      }

      try {
        await acceptUser(user.id);
      } catch (err) {
        console.warn("acceptUser failed", err);
      }

      setActiveUserState(user);
      const k = keyOf(user.id);

      // 如果未加载过历史
      if (!messagesMap[k]) {
        await loadHistory(user.id, 1);
      }

      // unread 归零
      setRepliedUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(user.id) ? { ...u, unread: 0 } : u
        )
      );
    },
    [messagesMap, loadHistory]
  );

  /** WS 收到消息 */
  const handleIncoming = useCallback(
    async (raw: any) => {
      if (!raw) return;

      // HALL / RECEIVE
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

      // 普通消息
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
                    String(activeUser?.id) !== uid ? (u.unread ?? 0) + 1 : 0,
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
            unread: String(activeUser?.id) !== uid ? 1 : 0,
          };
          return [newU, ...prev];
        }
      });
    },
    [activeUser]
  );

  /** 订阅 WS */
  useEffect(() => {
    connectWS();
    wsRef.current = getWS();
    const unsubscribe = subscribeWS(handleIncoming);
    return () => unsubscribe();
  }, [handleIncoming]);

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
  };
}
