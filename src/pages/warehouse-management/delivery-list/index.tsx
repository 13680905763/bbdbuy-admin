import { getDeliveryListByPage } from "@/services/order";
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
      const res: any = await getDeliveryListByPage({ page, pageSize });
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
      title: "采购编号",
      dataIndex: "purchaseCode",
    },

    {
      title: "入库编号",
      dataIndex: "inboundCode",
    },
    {
      title: "快递公司",
      dataIndex: "logisticsCompany",
    },
    {
      title: "快递单号",
      dataIndex: "logisticsCode",
    },
    {
      title: "收货状态",
      dataIndex: "receiveStatus",
      render: (dom, record: any) => {
        const receiveStatus = record.receiveStatus;
        let color = "black";
        if (receiveStatus === "正常") {
          color = "green";
        } else {
          color = "red";
        }
        return <Tag color={color}>{receiveStatus}</Tag>;
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
