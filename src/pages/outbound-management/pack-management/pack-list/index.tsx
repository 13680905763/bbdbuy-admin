"use client";

import { getOutboundPackListByPage } from "@/services";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Pagination, message } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";

// ✅ 定义数据类型
type OrderProductRow = {
  id: string;
  outboundCode: string;
  packageCode: string;
  locationCode: string;
  pickStatus: string;
  createTime: string;
};

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  // ✅ 状态管理
  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<OrderProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ✅ 请求数据封装
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await getOutboundPackListByPage({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setDataSource(res.data.records || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data.total || 0,
      }));
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ 表头配置
  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "拣库单号",
      dataIndex: "outboundCode",
    },
    {
      title: "包裹信息",
      dataIndex: "itemAndLocations",
      render: (itemAndLocations: any) => {
        console.log("itemAndLocations", itemAndLocations);
        return itemAndLocations.map((item) => {
          return (
            item.location.packageCode + "--" + item.location.locationStatus
          );
        });
      },
    },
    {
      title: "附加服务",
      dataIndex: "locationCode",
    },
    {
      title: "打包状态",
      dataIndex: "packingStatus",
    },
    // {
    //   title: "下单时间",
    //   dataIndex: "createTime",
    // },
  ];

  return (
    <PageContainer>
      <ProTable<OrderProductRow>
        bordered
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        actionRef={actionRef}
        pagination={false}
        // rowSelection={{
        //   selectedRowKeys: selectedRows.map((row) => row.id),
        //   onChange: (_, rows) => setSelectedRows(rows),
        // }}
        search={false}
      />
      <div className="p-4 text-right">
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          showSizeChanger
          onChange={(current, pageSize) =>
            setPagination({ ...pagination, current, pageSize })
          }
        />
      </div>
    </PageContainer>
  );
};

export default TableList;
