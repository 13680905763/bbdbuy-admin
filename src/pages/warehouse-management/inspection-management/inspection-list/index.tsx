import { getInspectionListByPage } from "@/services/order"; // 你自己的接口路径
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Pagination, Tag, message } from "antd";
import React, { useEffect, useRef, useState } from "react";

type OrderProductRow = {
  id: string;
  orderCode: string;
  customerName: string;
  callNo: string;
  totalFee: number;
  postFee: number;
  discountFee: number;
  customerPayStatusCode: number;
  createTime: string;
  remark?: string;
  orderRowSpan?: number;
  productTitle: string;
  sku: any;
  picUrl: any;
};

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getInspectionListByPage({ page, pageSize });
      setDataSource(res.data.records);
      setTotal(res.data.total);
    } catch (e) {
      message.error("加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);
  console.log("dataSource", dataSource);

  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "订单号",
      dataIndex: "orderCode",
      width: 200,
    },
    {
      title: "用户名",
      dataIndex: "customerName",
      width: 100,
    },
    {
      title: "快递单号",
      dataIndex: "logisticsCode",
      width: 200,
    },

    {
      title: "商品详情",
      dataIndex: "orderProduct",
      width: 300,
      render: (orderProduct: any) => {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 0",
            }}
          >
            {/* 左侧图片 */}
            <div
              style={{
                flexShrink: 0,
                width: 100,
                height: 100,
                borderRadius: 8,
                overflow: "hidden",
                background: "#f7f7f7",
              }}
            >
              <img
                src={orderProduct?.picUrl}
                alt="商品图片"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* 右侧文字内容 */}
            <div style={{ flex: 1, lineHeight: 1.6 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  marginBottom: 4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2, // 限制显示两行
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {orderProduct.productTitle}
              </div>

              <div style={{ color: "red", marginBottom: 4 }}>
                {orderProduct.propAndValue.propName_valueName}
              </div>
              <div style={{ color: "#555" }}>
                ￥{orderProduct.price} × {orderProduct.quantity}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "商品类型",
      dataIndex: "packageItem.categoryName",
      width: 300,
      render: (_: any, record: any) => {
        return <div>{record?.packageItem?.categoryName}</div>;
      },
    },
    {
      title: "商品类型",
      dataIndex: "packageItem.id",
      width: 150,
      render: (_: any, record: any) => {
        return (
          <div style={{ fontSize: 13, color: "#555", lineHeight: "20px" }}>
            <div>
              尺寸：{record?.packageItem?.length} x {record?.packageItem?.width}{" "}
              x {record?.packageItem?.height} cm
            </div>
            <div>重量：{record?.packageItem?.weight} g</div>
            <div>数量：{record?.packageItem?.quantity}</div>
          </div>
        );
      },
    },
    {
      title: "验货状态",
      dataIndex: "inspectionStatus",

      render: (_, record: any) => {
        const { inspectionStatus, abnormalMsg } = record;
        let color: string = "default";

        if (inspectionStatus === "验货正常") {
          color = "green";
        } else if (inspectionStatus === "验货异常") {
          color = "red";
        }

        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div>
              <Tag color={color}>{inspectionStatus || "未验货"}</Tag>
              {inspectionStatus === "验货异常" && abnormalMsg && (
                <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
                  异常原因：{abnormalMsg}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "验货人",
      dataIndex: "packageItem.userName",
      width: 100,
      render: (_: any, record: any) => {
        return <div>{record?.packageItem?.userName}</div>;
      },
    },

    {
      title: "验货时间",
      dataIndex: "packageItem.updateTime",
      width: 200,
      render: (_: any, record: any) => {
        return <div>{record?.packageItem?.updateTime}</div>;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<OrderProductRow>
        bordered
        actionRef={actionRef}
        rowKey="id"
        // search={false}
        pagination={false} // ❗️我们自己控制分页
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        // rowSelection={{
        //   onChange: (_, selectedRows) => {
        //     // setSelectedRows(selectedRows);
        //   },
        // }}
      />
      <div style={{ padding: 16, textAlign: "right" }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger={true}
          onChange={(newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize); // 更新页大小
            // 发起请求，例如 fetchData(newPage, newSize)
          }}
        />
      </div>
    </PageContainer>
  );
};

export default TableList;
