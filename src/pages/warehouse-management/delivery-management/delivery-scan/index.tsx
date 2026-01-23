// src/pages/inventory/ScanIn/index.tsx
import { getGoodsType } from "@/services";
import { getInboundReceiveScan, getInspectionScan, inboundReceiveSubmit, InspectionSubmit } from "@/services/order";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ProColumns } from "@ant-design/pro-table";
import { Button, Card, Image, Input, message, Select } from "antd";
import React, { useEffect, useRef, useState } from "react";

const ParticularPaper: React.FC = () => {
  const [scanValue, setScanValue] = useState("");
  const [tableData, setTableData] = useState<any[]>([]);
  const inputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: string | number }[]
  >([]);
  // 1️⃣ 初始化商品类型
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await getGoodsType();
        const options = res.data.map((item: any) => ({
          label: item.categoryName,
          value: item.id,
          isDefault: item.defaultCategory === 1 ? true : false, // 标记是否默认
        }));
        setCategoryOptions(options);
      } catch (err) {
        message.error("加载商品类型失败");
      }
    };

    fetchCategories();
  }, []);

  const handleScan = async () => {
    if (!scanValue.trim()) {
      message.warning("请输入条码");
      return;
    }
    const logisticsCode = scanValue.trim();

    // 条码重复判断
    if (tableData.some((item) => item.logisticsCode === logisticsCode)) {
      message.warning("该物流单号已存在！");
      setScanValue(""); // 清空输入框
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await getInboundReceiveScan(logisticsCode);

      if (res.data === "WMS_RECEIVE_SCAN_UNKNOWN_LOGISTICS_CODE") {
        message.warning("未知物流");
        setTableData((prev) => [
          { 
            logisticsCompany: "未知物流", 
            logisticsCode: logisticsCode, 
            type: 0 
          },
          ...prev,
        ]);
      } else if (res.data && res.data.length > 0) {
        message.success("读取物流成功");
        const logisticsInfo = res.data[0];
        setTableData((prev) => [
          {
            logisticsCompany: logisticsInfo.logisticsCompany,
            logisticsCode: logisticsInfo.logisticsCode,
            type: 1,
            // 如果 API 返回其他有用字段，也可以加在这里
            ...logisticsInfo
          },
          ...prev,
        ]);
      } else {
        message.error("未查询到物流信息");
      }
      
      setScanValue(""); // 扫码成功后清空
    } catch (error: any) {
      console.error("扫码请求出错:", error);
      message.error("扫码请求出错");
    } finally {
      setIsLoading(false);
      // 保持输入框焦点 (如果需要)
      // inputRef.current?.focus(); 
    }
  };


  const handleSubmit = async () => {
    setSubmitting(true); // 开始 loading
    try {
      const data: any = tableData.map((item) => {
        return item.logisticsCode;
      });
      console.log("data", data);



      const res = await inboundReceiveSubmit({logisticsCodeList:data});
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
    { title: "物流公司", dataIndex: "logisticsCompany", width: 150 },
    { title: "快递单号", dataIndex: "logisticsCode", width: 200 },
    {
      title: "识别结果",
      dataIndex: "type",
      width: 100,
      render: (text, record) => {
        const isSuccess = record.type === 1;
        return (
          <div
            style={{
              backgroundColor: isSuccess ? "#52c41a" : "#faad14", // 绿色成功，橙色警告
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {isSuccess ? "识别成功" : "未知包裹"}
          </div>
        );
      },
    },
    {
      title: "操作",
      valueType: "option",
      width: 100,
      render: (_, record) => [
        <a
          key="delete"
          onClick={() => {
            setTableData((prev) => prev.filter((item) => item.logisticsCode !== record.logisticsCode));
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <Card
      >
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
            <li>请使用扫码枪对准快递条码进行扫描</li>
            <li>扫码成功后快递信息将显示在下方列表</li>
            <li>请确保网络正常，避免扫码失败</li>
          </ul>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Input
            ref={inputRef}
            placeholder="请扫描或输入快递条码后回车"
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
          rowKey="barcodeImage"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          search={false}
          options={false}
          loading={isLoading}
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
            收货
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ParticularPaper;
