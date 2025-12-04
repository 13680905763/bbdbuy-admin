import {
  getOrderRefundGoodsList,
  getOrderRefundGoodsSign,
  putOrderRefundGoodsSend,
} from "@/services/refund";
import { renderStatusTag } from "@/utils/status-render";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import {
  EditableProTable,
  PageContainer,
  ProTable,
} from "@ant-design/pro-components";
import { Button, Image, Pagination, Tag, message } from "antd";
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
const LOGISTICS_COMPANIES = [
  "顺丰速运",
  "中通快递",
  "圆通速递",
  "申通快递",
  "韵达快递",
  "京东物流",
  "邮政快递包裹",
  "德邦快递",
  "极兔速递",
  "跨越速运",
  "天天快递",
  "百世快递",
  "宅急送",
  "EMS",
  "全峰快递",
  "优速快递",
  "快捷快递",
  "联邦快递（FedEx国内）",
  "中邮快递",
  "能达速递",
];
const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<Record<string, any>>({});
  // 弹窗状态
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]); // ✅ 展开行控制
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);

  const handleExpand = (record: any) => {
    setExpandedRowKeys((prev) =>
      prev.includes(record.orderId)
        ? prev.filter((k) => k !== record.orderId)
        : [...prev, record.orderId]
    );
  };
  console.log("expandedRowKeys", expandedRowKeys);

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
      const res: any = await getOrderRefundGoodsList(query);
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
      title: "来源",
      dataIndex: "source",
      hideInSearch: true,
    },

    {
      title: "商品信息",
      dataIndex: "items",
      hideInSearch: true,
      render: (products: any = [], record: any) => {
        const preview = products?.slice(0, 3);
        const expanded = expandedRowKeys.includes(record?.orderId);
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
            {products?.length > 3 && (
              <Tag color="blue">+{products.length - 3}</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "物流单号",
      dataIndex: "logistics",
      width: 240,
      render: (logisticsList, record) => {
        if (
          !logisticsList ||
          !Array.isArray(logisticsList) ||
          logisticsList.length === 0
        ) {
          return "-";
        }

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {logisticsList.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    justifyContent: "end",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 500,
                      color: "#111827",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.logisticsCompany && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: "2px",
                        }}
                      >
                        {item.logisticsCompany}
                      </div>
                    )}
                  </div>
                  {item.logisticsCode || item.trackingNumber || ""}

                  <div>{renderStatusTag("refundGoods", item.statusCode)}</div>
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "操作",
      dataIndex: "sendFlag",
      hideInSearch: true,
      render: (sendFlag, record) => {
        return (
          <div>
            {sendFlag ? (
              <Button
                key="edit"
                type="primary"
                size="small"
                onClick={() => handleExpand(record)}
              >
                去发货
              </Button>
            ) : (
              <></>
            )}
          </div>
        );
      },
    },
    // {
    //   title: "操作",
    //   dataIndex: "option",
    //   render: (logisticsList, record) => {
    //     return (
    //       <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    //         {record?.logisticsList.item.statusCode == 0 && (
    //           <Button
    //             key="edit"
    //             type="link"
    //             size="small"
    //             onClick={() => handleExpand(record)}
    //           >
    //             去发货
    //           </Button>
    //         )}
    //       </div>
    //     );
    //   },
    // },
  ];

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    // const [startTime, endTime] = values.createTime || [];
    const filterParams = Object.fromEntries(
      Object.entries({
        orderCode: values.orderCode,
        logisticsCode: values.logistics,
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
        rowKey="orderId"
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
          expandedRowRender: (record: any) => {
            return (
              <EditableProTable
                size="small"
                pagination={false}
                showHeader={false}
                value={record.items || []}
                rowKey="id"
                recordCreatorProps={false}
                editable={{
                  type: "single",
                  editableKeys: editableKeys,
                  onChange: setEditableKeys,
                  deleteText: 123,
                  onSave: async (rowKey, data, row) => {
                    console.log("📦 保存快递信息:", { rowKey, data, row });
                    try {
                      // 1. 准备保存数据
                      const query = {
                        id: row.id,
                        logisticsCompany: data.logisticsCompany?.trim(),
                        logisticsCode: data.logisticsCode?.trim(),
                      };
                      const res = await putOrderRefundGoodsSend([query]);
                      // 3. 处理响应
                      if (res.success) {
                        message.success("✅ 快递信息保存成功");

                        if (formRef?.current?.submit) {
                          formRef.current.submit();
                        } else {
                          fetchData();
                        }
                      }
                    } catch (error: any) {
                      console.error("💥 保存失败:", error);
                      message.error(
                        `❌ 保存失败: ${error.message || "网络错误"}`
                      );
                    } finally {
                      setEditableKeys([]);
                    }
                  },

                  actionRender: (row, config, defaultDom) => {
                    return [defaultDom.save, defaultDom.cancel];
                  },
                }}
                columns={[
                  {
                    title: "商品",
                    width: 300,
                    editable: false,
                    render: (_, item) => (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ marginRight: 12 }}>
                          <Image
                            src={item.skuPicUrl || item.picUrl}
                            width={50}
                            height={50}
                            style={{ borderRadius: 4 }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>
                            {item.productTitle}
                          </div>
                          <div style={{ color: "#666", fontSize: 12 }}>
                            {item.propAndValue?.propName_valueName ||
                              "默认规格"}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "数量",
                    dataIndex: "quantity",
                    width: 60,
                    editable: false,
                    align: "center",
                    render: (q) => <span>×{q}</span>,
                  },
                  {
                    title: "快递公司",
                    dataIndex: "logisticsCompany",
                    width: 180,
                    valueType: "select",
                    fieldProps: {
                      placeholder: "选择快递公司",
                      options: LOGISTICS_COMPANIES.map((company) => ({
                        label: company,
                        value: company,
                      })),
                      showSearch: true,
                      filterOption: (input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase()),
                    },
                    formItemProps: {
                      rules: [
                        {
                          required: true,
                          message: "请选择快递公司",
                        },
                      ],
                    },
                    render: (text) =>
                      text || <span style={{ color: "#ccc" }}>未填写</span>,
                  },
                  {
                    title: "快递单号",
                    dataIndex: "logisticsCode",
                    width: 200,
                    valueType: "text",
                    fieldProps: {
                      placeholder: "请输入快递单号",
                      maxLength: 50,
                    },
                    formItemProps: {
                      rules: [
                        { required: true, message: "请输入快递单号" },
                        { min: 8, message: "快递单号至少8位" },
                        {
                          pattern: /^[A-Za-z0-9]+$/,
                          message: "只能包含字母和数字",
                        },
                      ],
                    },
                    render: (text) =>
                      text || <span style={{ color: "#ccc" }}>未填写</span>,
                  },
                  {
                    title: "操作",
                    valueType: "option",
                    width: 100,
                    render: (text, item, _, action) => {
                      console.log("editableKeys", editableKeys);
                      console.log("item", item);

                      const isEditing = editableKeys.includes(item.id);

                      if (isEditing) {
                        return null; // 编辑时操作按钮在 actionRender 中
                      }

                      return (
                        <div style={{ display: "flex", gap: "5px" }}>
                          <Button
                            key="edit"
                            type="default"
                            size="small"
                            onClick={() => {
                              // 开始编辑这一行
                              action?.startEditable?.(item.id);
                            }}
                          >
                            {item.logisticsCompany ? "修改" : "发货"}
                          </Button>
                          <Button
                            key="submit"
                            size="small"
                            type="primary"
                            loading={confirmLoading}
                            disabled={item.statusCode === 2}
                            onClick={async () => {
                              const query = {
                                id: item.id,
                                orderRefundId: item.orderRefundId,
                              };
                              try {
                                setConfirmLoading(true);
                                const query = {
                                  id: item.id,
                                  orderRefundId: item.orderRefundId,
                                };
                                const res = await getOrderRefundGoodsSign([
                                  query,
                                ]);
                                if (res.success) {
                                  message.success("签收成功");
                                  if (formRef.current?.submit) {
                                    formRef.current.submit();
                                  } else {
                                    fetchData();
                                  }
                                }
                              } catch (error: any) {
                                // 处理网络或未知错误
                                console.error("签收失败:", error);
                                message.error(
                                  `签收失败: ${error.message || "网络错误"}`
                                );
                              } finally {
                                // 7. 确保无论成功失败都关闭加载状态
                                setConfirmLoading(false);
                              }
                            }}
                          >
                            签收
                          </Button>
                        </div>
                      );
                    },
                  },
                ]}
              />
            );
          },
          expandIcon: () => null,
          expandIconColumnIndex: -1,
          expandRowByClick: false,
          rowExpandable: (record: any) => record.items?.length > 0,
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
