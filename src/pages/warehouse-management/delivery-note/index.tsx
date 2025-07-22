// src/pages/inventory/ScanIn/index.tsx
import ProTable, { ProColumns } from "@ant-design/pro-table";
import { Button, Card, Input, message } from "antd";
import React, { useRef, useState } from "react";

const DeliveryNote: React.FC = () => {
  const [scanValue, setScanValue] = useState("");
  const [tableData, setTableData] = useState<any[]>([
    {
      key: "1",
      barcode: "6901234567890",
      name: "亚马逊跨境真皮卡包",
      sku: "SKU001",
      quantity: 1,
      warehouse: "深圳仓",
      receivedAt: "2025-07-15 14:32:10",
      barcodeImage: "6901234567890A",
    },
    {
      key: "2",
      barcode: "6901234567891",
      name: "美式复古零钱包",
      sku: "SKU002",
      quantity: 2,
      warehouse: "深圳仓",
      receivedAt: "2025-07-15 14:33:21",
      barcodeImage: "6901234567890B",
    },
    {
      key: "3",
      barcode: "6901234567892",
      name: "真皮手拿包",
      sku: "SKU003",
      quantity: 1,
      warehouse: "广州仓",
      receivedAt: "2025-07-15 14:34:45",
      barcodeImage: "6901234567890C",
    },
  ]);
  const inputRef = useRef(null);

  const handleScan = () => {
    if (!scanValue.trim()) {
      message.warning("请输入条码");
      return;
    }

    const fakeResult = {
      id: Date.now(),
      barcode: scanValue,
      name: "复古真皮卡包",
      sku: "SKU-FAKE",
      quantity: 1,
      warehouse: "A区仓库",
      receivedAt: new Date().toLocaleString(),
      barcodeImage: `${scanValue}-A`,
    };

    setTableData((prev) => [fakeResult, ...prev]);
    setScanValue("");
  };

  const handleBatchPrint = () => {
    if (tableData.length === 0) {
      message.warning("暂无条码可打印");
      return;
    }

    const htmlContent = tableData
      .map(
        (item) => `
      <div style="text-align:center; margin: 40px 0; page-break-after: always;">
        <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
          item.barcodeImage
        )}" style="height: 77px;width: 268px;" />
        <div style=" font-size: 18px;fontWeight: 600;">${
          item.barcodeImage
        }</div>
      </div>`
      )
      .join("");

    const printWindow = window.open("", "", "width=600,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
    <html>
      <head>
        <title>打印条码</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
          }
          div {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

  const columns: ProColumns<any>[] = [
    { title: "商品条码", dataIndex: "barcode", width: 160 },
    { title: "商品名称", dataIndex: "name" },
    { title: "数量", dataIndex: "quantity", valueType: "digit" },
    {
      title: "条形码",
      dataIndex: "barcodeImage",
      render: (barcode: string) => (
        <div style={{ textAlign: "center" }}>
          <img
            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
              barcode
            )}`}
            alt="barcode"
            style={{ height: 77, width: 268 }}
          />
          <div style={{ fontSize: 18, fontWeight: 600 }}>{barcode}</div>
        </div>
      ),
    },
    { title: "存放位置", dataIndex: "warehouse" },
    { title: "扫码时间", dataIndex: "receivedAt" },
  ];

  return (
    <Card
      title="扫码入库"
      bordered={false}
      extra={
        <Button type="primary" onClick={handleBatchPrint}>
          批量打印条形码
        </Button>
      }
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
          <li>请使用扫码枪对准商品条码进行扫描</li>
          <li>扫码成功后商品将显示在下方列表</li>
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
        rowKey="barcodeImage"
        columns={columns}
        dataSource={tableData}
        pagination={false}
        search={false}
        options={false}
        bordered
      />
    </Card>
  );
};

export default DeliveryNote;
