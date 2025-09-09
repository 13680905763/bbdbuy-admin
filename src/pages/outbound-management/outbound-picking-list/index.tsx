"use client";

import { getOutboundPickingListByPage } from "@/services";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Pagination, Tag, message } from "antd";
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

// ✅ rowSpan 工具封装
function getRowSpanMap<T>(data: T[], key: keyof T) {
  const map: number[] = Array(data.length).fill(0);
  let i = 0;
  while (i < data.length) {
    let j = i + 1;
    while (j < data.length && data[i][key] === data[j][key]) {
      j++;
    }
    map[i] = j - i;
    i = j;
  }
  return map;
}

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
      const res: any = await getOutboundPickingListByPage({
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

  // ✅ rowSpanMap 计算
  const rowSpanMap = getRowSpanMap(dataSource, "outboundCode");

  // ✅ 表头配置
  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "拣库单号",
      dataIndex: "outboundCode",
      render: (text, row, index) => {
        const rowSpan = rowSpanMap[index];
        return {
          children: text,
          props: { rowSpan },
        };
      },
    },
    {
      title: "包裹编号",
      dataIndex: "packageCode",
    },
    {
      title: "货架位置",
      dataIndex: "locationCode",
    },
    {
      title: "拣货状态",
      dataIndex: "pickStatus",
      render: (dom, record: any) => {
        const pickStatus = record.pickStatus;
        let color = "black";
        if (pickStatus === "已拣货") {
          color = "green";
        } else {
          color = "red";
        }
        return <Tag color={color}>{pickStatus}</Tag>;
      },
    },
    {
      title: "下单时间",
      dataIndex: "createTime",
    },
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
      <div style={{ padding: 16, textAlign: "right" }}>
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
