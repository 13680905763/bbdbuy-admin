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
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  // ✅ 状态管理
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});

  /** ✅ fetchData 不依赖外部状态，只依赖参数 */
  const fetchData = async (params?: any) => {
    const query = {
      current,
      size,
      ...params,
    };
    console.log("fetchData -> query", query);
    setLoading(true);
    try {
      const res: any = await getOutboundPickingListByPage(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  // ✅ rowSpanMap 计算
  const rowSpanMap = getRowSpanMap(dataSource, "outboundCode");

  // ✅ 表头配置
  const columns: ProColumns<any>[] = [
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
      hideInSearch: true,
    },
    {
      title: "拣货状态",
      dataIndex: "pickStatusCode",
      render: (value: any) => renderStatusTag("picking", value),
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择拣货状态"
            allowClear
            options={getStatusOptions("picking")}
          />
        );
      },
    },
    {
      title: "拣货时间",
      dataIndex: "updateTime",
      valueType: "dateTimeRange",

      hideInSearch: true,
      render: (_, record: any) => {
        const pickStatusCode = record.pickStatusCode;
        const updateTime = record.updateTime;
        if (pickStatusCode == 2021) return "--";
        return updateTime;
      },
    },
  ];
  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    // const [startTime, endTime] = values.createTime || [];
    const filterParams = {
      outboundCode: values.outboundCode,
      packageCode: values.packageCode,
      pickStatusCode: values.pickStatusCode,
      // createTimeFrom: startTime
      //   ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
      //   : undefined,
      // createTimeTo: endTime
      //   ? moment(endTime).format("YYYY-MM-DD HH:mm:ss")
      //   : undefined,
    };
    setFilters(filterParams);
    setCurrent(1);
    fetchData({ current: 1, ...filterParams });
  };
  /** ✅ 分页变化 */
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrent(page);
    setSize(pageSize || 10);
    fetchData({ current: page, size: pageSize, ...filters });
  };

  /** ✅ 重置搜索 */
  const handleReset = () => {
    setFilters({});
    setCurrent(1);
    formRef.current?.resetFields();
    fetchData({ current: 1 });
  };

  /** ✅ 初始化加载 */
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <PageContainer>
      <ProTable
        size="small"
        bordered
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        search={{
          labelWidth: "auto",
          defaultCollapsed: false, // ❗ 默认展开
        }}
        options={{
          reload: false,
          fullScreen: true,
          density: false,
        }}
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
