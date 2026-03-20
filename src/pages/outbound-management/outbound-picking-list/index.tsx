"use client";

import { getOutboundPickingListByPage } from "@/services";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Pagination, Select, message } from "antd";
import React, { useEffect, useRef, useState } from "react";

// ✅ rowSpan 工具，只对当前页数据生效
function getRowSpanMap<T>(data: T[], key: keyof T) {
  const map: number[] = Array(data.length).fill(1); // 默认每行 rowSpan=1
  let i = 0;
  while (i < data.length) {
    let count = 1;
    let j = i + 1;
    while (j < data.length && data[i][key] === data[j][key]) {
      count++;
      j++;
    }
    map[i] = count;
    for (let k = i + 1; k < j; k++) {
      map[k] = 0; // 非首行 rowSpan = 0，不显示单元格
    }
    i = j;
  }
  return map;
}

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const fetchData = async (params?: any) => {
    setLoading(true);
    try {
      const res: any = await getOutboundPickingListByPage({
        current,
        size,
        ...params,
      });
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [current, size, filters]);

  const rowSpanMap = getRowSpanMap(dataSource, "outboundCode");

  const columns: ProColumns<any>[] = [
    {
      title: "拣库单号",
      dataIndex: "outboundCode",
      render: (text, row, index) => ({
        children: text,
        props: { rowSpan: rowSpanMap[index] },
      }),
    },
    { title: "包裹编号", dataIndex: "packageCode" },
    { title: "货架位置", dataIndex: "locationCode", search: false },
    {
      title: "拣货状态",
      dataIndex: "pickStatusCode",
      render: (value: any) => renderStatusTag("picking", value),
      formItemRender: () => (
        <Select
          placeholder="请选择拣货状态"
          allowClear
          options={getStatusOptions("picking")}
        />
      ),
    },
    {
      title: "拣货时间",
      dataIndex: "updateTime",
      valueType: "dateTimeRange",
      search: false,
      render: (_, record: any) =>
        record.pickStatusCode == 2021 ? "--" : record.updateTime,
    },
  ];

  const onSubmitSearch = (values: any) => {
    setFilters({
      outboundCode: values.outboundCode,
      packageCode: values.packageCode,
      pickStatusCode: values.pickStatusCode,
    });
    setCurrent(1);
  };

  const handleReset = () => {
    setFilters({});
    setCurrent(1);
    formRef.current?.resetFields();
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrent(page);
    setSize(pageSize || 10);
  };

  return (
    <PageContainer>
      <ProTable
        size="small"
        bordered
        actionRef={actionRef}
        formRef={formRef}
        rowKey={(record) => record.item.id}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        search={{ labelWidth: "auto", defaultCollapsed: false }}
      />
      <div style={{ padding: 16, textAlign: "right" }}>
        <Pagination
          current={current}
          pageSize={size}
          total={total}
          showSizeChanger
          onChange={handlePageChange}
        />
      </div>
    </PageContainer>
  );
};

export default TableList;
