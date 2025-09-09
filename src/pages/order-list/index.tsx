import { getOrderListByPage } from "@/services/order"; // 你自己的接口路径
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Pagination, Table, Tag, message } from "antd";
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
      const res: any = await getOrderListByPage({ page, pageSize });
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
    },
    {
      title: "用户名",
      dataIndex: "customerName",
    },

    {
      title: "商品金额",
      dataIndex: "productFee",
    },
    {
      title: "订单总金额",
      dataIndex: "totalFee",
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
      title: "状态",
      dataIndex: "customerPayStatus",
      render: (dom, record: any) => {
        const customerPayStatus = record.customerPayStatus;
        let color = "black";
        if (customerPayStatus === "已付款") {
          color = "green";
        } else {
          color = "red";
        }
        return <Tag color={color}>{customerPayStatus}</Tag>;
      },
    },
    { title: "下单时间", dataIndex: "createTime" },
    { title: "备注", dataIndex: "remark" },
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
