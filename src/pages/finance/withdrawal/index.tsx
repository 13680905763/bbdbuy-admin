import { auditWithdrawal, getWithdrawalList } from "@/services/finance";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import {
  ModalForm,
  PageContainer,
  ProFormRadio,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import type { ActionType, ProColumns, ProFormInstance } from "@ant-design/pro-components";
import { Button, Pagination, message, Select } from "antd";
import React, { useEffect, useRef, useState } from "react";

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const fetchData = async (params?: any) => {
    const query = {
      current,
      size,
      ...params,
    };
    setLoading(true);
    try {
      const res: any = await getWithdrawalList(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<any>[] = [
    // { title: "ID", dataIndex: "id", hideInSearch: true },
    { title: "客户名称", dataIndex: "name" },
    { title: "客户昵称", dataIndex: "nickName" },
   
    {
      title: "外币金额",
      dataIndex: "foreignCurrencyAmount",
      hideInSearch: true,
      render: (_, record) => `${record.foreignCurrencyAmount} ${record.foreignCurrencyCode}`,
    },
    {
      title: "汇率",
      dataIndex: "exchangeRate",
      hideInSearch: true,
    },
     {
      title: "提现金额 (CNY)",
      dataIndex: "amount",
      hideInSearch: true,
      valueType: "money",
    },
    {
      title: "手续费",
      dataIndex: "feeAmount",
      hideInSearch: true,
      valueType: "money",
    },
    {
      title: "支付金额",
      dataIndex: "payAmount",
      hideInSearch: true,
      valueType: "money",
    },
    {
      title: "状态",
      dataIndex: "statusCode",
      hideInSearch: false,
      render: (value: any) => renderStatusTag("withdrawal", value),
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择状态"
            allowClear
            options={getStatusOptions("withdrawal")}
          />
        );
      },
    },
    { title: "申请时间", dataIndex: "createTime", valueType: "dateTime", hideInSearch: true },
    {
      title: "操作",
      valueType: "option",
      render: (_, record) => {
        // 只有待审核状态才显示审核按钮 (假设状态码 101 为待付款/待审核，根据实际情况调整)
        // 根据用户提供的数据 statusCode: 101, status: "待付款"
        if (record.statusCode !== 101) return null;

        return (
          <ModalForm
            title="审核提现"
            trigger={
              <Button type="primary" size="small">
                审核
              </Button>
            }
            width={500}
            onFinish={async (values) => {
              try {
                await auditWithdrawal({
                  id: record.id,
                  ...values,
                });
                message.success("操作成功");
                fetchData({ current, size, ...filters });
                return true;
              } catch (error) {
                console.error(error);
                return false;
              }
            }}
          >
            <ProFormRadio.Group
              name="approved"
              label="审核结果"
              options={[
                { label: "同意", value: true },
                { label: "驳回", value: false },
              ]}
              rules={[{ required: true, message: "请选择审核结果" }]}
            />
            <ProFormText
              name="remark"
              label="备注"
              placeholder="记录付款平台及平台交易流水号"
              rules={[{ required: true, message: "请输入备注" }]}
            />
          </ModalForm>
        );
      },
    },
  ];

  const onSubmitSearch = (values: any) => {
    const filterParams = {
      ...values,
      status: values.statusCode, // 将 statusCode 映射为 status 字段
    };
    delete filterParams.statusCode; // 删除 statusCode 字段

    // Remove empty values
    Object.keys(filterParams).forEach((key) => {
      if (filterParams[key] === undefined || filterParams[key] === "") {
        delete filterParams[key];
      }
    });
    setFilters(filterParams);
    setCurrent(1);
    fetchData({ current: 1, ...filterParams });
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrent(page);
    setSize(pageSize || 10);
    fetchData({ current: page, size: pageSize, ...filters });
  };

  const handleReset = () => {
    setFilters({});
    setCurrent(1);
    formRef.current?.resetFields();
    fetchData({ current: 1 });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PageContainer>
      <ProTable
        bordered
        formRef={formRef}
        size="small"
        actionRef={actionRef}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        search={{
          labelWidth: "auto",
          defaultCollapsed: false,
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
