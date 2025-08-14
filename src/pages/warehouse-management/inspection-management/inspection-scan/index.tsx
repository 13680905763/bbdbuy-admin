// src/pages/inventory/ScanIn/index.tsx
import { getInspectionScan, InspectionSubmit } from "@/services/order";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ProColumns } from "@ant-design/pro-table";
import { Button, Card, Input, message, Select } from "antd";
import React, { useRef, useState } from "react";

const ParticularPaper: React.FC = () => {
  const [scanValue, setScanValue] = useState("");
  const [tableData, setTableData] = useState<any[]>([]);
  const inputRef = useRef(null);

  const handleScan = async () => {
    if (!scanValue.trim()) {
      message.warning("请输入条码");
      return;
    }
    const res = await getInspectionScan(scanValue);
    console.log(res.data);
    if (res.success) {
      setTableData(res?.data?.inspectionList);
    }
  };

  const handleBatchPrint = () => {
    if (tableData.length === 0) {
      message.warning("暂无条码可打印");
      return;
    }

    const htmlContent = tableData
      .map(
        (item) => `
      <div class="barcode-container">
        <img
          src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
            item.packageCode
          )}&scaleX=3&scaleY=2&paddingwidth=0&paddingheight=0"
          class="barcode-img"
        />
        <div class="barcode-text">${item.packageCode}</div>
      </div>
    `
      )
      .join("");

    const printWindow = window.open("", "", "width=600,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
    <html>
      <head>
        <title>打印条码</title>
        <style>
          @media print {
            @page {
              size: 80mm 30mm;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }

          .barcode-container {
            width: 72mm; /* 留出左右边距确保物理居中 */
            height: 30mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            page-break-after: always;
            margin-right: 8mm;
          }

          .barcode-img {
            width: 100%;
            height: 20mm;
            object-fit: contain;
          }

          .barcode-text {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
            margin-top: 2mm;
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

  const handleSubmit = async () => {
    const data: any = tableData.map((item) => {
      return {
        id: item.id,
        weight: item.weight,
        length: item.length,
        width: item.width,
        height: item.height,
        quantity: item.quantity,
        logisticsCode: item.logisticsCode,
        inspectionStatusCode: item.inspectionStatusCode,
        abnormalCode: item.abnormalCode || "",
      };
    });
    console.log("tableData", data);
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      // 校验字段是否缺失
      const requiredFields = [
        "weight",
        "length",
        "width",
        "height",
        "quantity",
        "inspectionStatusCode",
      ];
      const reqObj: any = {
        length: "长度",
        width: "宽度",
        height: "高度",
        weight: "重量",
        quantity: "数量",
        inspectionStatusCode: "检测状态",
      };
      for (const field of requiredFields) {
        if (
          item[field] === undefined ||
          item[field] === null ||
          item[field] === ""
        ) {
          message.warning(`第 ${i + 1} 行的 ${reqObj[field]} 未填写`);
          return;
        }
      }

      // inspectionStatusCode 为 ABNORMAL 时，abnormalCode 也必须填
      if (item.inspectionStatusCode !== "NORMAL" && item.abnormalCode === "") {
        message.warning(`第 ${i + 1} 状态异常`);
        return;
      }
    }

    const res = await InspectionSubmit(data);
    console.log("res", res);
    if (res.success) {
      message.success("提交成功");
      setTableData([]);
      setScanValue("");
    }
    // try {
    //   await request("/api/inventory/submit", {
    //     method: "POST",
    //     data: tableData,
    //   });
    //   message.success("提交成功！");
    // } catch (error) {
    //   message.error("提交失败，请重试！");
    // }
  };
  const columns: ProColumns<any>[] = [
    { title: "入库单号", dataIndex: "inboundId" },
    { title: "用户名", dataIndex: "customerName" },
    {
      title: "商品图片",
      dataIndex: "product",
      render: (product: any) => <img src={product?.picUrl} width={100} />,
    },
    {
      title: "商品名称",
      dataIndex: "product",
      width: 300,
      render: (product: any) => {
        return (
          <div>
            <div>{product.productTitle}</div>
            <div style={{ color: "red" }}>{product.sku.propName_valueName}</div>
            <div>
              {product.price} * {product.quantity}
            </div>
          </div>
        );
      },
    },
    { title: "商品数量", dataIndex: "quantity" },
    {
      title: "条形码",
      dataIndex: "packageCode",
      render: (packageCode: string) => (
        <div style={{ textAlign: "center" }}>
          <img
            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
              packageCode
            )}`}
            alt="barcode"
            style={{ height: 77, width: 268 }}
          />
          <div style={{ fontSize: 18, fontWeight: 600 }}>{packageCode}</div>
        </div>
      ),
    },
    { title: "快递单号", dataIndex: "logisticsCode" },
    {
      title: "长（cm）",
      dataIndex: "length",
      width: 80,

      render: (text, record, index) => (
        <Input
          min={1}
          type="number"
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].length = newValue;
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "宽（cm）",
      dataIndex: "width",
      width: 80,

      render: (text, record, index) => (
        <Input
          min={1}
          type="number"
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].width = newValue;
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "高（cm）",
      dataIndex: "height",
      width: 80,
      render: (text, record, index) => (
        <Input
          min={1}
          type="number"
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].height = newValue;
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "重量（g）",

      dataIndex: "weight",
      width: 80,
      render: (text, record, index) => (
        <Input
          type="number"
          min={1}
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].weight = newValue;
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "数量",
      dataIndex: "quantity",
      width: 80,

      render: (text, record, index) => (
        <Input
          type="number"
          value={text}
          min={1}
          onChange={(e) => {
            const newValue = e.target.value;
            setTableData((prev) => {
              const updated = [...prev];
              updated[index].quantity = newValue;
              return updated;
            });
          }}
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "inspectionStatusCode",
      render: (text, record, index) => {
        return (
          <Select
            style={{ width: 120 }}
            onChange={(v) => {
              console.log(v);

              if (v === "NORMAL") {
                setTableData((prev) => {
                  const updated = [...prev];
                  updated[index].inspectionStatusCode = v;
                  updated[index].abnormalCode = "";
                  return updated;
                });
              } else {
                setTableData((prev) => {
                  const updated = [...prev];
                  updated[index].inspectionStatusCode = "ABNORMAL";
                  updated[index].abnormalCode = v;
                  return updated;
                });
              }
            }}
            options={[
              { value: "NORMAL", label: "正常" },
              { value: "DAMAGED", label: "破损" },
              { value: "QUALITY ISSUES", label: "质量问题" },
              { value: "LESS SEND", label: "少发" },
              { value: "WRONG POST", label: "错发" },
              { value: "BUY LESS", label: "少买" },
              { value: "BUY WRONG", label: "错买" },
              { value: "SEND MORE", label: "多发" },
              { value: "BUY MORE", label: "多买" },
            ]}
          />
        );
      },
    },
  ];

  return (
    <PageContainer>
      <Card
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
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Button type="primary" onClick={handleSubmit} size="large">
            提交入库信息
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ParticularPaper;
