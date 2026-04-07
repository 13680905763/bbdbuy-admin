import { uploadChatImage } from "@/services";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
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
  Space,
  Select,
  Tag,
} from "antd";
import MessageBubbleList from "@/components/MessageBubbleList";
import React, { useEffect, useRef, useState } from "react";
import type { RepliedUser, LobbyUser, ChatUser } from "@/models/chat";

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
    firstLoadRef,
    // 来自 Model 的业务方法
    updateSettingsAsync,
    finishWorkOrderAsync,
  } = useModel("chat");

  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState || {};
  const [inputValue, setInputValue] = useState("");

  // UI 交互状态
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLabelModalVisible, setIsLabelModalVisible] = useState(false);
  const [currentLabels, setCurrentLabels] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  /** 
   * 发送消息 
   */
  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (!activeUser) return AntMessage.warning("请先选择一个客户");
    sendMessage(inputValue);
    setInputValue("");
  };

  /** 
   * 接待/切换用户 
   */
  const handleAcceptUser = async (user: ChatUser) => {
    try {
      await setActiveUserAsync(user);
    } catch (err) {
      console.error("接待用户失败", err);
    }
  };

  /** 
   * 上拉加载历史逻辑
   */
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (!activeUser || loadingHistory) return;
    const target = e.currentTarget;
    if (target.scrollTop <= 10) {
      const key = String(activeUser.id);
      const page = messagesMap[key]?.page || 1;
      if (messagesMap[key]?.hasMore) {
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

  /**
   * 自动滚动到底部 
   */
  useEffect(() => {
    if (firstLoadRef.current && messagesMap[String(activeUser?.id)]?.list?.length > 0) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
        firstLoadRef.current = false;
      });
    }
  }, [messagesMap, activeUser, firstLoadRef]);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 220px)", gap: 16 }}>
      {/* 左侧：列表导航栏 */}
      <div style={{ width: "350px", display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
        {/* 1. 已接待列表 (消息列表) */}
        <Card
          title="消息列表"
          style={{ flex: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}
          styles={{ body: { flex: 1, overflowY: "auto", padding: 0 } }}
        >
          <List
            itemLayout="horizontal"
            dataSource={repliedUsers}
            renderItem={(item: RepliedUser) => (
              <List.Item
                onClick={() => handleAcceptUser(item)}
                style={{
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                  background: activeUser?.id === item.id ? "#f0f5ff" : "transparent",
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.avatarUrl || null} />}
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {item.top && <Tag color="blue" style={{ margin: 0, padding: '0 4px', fontSize: 10 }}>置顶</Tag>}
                        {item.nickName}
                      </span>
                      {item.unread ? <span style={{ color: "red" }}>({item.unread})</span> : null}
                    </div>
                  }
                  description={
                    <div>
                      {item.label && item.label.length > 0 && (
                        <div style={{ marginBottom: 4 }}>
                          {item.label.map(tag => (
                            <Tag key={tag} style={{ margin: '0 4px 0 0', fontSize: 10 }}>{tag}</Tag>
                          ))}
                        </div>
                      )}
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#999' }}>
                        {item?.msgtype === "IMAGE" ? "[图片]" :
                          item?.msgtype === "ORDER" ? "[订单]" :
                            item?.msgtype === "WAYBILL" ? "[包裹]" :
                              item.lastMessage || item.email || ""}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        {/* 2. 大厅列表 (未接待) */}
        <Card
          title="大厅"
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}
          styles={{ body: { flex: 1, overflowY: "auto", padding: 0 } }}
        >
          <List
            itemLayout="horizontal"
            dataSource={pendingUsers}
            renderItem={(item: LobbyUser) => (
              <List.Item
                onClick={() => handleAcceptUser(item)}
                style={{
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: "8px",
                  background: activeUser?.id === item.id ? "#f0f5ff" : "transparent",
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.avatarUrl || null} />}
                  title={<span>{item.nickName}</span>}
                  description={<div style={{ fontSize: 12, color: '#999' }}>{item.email}</div>}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 右侧：聊天窗口界面 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        {/* 头部：客户信息与操作 */}
        <div style={{ borderBottom: "1px solid #f0f0f0", padding: "12px 16px", fontWeight: "bold", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {activeUser ? `与 ${activeUser.nickName} 的对话` : "请选择一个客户"}
          {activeUser && (
            <Space>
              {'top' in activeUser && (
                <>
                  <Button
                    size="small"
                    type={activeUser.top ? "primary" : "default"}
                    onClick={() => updateSettingsAsync(!activeUser.top, activeUser.label || [])}
                  >
                    {activeUser.top ? "取消置顶" : "置顶"}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setCurrentLabels(activeUser.label || []);
                      setIsLabelModalVisible(true);
                    }}
                  >
                    设置标签
                  </Button>
                </>
              )}
              <Button
                danger
                size="small"
                onClick={() => {
                  Modal.confirm({
                    title: "确认结束会话吗？",
                    content: `结束本次与 ${activeUser.nickName} 的会话`,
                    okText: "确认",
                    cancelText: "取消",
                    onOk: async () => {
                      // 这里直接调用 Model 业务函数，副作用已在内部处理
                      await finishWorkOrderAsync();
                    },
                  });
                }}
              >
                结束会话
              </Button>
            </Space>
          )}
        </div>

        {/* 中间：消息展示滚动区 */}
        <div
          ref={chatListRef}
          style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16, background: "#fdfdfd" }}
          onScroll={handleScroll}
        >
          {loadingHistory && <Spin style={{ margin: '10px auto' }} />}
          <MessageBubbleList
            messages={messages}
            defaultCustomerAvatar={activeUser?.avatarUrl || null}
            serverAvatar={currentUser?.avatarFilePath || null}
          />
          <div ref={chatEndRef} />
        </div>

        {/* 底部：消息输入操作区 */}
        {activeUser && (
          <div style={{ borderTop: "1px solid #f0f0f0", padding: 16, background: "#fff" }}>
            <Input.TextArea
              rows={3}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入回复内容... (回车发送)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ marginBottom: 12, borderRadius: 6 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                <div style={{ position: 'relative' }}>
                  <Button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊 表情</Button>
                  {showEmojiPicker && (
                    <div style={{ position: "absolute", bottom: "45px", left: 0, zIndex: 1000 }}>
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) => {
                          setInputValue((prev) => prev + emoji.native);
                          setShowEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
                <Button onClick={() => document.getElementById("uploadInput")?.click()}>🖼️ 图片</Button>
                <input
                  id="uploadInput"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const urlRes: any = await uploadChatImage(file);
                        if (urlRes.data) sendMessage(urlRes.data, "IMAGE");
                      } catch (err) {
                        AntMessage.error("图片上传失败");
                      }
                    }
                  }}
                />
              </Space>
              <Button type="primary" onClick={handleSend} size="large" style={{ minWidth: 100 }}>发送</Button>
            </div>
          </div>
        )}
      </div>

      {/* 弹窗：标签设置 */}
      <Modal
        title="设置标签"
        open={isLabelModalVisible}
        onOk={async () => {
          if (activeUser && 'top' in activeUser) {
            await updateSettingsAsync(activeUser.top, currentLabels);
          }
          setIsLabelModalVisible(false);
        }}
        onCancel={() => setIsLabelModalVisible(false)}
      >
        <Select
          mode="tags"
          style={{ width: "100%" }}
          placeholder="请输入或选择标签"
          value={currentLabels}
          onChange={(val) => setCurrentLabels(val)}
          options={[
            { value: '重要', label: '重要' },
            { value: '非常重要', label: '非常重要' },
            { value: '等待处理', label: '等待处理' },
          ]}
        />
      </Modal>
    </div>
  );
};

export default MessageList;
