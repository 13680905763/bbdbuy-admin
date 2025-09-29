import { finishWorkOrder } from "@/services";
import { useModel } from "@umijs/max";
import {
  message as AntMessage,
  Avatar,
  Button,
  Card,
  Input,
  List,
  Modal,
  Spin,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

const MessageList: React.FC = () => {
  const {
    pendingUsers,
    repliedUsers,
    activeUser,
    setActiveUserAsync,
    messages,
    loadHistory,
    messagesMap,
    sendMessage,
    setPendingUsers,
    setRepliedUsers,
    setActiveUser,
  } = useModel("chat");
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState || {};
  const [inputValue, setInputValue] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  // 用 ref 标记是否在加载历史
  const loadingHistoryRef = useRef(false);
  const firstLoadRef = useRef(true); // 是否首次加载用户历史

  const isInitialScrollRef = useRef(false);
  useEffect(() => {
    console.log("messages变化");
  }, [messages]);
  /** 初次激活用户，加载第一页历史 */
  useEffect(() => {
    if (!firstLoadRef.current) return;
    if (!activeUser) return;
    const key = String(activeUser.id);
    console.log("首次加载");

    const loadFirstPage = async () => {
      if (!messagesMap[key]) {
        await loadHistory(activeUser.id, 1);
      }
      setInitialLoadDone(true);

      // 这里不直接滚动，只打个标记
      isInitialScrollRef.current = true;
      firstLoadRef.current = false;
      console.log("加载完成");
    };

    loadFirstPage();
  }, [activeUser, messagesMap, loadHistory]);

  /** 等消息真正渲染出来再滚动 */
  useEffect(() => {
    if (
      isInitialScrollRef.current &&
      messagesMap[String(activeUser?.id)]?.list?.length > 0
    ) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
        isInitialScrollRef.current = false; // 用完清掉
      });
    }
  }, [messagesMap, activeUser]);

  /** 发送消息 */
  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (!activeUser) return AntMessage.warning("请先选择一个客户");
    sendMessage(inputValue);
    setInputValue("");
  };

  // 用 ref 标记是切换用户触发的滚动
  const scrollOnUserChangeRef = useRef(false);

  /** 接待/切换用户 */
  const handleAcceptUser = async (user: any) => {
    try {
      await setActiveUserAsync(user);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      setRepliedUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [user, ...prev];
      });

      // 切换用户后标记要滚动
      scrollOnUserChangeRef.current = true;
    } catch (err) {
      console.error("接待用户失败", err);
      AntMessage.error("接待用户失败");
    }
  };

  /** 等消息渲染完成再滚动到底部（切换用户） */
  useEffect(() => {
    if (scrollOnUserChangeRef.current && activeUser) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
        scrollOnUserChangeRef.current = false;
      });
    }
  }, [messages, activeUser]);

  // 上拉加载历史
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (!activeUser || !initialLoadDone || loadingHistoryRef.current) return;
    const target = e.currentTarget;

    if (target.scrollTop <= 10) {
      const key = String(activeUser.id);
      const page = messagesMap[key]?.page || 1;

      if (messagesMap[key]?.hasMore) {
        setLoadingHistory(true);
        loadingHistoryRef.current = true;
        console.log("loadingHistoryRef.current", loadingHistoryRef.current);

        const scrollHeightBefore = target.scrollHeight;
        const scrollTopBefore = target.scrollTop;

        await loadHistory(activeUser.id, page + 1);

        requestAnimationFrame(() => {
          const scrollDiff = target.scrollHeight - scrollHeightBefore;
          target.scrollTop = scrollTopBefore + scrollDiff;

          setLoadingHistory(false);
          loadingHistoryRef.current = false;
        });
      }
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", gap: 16 }}>
      {/* 左侧：用户列表 */}
      <div
        style={{
          width: "33%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Card
          title="已回复消息"
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <div style={{ flex: 1, overflowY: "auto" }}>
            <List
              itemLayout="horizontal"
              dataSource={repliedUsers}
              renderItem={(item) => (
                <List.Item
                  onClick={() => {
                    handleAcceptUser(item);
                    // firstLoadRef.current = true;
                  }}
                  style={{
                    cursor: "pointer",
                    background:
                      activeUser?.id === item.id ? "#f0f5ff" : "transparent",
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar || null} />}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{item.user}</span>
                        {item.unread ? (
                          <span style={{ color: "red" }}>({item.unread})</span>
                        ) : null}
                      </div>
                    }
                    description={item.lastMessage || item.email || ""}
                  />
                </List.Item>
              )}
            />
          </div>
        </Card>

        <Card
          title="大厅未接待"
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <div style={{ flex: 1, overflowY: "auto" }}>
            <List
              itemLayout="horizontal"
              dataSource={pendingUsers}
              renderItem={(item) => (
                <List.Item
                  onClick={() => handleAcceptUser(item)}
                  style={{
                    cursor: "pointer",
                    background:
                      activeUser?.id === item.id ? "#f0f5ff" : "transparent",
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={item.user}
                    description={item.email || ""}
                  />
                </List.Item>
              )}
            />
          </div>
        </Card>
      </div>

      {/* 右侧：聊天窗口 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          border: "1px solid #f0f0f0",
          borderRadius: 8,
        }}
      >
        {/* 顶部 */}
        <div
          style={{
            borderBottom: "1px solid #f0f0f0",
            padding: "8px 12px",
            fontWeight: "bold",
            background: "#fafafa",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {activeUser ? `与 ${activeUser.user} 的对话` : "请选择一个客户"}
          {activeUser && (
            <Button
              danger
              size="small"
              onClick={() => {
                Modal.confirm({
                  title: "确认结束会话吗？",
                  content: `结束本次与 ${activeUser.user} 的会话`,
                  okText: "确认",
                  cancelText: "取消",
                  onOk: async () => {
                    console.log("activeUser", activeUser);

                    try {
                      await finishWorkOrder({
                        avatarUrl: activeUser.avatar,
                        email: activeUser.email,
                        id: activeUser.id,
                        name: activeUser.user,
                      });
                      AntMessage.success("已结束会话");
                      setActiveUser(null);
                    } catch (err) {
                      console.error(err);
                      AntMessage.error("结束会话失败");
                    }
                  },
                });
              }}
            >
              结束会话
            </Button>
          )}
        </div>

        {/* 消息列表 */}
        <div
          ref={chatListRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "#fff",
          }}
          onScroll={handleScroll}
        >
          {loadingHistory && (
            <Spin
              style={{ textAlign: "center", marginBottom: 12 }}
              spinning={true}
            />
          )}

          {messages.map((msg) => {
            const isServer = msg.sender === "SERVER";
            const isCustomer = msg.sender === "CUSTOMER";
            const isImage = msg.type === "IMAGE";

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isServer ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {isCustomer && <Avatar src={activeUser?.avatar || null} />}

                <div
                  style={{
                    background: isServer ? "#e6f7ff" : "#f5f5f5",
                    padding: isImage ? 0 : "8px 12px",
                    borderRadius: 8,
                    maxWidth: isImage ? "200px" : "60%",
                    wordBreak: "break-word",
                  }}
                >
                  {isImage ? (
                    <img
                      src={msg.text || undefined} // 图片地址存放在 msg.text
                      alt="图片消息"
                      style={{
                        width: "200px",
                        height: "auto",
                        borderRadius: 8,
                        display: "block",
                      }}
                    />
                  ) : (
                    msg.text
                  )}
                </div>

                {isServer && (
                  <Avatar src={currentUser?.avatarFilePath || null} />
                )}
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        {/* 输入框 */}
        {activeUser && (
          <div
            style={{
              borderTop: "1px solid #f0f0f0",
              padding: 8,
              display: "flex",
              gap: 8,
              background: "#fff",
            }}
          >
            <Input.TextArea
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入回复内容..."
            />
            <Button type="primary" onClick={handleSend}>
              发送
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
