import { downloadApk, downloadPlugin } from "@/services";
import { DownloadOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { Button, Card, Col, Row, Space, Tag, Typography, message } from "antd";
import React from "react";
// import { downloadApk, downloadPlugin } from "@/services";

const { Paragraph, Title, Text } = Typography;

interface SoftwareItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  version: string;
  description: string;
  updateTime: string;
  updateLog: string[];
  downloadUrl: string;
}

const softwareList: SoftwareItem[] = [
  {
    id: "1",
    name: "仓库小助手",
    icon: (
      <img
        src="/warehouse_assistant.png"
        alt="仓库小助手"
        style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
      />
    ),
    version: "v1.2.5",
    description: "专为仓库管理人员设计的辅助工具，提升入库、出库效率。",
    updateTime: "2026-04-07",
    updateLog: [
      "2026-04-07 更新：",
      "1. **",
      "2026-03-31 更新：",
      "1. 拍照上传加载动画",
      "2026-01-22 更新：",
      "1. 支持连续扫码",
      "2026-01-19 更新：",
      "1. 修复入库拍照sku报错问题",
      "-------------------",
      "2025-12-27 更新：",
      "1. 拍照连拍",
      "2. 登录页面环境切换",
      "3. 修复已知bug",
    ],
    downloadUrl: "/download/apk", // 标识调用 APK 下载接口
  },
  {
    id: "2",
    name: "原快递单号回填插件",
    icon: (
      <img
        src="/express-backfill.jpg"
        alt="插件"
        style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
      />
    ),
    version: "v1.1.0",
    description: "原快递单号回填插件。",
    updateTime: "2026-1-2",
    updateLog: ["1. 1688sku兼容"],
    downloadUrl: "/download/plugin", // 标识调用插件下载接口
  },
];

const DownloadCenter: React.FC = () => {

  const [expandedLogs, setExpandedLogs] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownload = async (item: SoftwareItem) => {
    const hide = message.loading('下载中...', 0);
    try {
      let res: any;
      let extension = '';

      if (item.downloadUrl === '/download/apk') {
        res = await downloadApk();
        extension = '.apk';
      } else if (item.downloadUrl === '/download/plugin') {
        res = await downloadPlugin();
        extension = '.zip';
      } else {
        if (item.downloadUrl) {
          window.open(item.downloadUrl, "_blank");
        }
        hide();
        return;
      }

      // 假设后端直接返回文件流
      if (res?.data) {
        const blob = new Blob([res?.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        // 尝试从响应头获取文件名，如果没有则使用默认名
        // const contentDisposition = res.response?.headers?.get('content-disposition');
        // let fileName = item.name + extension;
        // if (contentDisposition) {
        //     const match = contentDisposition.match(/filename="?([^"]+)"?/);
        //     if (match && match[1]) fileName = match[1];
        // }

        link.setAttribute('download', item.name + extension);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('开始下载');
      } else {
        message.error('文件流获取失败');
      }

    } catch (error) {
      console.error(error);
      message.error('下载请求失败');
    } finally {
      hide();
    }
  };

  return (
    <PageContainer title="下载中心">
      <Row gutter={[16, 16]}>
        {softwareList.map((item) => (
          <Col
            key={item.id}
            xs={24}
            sm={24}
            md={12}
            lg={12}
            xl={8}
            xxl={6}
            style={{ display: "flex" }}
          >
            <Card
              hoverable={false}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
              styles={{ body: { flex: 1 } }}
              actions={[
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(item)}
                  block
                >
                  立即下载
                </Button>,
              ]}
            >
              <Card.Meta
                avatar={item.icon}
                title={
                  <Space>
                    {item.name}
                    <Tag color="orange">{item.version}</Tag>
                  </Space>
                }
                description={
                  <div style={{ minHeight: 120 }}>
                    <Paragraph ellipsis={{ rows: 2 }}>
                      {item.description}
                    </Paragraph>
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        更新时间: {item.updateTime}
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 12 }}>
                            更新内容：
                          </Text>
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0, fontSize: 12 }}
                            onClick={() => toggleExpand(item.id)}
                          >
                            {expandedLogs[item.id] ? '收起' : '展开'}
                          </Button>
                        </div>
                        <ul
                          style={{
                            paddingLeft: 20,
                            margin: "4px 0",
                            fontSize: 12,
                            color: "#666",
                            maxHeight: expandedLogs[item.id] ? 'none' : '40px',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease',
                          }}
                        >
                          {item.updateLog.map((log, index) => (
                            <li key={index}>{log}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
};

export default DownloadCenter;
