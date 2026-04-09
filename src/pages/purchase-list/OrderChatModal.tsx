import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, List, Avatar, Spin, message as AntMessage } from 'antd';
import { useModel } from '@umijs/max';
import MessageBubbleList from '@/components/MessageBubbleList';
import { contactCustomer } from "@/services/chat";

interface OrderChatModalProps {
  open: boolean;
  onCancel: () => void;
  customerId: string;
  customerName: string;
  bizCode: string; // 订单号
}

const OrderChatModal: React.FC<OrderChatModalProps> = ({
  open,
  onCancel,
  customerId,
  customerName,
  bizCode
}) => {
  const { messagesMap, loadHistory, sendDirectMessage } = useModel('chat');
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState || {};

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 获取该客户的消息列表
  const messages = messagesMap[customerId]?.list || [];

  // 获取历史记录
  useEffect(() => {
    if (open && customerId) {
      setLoading(true);
      // 先调用联系客户接口，确保后端建立业务关联
      contactCustomer({ customerId: String(customerId), bizCode })
        .then(() => {
          // 关联成功后加载历史记录
          return loadHistory(customerId, 1, bizCode);
        })
        .catch((err) => {
          console.error("开启对话或拉取历史失败:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [open, customerId, bizCode, loadHistory]);

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendDirectMessage({
      customerId,
      bizCode,
      content: inputValue,
    });
    setInputValue('');
  };

  return (
    <Modal
      title={`与 ${customerName} 的沟通 (订单号: ${bizCode})`}
      open={open}
      onCancel={onCancel}
      footer={null} // 我们自定义底部的输入框
      width={600}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
        {/* 聊天内容区 */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#f8f9fa'
          }}
        >
          {loading && <Spin style={{ marginBottom: 20 }} />}
          <MessageBubbleList
            messages={messages}
            defaultCustomerAvatar={null} // 这里可以用预设头像
            serverAvatar={currentUser?.avatarFilePath || null}
          />
        </div>

        {/* 简洁输入区 */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 3 }}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入回复消息..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="primary"
              onClick={handleSend}
              style={{ alignSelf: 'flex-end', height: 32 }}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrderChatModal;
