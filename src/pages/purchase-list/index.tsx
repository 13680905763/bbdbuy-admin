import { getPurchaseListByPage, purchaseInitiate } from "@/services/order";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, Pagination, Table, Tag, message } from "antd";
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

  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "采购订单号",
      dataIndex: "sourceOrderId",
    },
    {
      title: "快递单号",
      dataIndex: "packages",
      width: 180,
      render: (dom, record: any) => {
        const packages = record.packages;
        return packages?.map((item: any) => {
          return (
            <div>
              {item.logisticsCompany}-{item.logisticsCode}
            </div>
          );
        });
      },
    },
    {
      title: "采购编号",
      dataIndex: "purchaseCode",
    },
    {
      title: "订单编号",
      dataIndex: "orderCode",
    },

    {
      title: "采购状态",
      dataIndex: "status",
      width: 80,
      render: (dom, record: any) => {
        const status = record.status;
        let color = "black";
        if (status === "待采购") {
          color = "red";
        } else if (status === "已采购") {
          color = "green";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "支付状态",
      dataIndex: "payStatus",
      width: 80,
      render: (dom, record: any) => {
        const payStatus = record.payStatus;
        let color = "black";
        if (payStatus === "已付款") {
          color = "green";
        } else {
          color = "red";
        }
        return <Tag color={color}>{payStatus}</Tag>;
      },
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
                  render: (picUrl: string, record: any) => {
                    return <img src={record?.skuPicUrl} alt="" width={100} />;
                  },
                },
                {
                  title: "sku",
                  dataIndex: "sku",
                  key: "sku",
                  width: 150,
                  render: (sku, record: any) => {
                    return (
                      <div>
                        <p>{sku.propName_valueName}</p>
                        <p>
                          <a href={record?.productUrl} target="_blank">
                            原链接
                          </a>
                        </p>
                      </div>
                    );
                  },
                },
                {
                  title: "数量",
                  dataIndex: "quantity",
                  key: "quantity",
                  width: 50,
                },
                {
                  title: "价格",
                  dataIndex: "price",
                  key: "price",
                  width: 50,
                },
                {
                  title: "备注",
                  dataIndex: "remark",
                  key: "remark",
                  width: 100,
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
                selectedRowsState.map((item: any) => item.id)
              );
              const res = await purchaseInitiate({
                ids: selectedRowsState.map((item: any) => Number(item.id)),
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
