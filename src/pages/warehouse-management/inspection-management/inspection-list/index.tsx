import { getInspectionListByPage } from "@/services/order"; // 你自己的接口路径
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Pagination, message } from "antd";
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
      title: "商品图片",
      dataIndex: "product",
      width: 100,
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
              ￥{product.price} * {product.quantity}
            </div>
          </div>
        );
      },
    },

    {
      title: "验货状态",
      dataIndex: "inspectionStatus",
      width: 100,
    },
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
