import { getOrderRefundList, updateRefund } from "@/services/refund";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  message,
} from "antd";
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
  const [loading, setLoading] = useState(false);

  // 分页相关
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<Record<string, any>>({});
  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [statusCode, setStatusCode] = useState<number>(2); // 默认固定值
  // 新增 state
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]); // ✅ 展开行控制
  // ✅ 切换展开状态
  const handleExpand = (record: any) => {
    setCurrentRow(record);
    setExpandedRowKeys((prev) =>
      prev.includes(record.id)
        ? prev.filter((k) => k !== record.id)
        : [record.id]
    );
  };
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
      title: "订单号",
      dataIndex: "orderCode",
    },
    {
      title: "用户名",
      dataIndex: "customerName",
      hideInSearch: true,
    },
    {
      title: "来源",
      dataIndex: "source",
      hideInSearch: true,
    },

    {
      title: "商品信息",
      dataIndex: "items",
      hideInSearch: true,
      render: (products: any = [], record: any) => {
        const preview = products?.slice(0, 9);
        const expanded = expandedRowKeys.includes(record?.id);
        return (
          <div
            onClick={() => handleExpand(record)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            {/* 自定义展开图标 */}
            {expanded ? (
              <DownOutlined style={{ color: "#f0700c" }} />
            ) : (
              <RightOutlined style={{ color: "#999" }} />
            )}

            {/* 缩略图预览 */}
            {preview.map((p: any) => (
              <Image
                key={p.id}
                src={p.skuPicUrl || p.picUrl}
                width={40}
                height={40}
                preview={false}
                referrerPolicy="no-referrer"
              />
            ))}

            {/* 若超过3张则显示数量标签 */}
            {products?.length > 9 && (
              <Tag color="blue">+{products.length - 9}</Tag>
            )}
          </div>
        );
      },
    },



    {
      title: "状态",
      dataIndex: "handleStatus",
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

    {
      title: "操作",
      dataIndex: "canHandle",
      hideInSearch: true,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 8 }}>
          {record.canHandle && (
            <Button
              type="primary"
              onClick={() => handleExpand(record)}
              size="small"
            >
              审核
            </Button>
          )}
        </div>
      ),
    },
  ];
  const handleEdit = async (record: any, statusCode: number) => {
    console.log("record", record);

    await form.setFieldsValue({
      ...record,
      refundProductAmount:
        currentRow?.refundRemainAmount > record.price * record.quantity
          ? record.price * record.quantity
          : currentRow?.refundRemainAmount,
      deductServiceFee: 0,
      deductPostFee: 0,
      refundServiceFee: 0,
      refundPostFee: record?.canRefundPostFee ? currentRow?.postFee : 0,
    });
    setCurrentItem(record);
    setStatusCode(statusCode); // 默认固定值
    setEditModalVisible(true);
  };
  const handleSave = async () => {
    try {
      setConfirmLoading(true); // 🔹点击确定时显示 loading

      const values = await form.validateFields();
      console.log("values", values);

      // 删除 handleRemark 字段
      const { handleRemark, applyRemark, price, ...payload } = values;

      console.log("values after:", payload);
      payload.remark = handleRemark;
      payload.statusCode = statusCode;
      const res = await updateRefund(payload);

      if (res.success) {
        message.success("修改成功");
        setEditModalVisible(false);
        fetchData();
      } else {
        message.error(res.msg || "修改失败");
      }
    } catch (e) {
      console.error(e);
      message.error("修改失败");
    } finally {
      setCurrentItem(null);
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
        statusCode: values.handleStatus,
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
      <ProTable
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
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => handleExpand(record),
          expandedRowRender: (record: any) => (
            <Table
              size="small"
              pagination={false}
              showHeader={false}
              dataSource={record?.items}
              rowKey="id"
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 8,
                border: "none",
              }}
              columns={[
                {
                  dataIndex: "skuPicUrl",
                  render: (url, records: any) => (
                    <Image
                      src={url || records?.picUrl}
                      width={50}
                      referrerPolicy="no-referrer"
                    />
                  ),
                },
                {
                  dataIndex: "productUrl",
                  render: (productUrl) => (
                    <a href={productUrl} target="_blank">
                      商品原链接
                    </a>
                  ),
                },
                {
                  dataIndex: "productTitle",
                  width: 200,
                },
                {
                  dataIndex: "propAndValue",
                  width: 200,

                  render: (propAndValue) => (
                    <div
                      style={{
                        color: "#e60012",
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: "1.4",
                        maxWidth: 200,
                      }}
                    >
                      {propAndValue?.propName_valueName || "-"}
                    </div>
                  ),
                },
                {
                  dataIndex: "quantity",
                  render: (q) => <span style={{ color: "#4b5563" }}>×{q}</span>,
                },
                {
                  dataIndex: "price",
                  width: 100,

                  render: (p) => (
                    <span style={{ color: "#1f2937", fontWeight: 500 }}>
                      ¥{p}
                    </span>
                  ),
                },
                {
                  dataIndex: "statusCode",
                  width: 200,
                  render: (value: any, record) => {
                    return (
                      <>
                        {renderStatusTag("refund", value)}
                        {value == 4 && `¥${record?.refundAmount}`}
                      </>
                    );
                  },
                },
                {
                  title: "申请时间",
                  dataIndex: "createTime",
                },

                {
                  dataIndex: "options",
                  render: (_: any, record: any) => (
                    <div style={{ display: "flex", gap: 8 }}>
                      {record.canProcessing && (
                        <Button
                          type="link"
                          onClick={() => handleEdit(record, 2)}
                          style={{ padding: 0 }}
                        >
                          处理中
                        </Button>
                      )}
                      {record.canRefund && (
                        <Button
                          type="link"
                          onClick={() => handleEdit(record, 4)}
                          style={{ padding: 0 }}
                        >
                          退款
                        </Button>
                      )}
                      {record.canRejected && (
                        <Button
                          type="link"
                          onClick={() => handleEdit(record, 5)}
                          style={{ padding: 0 }}
                        >
                          驳回
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          ),
          expandIcon: () => null, // ✅ 隐藏默认的展开图标
          expandIconColumnIndex: -1,
          expandRowByClick: false, // 由我们手动控制点击
          rowExpandable: (record) => record.items?.length > 0,
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
      {/* 退款审核 */}
      <Modal
        title="退款审核"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentItem(null);
          form.setFieldsValue({});
        }}
        confirmLoading={confirmLoading} // 🔹确认按钮 loading
        onOk={handleSave}
        width={500} // 🔹稍微加宽
      >
        <Form
          form={form}
          layout="vertical"
          style={{
            maxHeight: "70vh",
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
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
          <Form.Item name="price" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="来源" name="source" hidden>
            <Input />
          </Form.Item>
          {/* 只读展示字段 */}
          <Form.Item label="客户名" name="customerName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="退款理由" name="applyRemark">
            <Input.TextArea disabled />
          </Form.Item>

          {/* 备注：在“处理中”和“已驳回”状态下必填 */}
          {statusCode == 4 && (
            <>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 8,
                    color: "#374151",
                  }}
                >
                  <span>订单总金额</span>
                  <span style={{ fontWeight: 500 }}>
                    ¥{currentRow?.totalFee}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 8,
                    color: "#374151",
                  }}
                >
                  <span>服务费</span>
                  <span style={{ fontWeight: 500 }}>
                    ¥{currentRow?.serviceFee}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 8,
                    color: "#374151",
                  }}
                >
                  <span>运费</span>
                  <span style={{ fontWeight: 500 }}>
                    ¥{currentRow?.postFee}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 8,
                    color: "#6b7280",
                  }}
                >
                  <span>已退商品金额</span>
                  <span>¥{currentRow?.refundProductAmount}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 8,
                    color: "#6b7280",
                  }}
                >
                  <span>已退运费</span>
                  <span>¥{currentRow?.refundPostFee}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 12,
                    color: "#6b7280",
                  }}
                >
                  <span>已退服务费</span>
                  <span>¥{currentRow?.refundServiceFee}</span>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    剩余可退金额
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#ef4444",
                    }}
                  >
                    ¥{currentRow?.refundRemainAmount}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Form.Item label="扣服务费(元)" name="deductServiceFee">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="扣运费(元)" name="deductPostFee">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Form.Item label="退服务费(元)" name="refundServiceFee">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="退运费(元)" name="refundPostFee" >
                  <InputNumber style={{ width: "100%" }} disabled={!currentItem?.canRefundPostFee} />
                </Form.Item>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Form.Item
                  label="退款数量"
                  name="quantity"
                  rules={[{ required: true, message: "请选择退款数量" }]}
                >
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="商品单价" name="price">
                  <InputNumber style={{ width: "100%" }} disabled />
                </Form.Item>
                <Form.Item
                  label="退商品金额(元)"
                  name="refundProductAmount"
                  rules={[{ required: true, message: "请选择退款金额(元)" }]}
                >
                  <InputNumber
                    max={currentRow?.refundRemainAmount}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
            </>
          )}

          <Form.Item
            label="备注"
            name="handleRemark"
            rules={[
              {
                required: statusCode == 5 ? true : false,
                message: "请输入备注",
              },
            ]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TableList;
