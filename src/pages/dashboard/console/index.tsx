import { getConsoleData } from "@/services/console";
import {
  CarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserAddOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { Line } from "@ant-design/plots";
import { Col, Row, Progress, List, Avatar } from "antd";
import React, { useEffect, useState } from "react";

const Console: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getConsoleData();
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const titleStyle = {
    fontSize: 12,
    color: "#666",
    fontWeight: 400,
  };

  const valueStyle = {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  };

  const renderCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    bgColor: string,
    isSmall?: boolean,
    total?: number
  ) => (
    <ProCard
      loading={loading}
      headerBordered={false}
      style={{ background: "transparent", padding: "0", border: 0 }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isSmall ? 0 : 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isSmall ? 12 : 16,
          }}
        >
          {isSmall ? (
            <div
              style={{
                color: "rgb(40, 187, 156)",
                fontSize: 32,
              }}
            >
              {icon}
            </div>
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                backgroundColor: bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#fff",
              }}
            >
              {icon}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={isSmall ? { ...valueStyle, fontSize: 20 } : valueStyle}>
              {value}
            </div>
            <div style={titleStyle}>{title}</div>
          </div>
        </div>
        {isSmall && total && (
          <div style={{ width: "100%" }}>
            <Progress
              percent={Math.min(100, Math.round((value / total) * 100))}
              showInfo={false}
              strokeColor="rgb(40, 187, 156)"
              size="small"
              trailColor="#f0f0f0"
            />
          </div>
        )}
      </div>
    </ProCard>
  );

  // 构造图表数据
  const chartData = (data?.dailyCounts || []).flatMap((item: any) => [
    {
      date: item.date,
      type: "订单数",
      value: item.orderCount,
    },
    {
      date: item.date,
      type: "运单数",
      value: item.waybillCount,
    },
  ]);

  const config = {
    data: chartData,
    xField: "date",
    yField: "value",
    colorField: "type",
    point: {
      shapeField: "square",
      sizeField: 4,
    },
    interaction: {
      tooltip: {
        marker: false,
      },
    },
    style: {
      lineWidth: 2,
    },
    scale: {
      color: {
        range: ["#1890ff", "#52c41a"],
      },
    },
  };

  return (
    <PageContainer
      style={{
        backgroundColor: "#fff",
      }}
    // bodyStyle={{
    //   backgroundColor: "#fff",
    //   padding: 24,
    // }}
    >
      <Row gutter={[24, 24]}>
        {/* 总览数据 */}
        <Col span={6}>
          {renderCard(
            "总订单数",
            data?.orderCount || 0,
            <ShoppingCartOutlined />,
            "#1890ff"
          )}
        </Col>
        <Col span={6}>
          {renderCard(
            "总运单数",
            data?.waybillCount || 0,
            <CarOutlined />,
            "#52c41a"
          )}
        </Col>
        <Col span={6}>
          {renderCard(
            "总客户数",
            data?.customerCount || 0,
            <TeamOutlined />,
            "#722ed1"
          )}
        </Col>
        <Col span={6}>
          {renderCard(
            "下单客户数",
            data?.orderCustomerCount || 0,
            <FileTextOutlined />,
            "#faad14"
          )}
        </Col>

        {/* 下方区域：折线图 + 今日数据 */}
        <Col span={18}>
          <ProCard
            split={'horizontal'}
            loading={loading}
            headerBordered
            style={{ borderRadius: 8, height: 270, padding: "0", }}
          >
            <div style={{ height: 250 }}>
              <Line {...config} />
            </div>
          </ProCard>
        </Col>

        <Col span={6}>
          <Row gutter={[24, 24]}>
            <Col span={12}>
              {renderCard(
                "今日订单数",
                data?.todayOrderCount || 0,
                <ShoppingCartOutlined style={{ fontSize: 32 }} />,
                "rgb(40, 187, 156)",
                true,
                data?.orderCount
              )}
            </Col>
            <Col span={12}>
              {renderCard(
                "今日运单数",
                data?.todayWaybillCount || 0,
                <CarOutlined style={{ fontSize: 32 }} />,
                "rgb(40, 187, 156)",
                true,
                data?.waybillCount
              )}
            </Col>
            <Col span={12}>
              {renderCard(
                "今日新增客户数",
                data?.todayCustomerCount || 0,
                <UserAddOutlined style={{ fontSize: 32 }} />,
                "rgb(40, 187, 156)",
                true,
                data?.customerCount
              )}
            </Col>
            {/* 最新留言列表 */}
            <Col span={24} style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <MessageOutlined style={{ fontSize: 16, color: "rgb(40, 187, 156)", marginRight: 8 }} />
                <span style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>最新留言</span>
              </div>
              <List
                itemLayout="horizontal"
                dataSource={data?.latestCustomerMessage || []}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ padding: "8px 0", cursor: "pointer" }}
                  // onClick={() => {
                  //   window.open("https://bbdbuy1.com/chat", "_blank");
                  // }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ backgroundColor: "rgb(40, 187, 156)" }}
                          size="small"
                        >
                          {item.customerName?.[0]?.toUpperCase() || "U"}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>
                            {item.customerName}
                          </span>
                          <span style={{ fontSize: 10, color: "#999" }}>
                            {item.createTime?.split(" ")[1]?.slice(0, 5)}
                          </span>
                        </div>
                      }
                      description={
                        
                        <div
                          style={{
                            fontSize: 12,
                            color: "#666",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 200,
                          }}
                          title={item.content}
                        >
                          {item.content}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Console;
