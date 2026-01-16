// src/pages/inventory/ScanIn/index.tsx
import { getGoodsType } from "@/services";
import { getInspectionScan, InspectionSubmit } from "@/services/order";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ProColumns } from "@ant-design/pro-table";
import { Button, Card, Image, Input, message, Select } from "antd";
import React, { useEffect, useRef, useState } from "react";
const inspectionStatusCode: any = [
  { value: 1032, label: "正常" },
  { value: 10331, label: "破损" },
  { value: 10332, label: "质量问题" },
  { value: 10333, label: "少发" },
  { value: 10334, label: "错发" },
  { value: 10335, label: "少买" },
  { value: 10336, label: "错买" },
  { value: 10337, label: "多发" },
  { value: 10338, label: "多买" },
];
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

    setIsLoading(true);
    try {
      const res: any = await getInspectionScan(scanValue);
      console.log(res.data);

      if (res.success) {
        setTableData(
          res?.data?.inspectionList.map((row: any) => ({
            ...row,
            categoryId: categoryOptions.find((opt: any) => opt.isDefault)
              ?.value,
            quantity: row?.product?.quantity,
            inspectionStatusCode: 1032,
            length: 42,
            width: 32,
          }))
        );
        // message.success("扫码成功！");
      } else {
        // message.error(res?.message || "扫码失败，请重试");
      }
    } catch (error: any) {
      console.error("扫码请求出错:", error);
      // message.error(error?.message || "请求异常，请稍后重试");
    } finally {
      setIsLoading(false);
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
    if (!tableData.length) {
      message.warning("暂无数据可提交");
      return;
    }

    setSubmitting(true); // 开始 loading
    try {
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
          categoryId: item.categoryId,
        };
      });

      // 校验
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
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
          if (!item[field]) {
            message.warning(`第 ${i + 1} 行的 ${reqObj[field]} 未填写`);
            setSubmitting(false);
            return;
          }
        }
        if (item.inspectionStatusCode !== 1032 && !item.abnormalCode) {
          message.warning(`第 ${i + 1} 行状态未填写`);
          setSubmitting(false);
          return;
        }
      }

      const res = await InspectionSubmit(data);
      if (res.success) {
        message.success("提交成功");
        setTableData([]);
        setScanValue("");
      }
    } finally {
      setSubmitting(false); // 无论成功失败都关闭 loading
    }
  };
  console.log('tableData', tableData);

  const columns: ProColumns<any>[] = [
    { title: "入库单号", dataIndex: "inboundId", width: 100 },
    {
      title: "商品详情",
      dataIndex: "product",
      width: 300,
      render: (product: any) => {
        return (
          <div style={{ display: "flex", gap: 12, padding: "8px 0" }}>
            {/* 左侧图片 */}
            <Image
              width={90}
              height={90}
              src={product?.skuPicUrl || product?.picUrl}
              alt={product?.productTitle || "商品图片"}
              preview={product?.picUrl}
              style={{ objectFit: "cover", borderRadius: 4 }}
              referrerPolicy="no-referrer"
            />
            {/* 右侧内容 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* 商品标题 */}
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: "#333",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {product.productTitle}
              </div>

              {/* 属性 */}
              {product.sku?.propName_valueName && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#999",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.sku.propName_valueName}
                </div>
              )}

              {/* 价格与数量 */}
              <div style={{ fontSize: 14, color: "#e60012", marginTop: 2 }}>
                ￥{product.price} × {product.quantity}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "条形码",
      dataIndex: "packageCode",
      render: (packageCode: any) => (
        <div style={{ textAlign: "center" }}>
          <img
            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
              packageCode
            )}`}
            alt="barcode"
            style={{ height: 70, width: 200 }}
          />
          <div style={{ fontSize: 18, fontWeight: 600 }}>{packageCode}</div>
        </div>
      ),
    },
    {
      title: "长（cm）",
      dataIndex: "length",
      width: 120,
      render: (_, __, index) => (
        <Input
          min={1}
          type="number"
          defaultValue={42}
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
      width: 120,

      render: (_, __, index) => (
        <Input
          min={1}
          type="number"
          defaultValue={32}
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
      width: 120,
      render: (_, __, index) => (
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
      width: 120,
      render: (_, __, index) => (
        <Input
          type="number"
          min={0.1}
          step={0.1}
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
      width: 120,
      render: (_, record: any, index) => (
        <Input
          defaultValue={record?.product?.quantity}
          type="number"
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
      title: "商品类型",
      dataIndex: "categoryId",
      width: 150,
      render: (text, record, index) => {
        return (
          <Select
            value={record.categoryId}
            style={{ width: 120 }}
            onChange={(newValue) => {
              setTableData((prev) => {
                const updated = [...prev];
                updated[index].categoryId = newValue;
                return updated;
              });
            }}
            options={categoryOptions}
          />
        );
      },
    },
    {
      title: "状态",
      dataIndex: "inspectionStatusCode",
      render: (text, record, index) => {
        return (
          <Select
            value={record.abnormalCode || record.inspectionStatusCode || 1032}
            style={{ width: 120 }}
            onChange={(v) => {
              console.log(v);
              if (v === 1032) {
                setTableData((prev) => {
                  const updated = [...prev];
                  updated[index].inspectionStatusCode = 1032;
                  updated[index].abnormalCode = "";
                  return updated;
                });
              } else {
                setTableData((prev) => {
                  const updated = [...prev];
                  updated[index].inspectionStatusCode = 1033;
                  updated[index].abnormalCode = v;
                  return updated;
                });
              }
            }}
            options={inspectionStatusCode}
          />
        );
      },
    },
  ];

  return (
    <PageContainer>
      <Card
        extra={
          <Button type="primary" onClick={handleBatchPrint}>
            打印条形码
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
            提交入库信息
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ParticularPaper;
