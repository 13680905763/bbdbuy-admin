"use client";

import { getConsumeList } from "@/services";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { message, Pagination } from "antd";
import React, { useEffect, useRef, useState } from "react";

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  // ✅ 状态管理
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

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
      const res: any = await getConsumeList(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 表头配置
  const columns: ProColumns<any>[] = [

    {
      title: "客户昵称",
      dataIndex: "nickName",
    },
    {
      title: "业务类型",
      dataIndex: "bizType",
      hideInSearch: true,
    },
    {
      title: "币种金额",
      dataIndex: "orderCurrencyAmount",
      hideInSearch: true,
    },
    {
      title: "币种",
      dataIndex: "orderCurrency",
      hideInSearch: true,
    },
    {
      title: "汇率",
      dataIndex: "orderCurrencyExchangeRate",
      hideInSearch: true,
    },
    {
      title: "订单金额",
      dataIndex: "orderAmount",
      hideInSearch: true,
    },
    {
      title: "手续费",
      dataIndex: "payHandlingFee",
      hideInSearch: true,
    },
    {
      title: "固定费用",
      dataIndex: "payFixedCost",
      hideInSearch: true,
    },
    {
      title: "支付金额",
      dataIndex: "payAmount",
      hideInSearch: true,
    },
    {
      title: "支付方式",
      dataIndex: "paymentMethod",
      valueType: "select",
      valueEnum: {
        "ONLY PAY": { text: "ONLY PAY" },
        "PAYPAL": { text: "PAYPAL" },
        "BALANCE": { text: "钱包" },
      },
    },
    {
      title: "支付名称",
      dataIndex: "payName",
      hideInSearch: true,
    },
    {
      title: "平台支付单号",
      dataIndex: "paymentReferenceId",
      hideInSearch: true,
    },
    {
      title: "业务单号",
      dataIndex: "bizReference",
      hideInSearch: true,
    },

    {
      title: "时间信息",
      dataIndex: "createTime",
      valueType: "dateTimeRange",
      hideInSearch: true,

      render: (_, record: any) => {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
              lineHeight: 1.4,
              color: "#555",
            }}
          >
            <div>
              <span style={{ color: "#999" }}>交易：</span>
              {record.createTime || "-"}
            </div>
            <div>
              <span style={{ color: "#999" }}>到账：</span>
              {record.updateTime || "-"}
            </div>

          </div>
        );
      },
    },

  ];

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    const filterParams = {
      nickName: values.nickName,
      paymentMethod: values.paymentMethod,
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
        bordered
        rowKey="id"
        columns={columns}
        size="small"
        formRef={formRef}
        dataSource={dataSource}
        loading={loading}
        actionRef={actionRef}
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
