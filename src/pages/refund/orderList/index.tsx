import { getOrderRefundList, updateRefund } from "@/services/refund";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, Form, Input, Modal, Pagination, Select, message } from "antd";
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
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<Record<string, any>>({});
  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();
  const [statusCode, setStatusCode] = useState<number>(2); // 默认固定值
  // 新增 state
  const [confirmLoading, setConfirmLoading] = useState(false);

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
      const res: any = await getOrderRefundList(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "退款单号",
      dataIndex: "refundCode",
    },
    {
      title: "订单号",
      dataIndex: "orderCode",
    },
    {
      title: "商品",
      dataIndex: "productTitle",
      hideInSearch: true,
    },
    {
      title: "商品图片",
      dataIndex: "picUrl",
      key: "picUrl",
      hideInSearch: true,

      width: 100,
      render: (picUrl: any, row: any) => {
        return <img src={row?.skuPicUrl || row?.picUrl} alt="" width={100} />;
      },
    },
    {
      title: "价格",
      dataIndex: "price",
      hideInSearch: true,
    },
    {
      title: "sku",
      dataIndex: "propAndValue",
      key: "propAndValue",
      hideInSearch: true,

      width: 200,
      render: (propAndValue: any) => {
        return propAndValue?.propName_valueName;
      },
    },

    {
      title: "数量",
      dataIndex: "quantity",
      hideInSearch: true,
    },
    {
      title: "退款金额",
      dataIndex: "refundAmount",
      hideInSearch: true,
    },

    {
      title: "状态",
      dataIndex: "statusCode",
      render: (value: any) => renderStatusTag("refund", value),
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择采购状态"
            allowClear
            options={getStatusOptions("refund")}
          />
        );
      },
    },
    { title: "申请时间", dataIndex: "createTime", hideInSearch: true },
    {
      title: "审核时间",
      dataIndex: "updateTime",
      hideInSearch: true,

      render: (_, record: any) => {
        const statusCode = record.statusCode;
        const updateTime = record.updateTime;
        if (statusCode === 1) return "--";
        return updateTime;
      },
    },
    {
      title: "操作",
      valueType: "option",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            style={{ padding: 0 }}
          >
            审核
          </Button>
        </div>
      ),
    },
  ];
  const handleEdit = (record: any) => {
    console.log("record", record);

    setCurrentRow(record);
    form.setFieldsValue({ ...record });
    setStatusCode(record.statusCode); // 默认固定值
    setEditModalVisible(true);
  };
  const handleSave = async () => {
    try {
      setConfirmLoading(true); // 🔹点击确定时显示 loading

      const values = await form.validateFields();
      console.log("values", values);

      const res = await updateRefund(values);
      console.log("res", res);

      if (res.success) {
        message.success("修改成功");
        setEditModalVisible(false);
        fetchData();
      } else {
        message.error(res.message || "修改失败");
      }
    } catch (e) {
      console.error(e);
      message.error("修改失败");
    } finally {
      setConfirmLoading(false); // 🔹无论成功失败都关闭 loading
    }
  };

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    // const [startTime, endTime] = values.createTime || [];
    const filterParams = Object.fromEntries(
      Object.entries({
        refundCode: values.refundCode,
        orderCode: values.orderCode,
        statusCode: values.statusCode,
        // putawayStatusCode: values.putawayStatusCode,
        // createTimeFrom: startTime
        //   ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
        //   : undefined,
        // createTimeTo: endTime
        //   ? moment(endTime).format("YYYY-MM-DD HH:mm:ss")
        //   : undefined,
      }).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    );
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
      <ProTable<OrderProductRow>
        bordered
        actionRef={actionRef}
        formRef={formRef}
        size="small"
        rowKey="id"
        pagination={false} // ❗️我们自己控制分页
        dataSource={dataSource}
        loading={loading}
        columns={columns}
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
        // rowSelection={{
        //   onChange: (_, selectedRows) => {
        //     // setSelectedRows(selectedRows);
        //   },
        // }}
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
      {/* 退款审核 */}
      <Modal
        title="退款审核"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={confirmLoading} // 🔹确认按钮 loading
        onOk={handleSave}
        width={500} // 🔹稍微加宽
      >
        <Form form={form} layout="vertical">
          {/* 隐藏字段 */}
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="refundCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="orderId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="orderCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="customerId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="来源" name="source" hidden>
            <Input />
          </Form.Item>
          {/* 只读展示字段 */}
          <Form.Item label="客户名" name="customerName">
            <Input disabled />
          </Form.Item>
          {/* 状态选择 */}
          <Form.Item
            label="状态"
            name="statusCode"
            rules={[{ required: true, message: "请选择状态" }]}
          >
            <Select
              options={[
                { label: "待审核", value: 1 }, //不显示数量和金额，只显示状态选择
                { label: "处理中", value: 2 },
                { label: "已退款", value: 3 }, //数量、金额必填
                { label: "已驳回", value: 4 },
              ]}
              onChange={(value) => {
                setStatusCode(value);
              }}
            />
          </Form.Item>
          {/* 备注：在“处理中”和“已驳回”状态下必填 */}
          {statusCode === 3 && (
            <>
              <Form.Item label="退款数量" name="quantity">
                <Input />
              </Form.Item>
              <Form.Item label="退款金额(元)" name="refundAmount">
                <Input />
              </Form.Item>
            </>
          )}
          {statusCode !== 1 && (
            <Form.Item
              label="备注"
              name="remark"
              rules={[{ message: "请输入备注" }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TableList;
