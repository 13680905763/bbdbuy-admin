import { getPurchaseListByPage, purchaseInitiate } from "@/services/order";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, Pagination, Table, message } from "antd";
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
  purchaseCode?: any;
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
  const [selectedRowsState, setSelectedRows] = useState<any>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getPurchaseListByPage({ page, pageSize });
      setDataSource(res.data.records);
      console.log(dataSource);

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
      title: "采购编号",
      dataIndex: "purchaseCode",
    },
    {
      title: "订单编号",
      dataIndex: "orderCode",
    },
    {
      title: "支付状态",
      dataIndex: "payStatus",
      width: 80,
    },
    {
      title: "采购状态",
      dataIndex: "status",
      width: 80,
    },

    {
      title: "采购员",
      dataIndex: "dispatchUserName",
    },

    {
      title: "商品信息",
      dataIndex: "products",
      render: (products: any) => {
        console.log("products", products);
        return (
          <div className="purchase-table">
            <Table
              bordered
              dataSource={products}
              columns={[
                {
                  title: "商品图片",
                  dataIndex: "picUrl",
                  key: "picUrl",
                  width: 100,
                  render: (picUrl: string, row) => {
                    return <img src={row?.skuPicUrl} alt="" width={100} />;
                  },
                },
                {
                  title: "sku",
                  dataIndex: "sku",
                  key: "sku",
                  width: 200,
                  render: (sku) => {
                    return sku.propName_valueName;
                  },
                },
                {
                  title: "数量",
                  dataIndex: "quantity",
                  key: "quantity",
                },
                {
                  title: "价格",
                  dataIndex: "price",
                  key: "price",
                },
              ]}
              pagination={false}
            />
          </div>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
    },
  ];

  return (
    <PageContainer>
      <ProTable
        headerTitle="采购列表"
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
            setSelectedRows(selectedRows);
          },
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={async () => {
              console.log(
                "点击了采购按钮",
                selectedRowsState.map((item) => item.id)
              );
              const res = await purchaseInitiate({
                ids: selectedRowsState.map((item) => Number(item.id)),
                remark: "",
              });
              actionRef?.current?.reload();
              console.log(res);
            }}
          >
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
