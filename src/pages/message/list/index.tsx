import { finishWorkOrder, uploadChatImage } from "@/services";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useModel } from "@umijs/max";
import {
  message as AntMessage,
  Avatar,
  Button,
  Card,
  Image,
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
    setActiveUser,
    firstLoadRef,
  } = useModel("chat");
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState || {};
  const [inputValue, setInputValue] = useState("");

  // 是否在加载历史
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("messages变化", messages);
  }, [messages]);
  useEffect(() => {
    console.log("activeUser变化", activeUser);
  }, [activeUser]);

  /** 发送消息 */
  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (!activeUser) return AntMessage.warning("请先选择一个客户");
    sendMessage(inputValue);
    setInputValue("");
  };

  /** 接待/切换用户 */
  const handleAcceptUser = async (user: any) => {
    try {
      await setActiveUserAsync(user);
    } catch (err) {
      console.error("接待用户失败", err);
      AntMessage.error("接待用户失败");
    }
  };

  // 等消息真正渲染出来再滚动
  useEffect(() => {
    if (
      firstLoadRef.current &&
      messagesMap[String(activeUser?.id)]?.list?.length > 0
    ) {
      console.log("激活/切换用户 滚动到底部");
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
        firstLoadRef.current = false;
      });
    }
  }, [messagesMap, activeUser]);

  // 上拉加载历史
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (!activeUser || loadingHistory) return;

    const target = e.currentTarget;

    if (target.scrollTop <= 10) {
      const key = String(activeUser.id);
      const page = messagesMap[key]?.page || 1;

      if (messagesMap[key]?.hasMore) {
        console.log("上拉加载历史中");
        setLoadingHistory(true);

        const scrollHeightBefore = target.scrollHeight;
        const scrollTopBefore = target.scrollTop;

        await loadHistory(activeUser.id, page + 1);

        requestAnimationFrame(() => {
          const scrollDiff = target.scrollHeight - scrollHeightBefore;
          target.scrollTop = scrollTopBefore + scrollDiff;
          setLoadingHistory(false);
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
                    description={
                      item?.msgtype === "IMAGE"
                        ? "[图片]"
                        : item.lastMessage || item.email || ""
                    }
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
                  cancelButtonProps: {
                    style: { borderColor: "#f0700c", color: "#f0700c" },
                  },
                  okButtonProps: {
                    style: { backgroundColor: "#f0700c" },
                  },
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
              <>
                <span style={{
                  display: "flex",
                  justifyContent: isServer ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 8,
                }}>
                  {msg.createTime ?? msg.sendTime}
                </span>
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
                      <Image
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


              </>
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
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* 输入框 */}
            <Input.TextArea
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入回复内容..."
              onKeyDown={(e) => {
                // ✅ 按下 Enter 且没有按 Shift 时发送消息
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // 阻止换行
                  handleSend();
                }
              }}
            />

            {/* 下方工具栏 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* 左侧：表情 + 图片 */}
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  icon={
                    <span role="img" aria-label="emoji">
                      😊
                    </span>
                  }
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  表情
                </Button>
                {/* 表情选择器弹出层 */}
                {showEmojiPicker && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "45px",
                      left: 0,
                      zIndex: 1000,
                    }}
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji: any) => {
                        setInputValue((prev) => prev + emoji.native);
                        setShowEmojiPicker(false);
                      }}
                    />
                  </div>
                )}
                <Button
                  icon={
                    <span role="img" aria-label="image">
                      🖼️
                    </span>
                  }
                  onClick={() => {
                    document.getElementById("uploadInput")?.click();
                  }}
                >
                  图片
                </Button>

                <input
                  id="uploadInput"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log("选中图片：", file);
                      try {
                        const url: any = await uploadChatImage(file);

                        if (url.data) {
                          console.log("url", url.data);
                          sendMessage(url.data, "IMAGE");
                          // const socket = socketRef.current;
                          // if (socket && socket.readyState === WebSocket.OPEN) {
                          //   const payload: any = {
                          //     sender: "CUSTOMER",
                          //     type: "IMAGE",
                          //     content: url,
                          //     sendTime: new Date().toISOString(),
                          //   };
                          //   if (receiverIdRef.current)
                          //     payload.receiverId = receiverIdRef.current;
                          //   socket.send(JSON.stringify(payload));
                          // }
                          // setMessages((prev) =>
                          //   prev.map((msg) =>
                          //     msg.id === tempId
                          //       ? { ...msg, sending: false, text: url }
                          //       : msg
                          //   )
                          // );
                        }
                      } catch (err) {
                        console.error("图片上传失败", err);
                        // setMessages((prev) =>
                        //   prev.map((msg) =>
                        //     msg.id === tempId
                        //       ? {
                        //           ...msg,
                        //           sending: false,
                        //           text: "[图片发送失败]",
                        //         }
                        //       : msg
                        //   )
                        // );
                      } finally {
                        // URL.revokeObjectURL(tempUrl);
                        // if (fileInputRef.current)
                        //   fileInputRef.current.value = "";
                      }
                    }
                  }}
                />
              </div>

              {/* 右侧：发送按钮 */}
              <Button type="primary" onClick={handleSend}>
                发送
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
