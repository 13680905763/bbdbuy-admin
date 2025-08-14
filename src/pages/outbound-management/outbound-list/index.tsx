import { getOutboundListByPage } from "@/services";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, Pagination, Table, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { printPickingList } from "./pre";

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
  const [selectedRows, setSelectedRows] = useState<OrderProductRow[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getOutboundListByPage({ page, pageSize });
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
      title: "出库单号",
      dataIndex: "outboundCode",
    },
    {
      title: "用户名",
      dataIndex: "customerName",
    },
    {
      title: "运费",
      dataIndex: "totalFee",
    },
    {
      title: "包裹信息",
      dataIndex: "packageItemList",
      render: (packageItemList: any) => {
        console.log("packageItemList", packageItemList);
        return (
          <div className="purchase-table">
            <Table
              bordered
              rowKey="id"
              dataSource={packageItemList}
              columns={[
                {
                  title: "包裹编号",
                  dataIndex: "packageCode",
                  key: "packageCode",
                },

                {
                  title: "数量",
                  dataIndex: "logisticsCode",
                  key: "logisticsCode",
                  render: (picUrl, row: any) => {
                    return <p>{row?.orderProduct?.quantity}</p>;
                  },
                },
              ]}
              pagination={false}
            />
          </div>
        );
      },
    },
    {
      title: "附加服务",
      dataIndex: "serviceList",
      key: "serviceList",
      render: (serviceList: any) => {
        console.log("serviceList", serviceList);
        return (
          <div className="purchase-table">
            <Table
              bordered
              rowKey="serviceId"
              dataSource={serviceList}
              columns={[
                {
                  title: "服务名",
                  dataIndex: "serviceName",
                  key: "serviceName",
                },
                {
                  title: "备注",
                  dataIndex: "remark",
                  key: "remark",
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
      dataIndex: "status",
      key: "status",
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
              if (selectedRows.length < 1) {
                message.info("请先勾选打印数据");
                return;
              }
              console.log("点击了打印拣货单按钮666", selectedRows);
              const printData = selectedRows.map((item: any) => {
                return {
                  outboundCode: item?.outboundCode,
                  userName: item?.customerName,
                  methodName: item?.shipping?.methodName,
                  remark: item?.remark,
                  serviceName: item?.serviceList.map((services: any) => {
                    return services?.serviceName;
                  }),
                  items: item.packageItemList.map((pag: any) => {
                    return {
                      packageCode: pag?.packageCode,
                      locationCode: pag?.location?.locationCode,
                      quantity: pag?.quantity,
                    };
                  }),
                };
              });
              console.log("printData", printData);
              printData.forEach((i) => {
                printPickingList(i);
              });
            }}
          >
            打印拣货单
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
