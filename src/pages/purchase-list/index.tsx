import { getPurchaseListByPage } from "@/services/order";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, Pagination, message } from "antd";
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

const flattenOrders = (orders: any[]): OrderProductRow[] => {
  const result: OrderProductRow[] = [];

  orders.forEach((order) => {
    const products = order.products || [];
    products.forEach((product: any, index: number) => {
      result.push({
        id: product.id,
        orderCode: order.orderCode,
        customerName: order.customerName,
        callNo: product.shopName,
        totalFee: order.totalFee,
        postFee: order.postFee,
        discountFee: order.discountFee,
        customerPayStatusCode: order.customerPayStatusCode,
        createTime: order.createTime,
        remark: product.remark,
        ...product,
        orderRowSpan: index === 0 ? products.length : 0,
      });
    });
  });

  return result;
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
      const res: any = await getPurchaseListByPage({ page, pageSize });
      setDataSource(flattenOrders(res.data.records));
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
      render: (text, row) => ({
        children: text,
        props: { rowSpan: row.orderRowSpan },
      }),
    },
    {
      title: "用户名",
      dataIndex: "customerName",
      render: (text, row) => ({
        children: text,
        props: { rowSpan: row.orderRowSpan },
      }),
    },
    {
      title: "商家",
      dataIndex: "callNo",
      render: (text, row) => ({
        children: text,
        props: { rowSpan: row.orderRowSpan },
      }),
    },
    {
      title: "订单总金额",
      dataIndex: "totalFee",
      render: (text, row) => ({
        children: text,
        props: { rowSpan: row.orderRowSpan },
      }),
    },
    {
      title: "商品金额",
      dataIndex: "price",
    },
    { title: "运费", dataIndex: "postFee" },
    { title: "服务费", dataIndex: "discountFee" },
    {
      title: "商品信息",
      dataIndex: "productTitle",
      render: (_, row) => {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              maxWidth: 200,
            }}
          >
            {/* 商品图片 */}
            <img
              src={row.picUrl}
              alt="商品图片"
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 4,
                flexShrink: 0,
              }}
            />

            {/* 文字信息区域 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.productTitle}
              >
                {row.productTitle}
              </div>

              {/* SKU 信息 */}
              {row?.sku?.propName_valueName && (
                <div style={{ fontSize: 12, color: "#888" }}>
                  {row.sku.propName_valueName}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "customerPayStatusCode",
      valueEnum: {
        201: { text: "待付款", status: "Default" },
        203: { text: "已付款", status: "Success" },
      },
    },
    { title: "下单时间", dataIndex: "createTime" },
    { title: "备注", dataIndex: "remark" },
  ];

  return (
    <PageContainer>
      <ProTable<OrderProductRow>
        headerTitle="订单列表"
        bordered
        actionRef={actionRef}
        rowKey="id"
        // search={false}
        pagination={false} // ❗️我们自己控制分页
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            // setSelectedRows(selectedRows);
          },
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />}>
            采购
          </Button>,
        ]}
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
