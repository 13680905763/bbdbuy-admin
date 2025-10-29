// src/pages/inventory/ScanIn/index.tsx
import { getPackScan, PackSubmit } from "@/services";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ProColumns } from "@ant-design/pro-table";
import { Button, Card, Input, message } from "antd";
import React, { useRef, useState } from "react";

const ParticularPaper: React.FC = () => {
  const [scanValue, setScanValue] = useState("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const handleScan = async () => {
    if (!scanValue.trim()) {
      message.warning("请输入条码");
      return;
    }
    const res = await getPackScan(scanValue);
    if (res.success) {
      setTableData([res?.data]);
      console.log("tableData", res?.data);
    }
  };

  const handleSubmit = async () => {
    if (!tableData.length) {
      message.warning("没有数据可提交");
      return;
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
        return items.map((items: any) => {
          return <p>{items.location.packageCode}</p>;
        });
      },
    },

    {
      title: "附加服务",
      dataIndex: "services",
      render: (services: any) => {
        // console.log("services", services);
        return services.map((item) => {
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
          <Input
            ref={inputRef}
            placeholder="请扫描或输入商品条码后回车"
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
