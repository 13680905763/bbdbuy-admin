// src/pages/inventory/ScanIn/index.tsx
import { getPackScan, PackSubmit } from "@/services";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ProColumns } from "@ant-design/pro-table";
import { Button, Card, Input, message, Switch, Space } from "antd";
import React, { useRef, useState } from "react";

const ParticularPaper: React.FC = () => {
  const [scanValue, setScanValue] = useState("");
  const [verifyScanValue, setVerifyScanValue] = useState("");
  const [isStrictPackingMode, setIsStrictPackingMode] = useState(false); // 默认开启严格模式
  const [tableData, setTableData] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  const verifyInputRef = useRef(null);

  const handleScan = async () => {
    if (!scanValue.trim()) {
      message.warning("请输入条码");
      return;
    }
    const res = await getPackScan(scanValue);
    if (res.success) {
      // 初始化状态为未打包
      const newData = { ...res?.data, status: "未打包" };
      setTableData([newData]);
      console.log("tableData", newData);
      // 自动聚焦到校验输入框
      setTimeout(() => {
        (verifyInputRef.current as any)?.focus();
      }, 100);
    }
  };

  const handleVerifyScan = () => {
    if (!verifyScanValue.trim()) {
      message.warning("请输入包裹号");
      return;
    }

    let found = false;
    const newTableData = tableData.map((record) => {
      // 检查记录中的 items 是否包含扫描的包裹号
      const newItems = record.items?.map((item: any) => {
        if (item.packageCode === verifyScanValue.trim()) {
          found = true;
          return { ...item, status: "已打包" };
        }
        return item;
      });

      // 如果 items 中所有包裹都已打包，则整个记录状态为已打包
      const allPacked = newItems?.every((item: any) => item.status === "已打包");
      
      return { 
        ...record, 
        items: newItems,
        status: allPacked ? "已打包" : record.status // 更新主记录状态
      };
    });

    if (found) {
      setTableData(newTableData);
      message.success("校验成功，状态已更新");
      setVerifyScanValue("");
    } else {
      message.error("未找到该包裹或不在当前列表中");
    }
  };

  const handleSubmit = async () => {
    if (!tableData.length) {
      message.warning("没有数据可提交");
      return;
    }
    
    // 严格模式下才校验包裹状态
    if (isStrictPackingMode) {
      const hasUnpacked = tableData.some((item) => item.status !== "已打包");
      if (hasUnpacked) {
        message.warning("请对所有包裹完成状态扫码");
        return;
      }
    }

    setSubmitting(true); // 开始 loading
    try {
      const data: any = {
        finishList: tableData.map((item) => ({
          id: item.id,
          weight: item.weight,
          length: item.length,
          width: item.width,
          height: item.height,
        })),
      };

      const res = await PackSubmit(data);
      if (res.success) {
        message.success("提交成功");
        setTableData([]);
        setScanValue("");
      }
    } finally {
      setSubmitting(false); // 无论成功失败都关闭 loading
    }
  };
  const columns: ProColumns<any>[] = [
    { title: "出库单号", dataIndex: "outboundCode" },

    {
      title: "包裹信息",
      dataIndex: "items",
      render: (items: any) => {
        return items.map((item: any) => {
          return (
            <div key={item.packageCode} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{item.packageCode}</span>
              {isStrictPackingMode && (
                item.status === "已打包" ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )
              )}
            </div>
          );
        });
      },
    },

    {
      title: "附加服务",
      dataIndex: "services",
      render: (services: any) => {
        // console.log("services", services);
        return services.map((item: any) => {
          return <p>{item.serviceName + "--" + item.serviceStatus}</p>;
        });
      },
    },
    {
      title: "长（cm）",
      dataIndex: "length",
      render: (text, record, index) => (
        <Input
          min={1}
          type="number"
          defaultValue={Number(text)}
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].length = Number(newValue);
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "宽（cm）",
      dataIndex: "width",

      render: (text, record, index) => (
        <Input
          min={1}
          defaultValue={Number(text)}
          type="number"
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].width = Number(newValue);
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "高（cm）",
      dataIndex: "height",
      render: (text, record, index) => (
        <Input
          min={1}
          type="number"
          defaultValue={Number(text)}
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].height = Number(newValue);
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "重量（g）",
      dataIndex: "weight",
      render: (text, record, index) => (
        <Input
          type="number"
          min={1}
          defaultValue={Number(text)}
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].weight = Number(newValue);
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      hideInTable: !isStrictPackingMode, // 普通模式下隐藏
      render: (text, record, index) => (
        <span style={{ fontSize: 24 }}>
          {text === "已打包" ? (
            <CheckCircleOutlined style={{ color: "green" }} />
          ) : (
            <CloseCircleOutlined style={{ color: "red" }} />
          )}
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card>
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            backgroundColor: "#fffbe6",
            border: "1px solid #f0700c",
            borderRadius: 8,
          }}
        >
          <h3>使用说明：</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li>请使用扫码枪对准拣货条码进行扫描</li>
            <li>扫码成功后拣货信息将显示在下方列表</li>
            <li>请确保网络正常，避免扫码失败</li>
          </ul>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Space>
            <span>打包模式：</span>
            <Switch
              checkedChildren="严格"
              unCheckedChildren="普通"
              checked={isStrictPackingMode}
              onChange={setIsStrictPackingMode}
            />
            <span style={{ color: "#999", fontSize: 12 }}>
              {isStrictPackingMode
                ? "（需扫描包裹号进行校验）"
                : "（无需校验直接提交）"}
            </span>
          </Space>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Input
            ref={inputRef}
            placeholder="请扫描拣货条码"
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onPressEnter={handleScan}
            style={{
              width: 480,
              height: 60,
              fontSize: 20,
              backgroundColor: "#fffbe6",
              border: "2px solid #f0700c",
              boxShadow: "0 0 5px rgba(240, 112, 12, 0.6)",
              paddingLeft: 16,
            }}
          />
        </div>
        
        {isStrictPackingMode && (
          <div style={{ marginBottom: 24 }}>
            <Input
              ref={verifyInputRef}
              placeholder="请扫描包裹号校验"
              value={verifyScanValue}
              onChange={(e) => setVerifyScanValue(e.target.value)}
              onPressEnter={handleVerifyScan}
              style={{
                width: 480,
                height: 60,
                fontSize: 20,
                backgroundColor: "#f6ffed",
                border: "2px solid #52c41a",
                boxShadow: "0 0 5px rgba(82, 196, 26, 0.6)",
                paddingLeft: 16,
              }}
            />
          </div>
        )}

        <ProTable
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          search={false}
          options={false}
          bordered
        />
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            size="large"
            loading={submitting}
            disabled={!tableData.length}
          >
            打包完成
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ParticularPaper;
