import React from "react";
import { Avatar, Card, Image, Typography, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
const { Paragraph, Title, Text } = Typography;
export interface MessageItem {
  id: string | number;
  sender: string;
  type?: string;
  text: string;
  createTime?: string;
  sendTime?: string;
  customerName?: string;
  customerAvatar?: string;
  [key: string]: any;
}

export interface MessageBubbleListProps {
  messages: any[];
  defaultCustomerAvatar?: string | null;
  serverAvatar?: string | null;
  showCustomerName?: boolean;
}

const MessageBubbleList: React.FC<MessageBubbleListProps> = ({
  messages,
  defaultCustomerAvatar,
  serverAvatar,
  showCustomerName = false,
}) => {
  return (
    <>
      {messages.map((msg) => {
        const isServer = msg.sender === "SERVER";
        const isCustomer = msg.sender === "CUSTOMER";
        const isImage = msg.type === "IMAGE";
        const isOrder = msg.type === "ORDER";
        const isPackage = msg.type === "WAYBILL";

        // 解析 Order 内容
        let orderData: any = null;
        if (isOrder) {
          try {
            orderData = JSON.parse(msg.text);
          } catch (e) {
            console.error("解析订单消息失败", e);
          }
        }

        const renderCustomerAvatar = () => {
          if (msg.customerAvatar || defaultCustomerAvatar) {
            return <Avatar src={msg.customerAvatar || defaultCustomerAvatar} />;
          }
          if (msg.customerName) {
            return (
              <Avatar style={{ backgroundColor: "rgb(40, 187, 156)" }}>
                {msg.customerName[0]?.toUpperCase() || "U"}
              </Avatar>
            );
          }
          return <Avatar src={null} />;
        };

        return (
          <React.Fragment key={msg.id}>
            <span
              style={{
                display: "flex",
                justifyContent: isServer ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              {msg.createTime ?? msg.sendTime}
            </span>
            <div
              style={{
                display: "flex",
                justifyContent: isServer ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              {isCustomer && renderCustomerAvatar()}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  alignItems: isServer ? "flex-end" : "flex-start",
                  maxWidth: isImage ? "200px" : isOrder || isPackage ? "300px" : "60%",
                }}
              >
                {showCustomerName && isCustomer && msg.customerName && (
                  <span style={{ fontSize: 12, color: "#999", marginLeft: 4 }}>
                    {msg.customerName}
                  </span>
                )}
                <div
                  style={{
                    background: isServer ? "#e6f7ff" : "#f5f5f5",
                    padding: isImage || isOrder || isPackage ? 0 : "8px 12px",
                    borderRadius: 8,
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
                  ) : isOrder && orderData ? (
                    <Card
                      size="small"
                      title={`订单号：${orderData.orderCode}`}
                      style={{ width: "100%", borderRadius: 8 }}
                      bodyStyle={{ padding: "8px" }}
                    >
                      {orderData.products?.map((prod: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 8,
                            borderBottom:
                              idx < orderData.products.length - 1
                                ? "1px solid #f0f0f0"
                                : "none",
                            paddingBottom: 8,
                          }}
                        >
                          <Image
                            src={prod.skuPicUrl || prod.picUrl}
                            width={50}
                            height={50}
                            referrerPolicy="no-referrer"
                            style={{ borderRadius: 4, objectFit: "cover" }}
                            preview={false}
                          />
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: "bold",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                wordBreak: "break-all",
                              }}
                              title={prod.productTitle}
                            >
                              {prod.productTitle}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#666",
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 4,
                              }}
                            >
                              <span>x {prod.purchaseQuantity}</span>
                              <span style={{ color: "#f50" }}>{prod.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Card>
                  ) : isPackage ? (
                    <div style={{ borderRadius: 8, backgroundColor: "#dbeafe", padding: 8, fontFamily: "monospace", fontSize: 14, color: "#000", width: "100%" }}>
                      {(() => {
                        try {
                          const waybill = JSON.parse(msg.text || "{}");
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <div style={{ fontWeight: 600, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>
                                包裹号: {waybill.packingPackageCode}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                                {waybill.shippingCode && (
                                  <div>
                                    <span style={{ color: "#6b7280" }}>物流单号: </span>
                                    {waybill.shippingCode}
                                  </div>
                                )}
                                {waybill.pic && waybill.pic.length > 0 && (
                                  <div style={{ display: "flex", gap: 8, marginTop: 4, overflowX: "auto", flexWrap: "wrap" }}>
                                    {waybill.pic.map((url: string, index: number) => (
                                      <Image
                                        key={index}
                                        src={url}
                                        referrerPolicy="no-referrer"
                                        alt="waybill pic"
                                        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                                      />
                                    ))}
                                  </div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 4, marginTop: 4 }}>
                                  <div>
                                    <span style={{ color: "#6b7280" }}>重量: </span>
                                    {waybill.weight}g
                                  </div>
                                  <div>
                                    <span style={{ color: "#6b7280" }}>尺寸: </span>
                                    {waybill.length}*{waybill.width}*{waybill.height}cm
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return <div>{msg.text}</div>;
                        }
                      })()}
                    </div>
                  ) : (
                    <Text
                    >
                      {msg.text}
                    </Text>
                  )}
                </div>
                {isServer && msg.status === 'sending' && (
                  <div style={{ marginRight: 8, fontSize: 12, color: "#1890ff" }}>
                    <LoadingOutlined spin /> 发送中...
                  </div>
                )}
              </div>

              {isServer && <Avatar src={serverAvatar || null} />}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

export default MessageBubbleList;
