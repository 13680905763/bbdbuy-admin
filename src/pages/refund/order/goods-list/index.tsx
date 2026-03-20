import {
  getOrderRefundGoodsList,
  getOrderRefundGoodsSign,
  putOrderRefundGoodsSend,
  putOrderRefundGoodsUpdate,
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
import { Button, Image, Modal, Pagination, Tag, message } from "antd";
import { log } from "console";
import React, { useEffect, useRef, useState } from "react";
import TaobaoRefundModal from "./TaobaoRefundModal";
import A1688RefundModal from "./A1688RefundModal";
import WeidianRefundModal from "./WeidianRefundModal";

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
const LOGISTICS_COMPANIES = [{ label: "中通快递", value: "ZTO" }];
const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]); // ✅ 展开行控制
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);

  // 弹窗状态
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [tableData, setTableData] = useState([]);
  const [modalType, setModalType] = useState<"applyFlag" | "returnFlag" | null>(
    null
  );
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [apply1688ModalOpen, setApply1688ModalOpen] = useState(false);
  const [applyWeidianModalOpen, setApplyWeidianModalOpen] = useState(false);
  // const [reasonOptions, setReasonOptions] = useState<any[]>([]);

  const handleExpand = (record: any) => {
    setExpandedRowKeys((prev) =>
      prev.includes(record.orderId)
        ? prev.filter((k) => k !== record.orderId)
        : [...prev, record.orderId]
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
      search: false,
    },

    {
      title: "商品信息",
      dataIndex: "returnGoodsList",
      search: false,
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
      title: "物流单号/状态",
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
      dataIndex: "action",
      search: false,
      render: (_, record: any) => {
        return (
          <div style={{ display: "flex", gap: "2px" }}>
            {record?.applyFlag && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleEdit(record, "applyFlag")}
              >
                申请
              </Button>
            )}
            {record?.returnFlag && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleEdit(record, "returnFlag")}
              >
                发货
              </Button>
            )}
            {record?.updateFlag && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleExpand(record)}
              >
                修改
              </Button>
            )}
            {record?.signFlag && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleExpand(record)}
              >
                签收
              </Button>
            )}
          </div>
        );
      },
    },
  ];
  const modalColumns: any = {
    applyFlag: [
      {
        title: "商品",
        width: 150,
        editable: false,
        render: (_: any, item: any) => (
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
              <div style={{ color: "#666", fontSize: 12 }}>
                {item.propAndValue?.propName_valueName || "默认规格"}
              </div>
            </div>
          </div>
        ),
      },

      {
        title: "退款类型",
        width: 110,
        dataIndex: "refundType",
        valueType: "select",
        initialValue: 2,
        fieldProps: (form: any, { entity }: any) => ({
          placeholder: "选择退款类型",
          options: [
            { label: "仅退款", value: 1 },
            { label: "退货退款", value: 2 },
          ],
          onChange: () => {
            // 清空当前行 goodsStatus
            if (entity?.id) {
              form.setFieldValue([entity.id, "goodsStatus"], undefined);
            }
          },
          style: { maxWidth: 110, minWidth: 110 }, // 限制输入框宽度
          dropdownMatchSelectWidth: false, // 下拉框不要跟随宽度
        }),
        formItemProps: {
          rules: [{ required: true, message: "请选择退款类型" }],
        },
      },

      {
        title: "货物状态",
        width: 110,
        dataIndex: "goodsStatus",
        valueType: "select",
        initialValue: 1,
        fieldProps: (form: any, { entity }: any) => {
          const currentRow = form?.getFieldValue(entity.id) || {};
          const refundType = currentRow.refundType;

          // 默认选项
          let options = [
            { label: "未收到货", value: 0 },
            { label: "已收到货", value: 1 },
          ];

          // 🔥 退货退款（2） => 只能选已收到货
          if (refundType === 2) {
            options = [{ label: "已收到货", value: 1 }];
          }

          return {
            placeholder: "选择货物状态",
            options,
            style: { maxWidth: 110, minWidth: 110 }, // 限制输入框宽度
            dropdownMatchSelectWidth: false, // 下拉框不要跟随宽度
          };
        },

        formItemProps: {
          rules: [{ required: true, message: "请选择货物状态" }],
        },
      },
      {
        title: "数量",
        dataIndex: "quantity",
        width: 50,
        align: "center",
        valueType: "digit",
        // ⭐ 用函数来接收当前行 record
        fieldProps: (form: any, { entity }: any) => {
          return {
            min: 1,
            max: entity?.quantity, // 🔥 动态使用当前行数量作为最大值
            precision: 0,
          };
        },
        formItemProps: {
          rules: [
            { required: true, message: "数量不能为空" },
            { type: "number", min: 1, message: "数量至少为 1" },
          ],
        },
      },
      {
        title: "申请费用",
        dataIndex: "refundFee",
        width: 50,
        align: "center",
        valueType: "digit",
        fieldProps: (form: any, { entity }: any) => {
          return {
            min: 1,
            // max: entity?.quantity, // 🔥 动态使用当前行数量作为最大值
            precision: 0,
          };
        },
        formItemProps: {
          rules: [
            { required: true, message: "费用不能为空" },
            { type: "number", min: 1, message: "费用至少为 1" },
          ],
        },
      },
      {
        title: "退款运费",
        dataIndex: "refundShippingFee",
        width: 50,
        align: "center",
        valueType: "digit",
        // ⭐ 用函数来接收当前行 record
        fieldProps: (form: any, { entity }: any) => {
          return {
            min: 1,
            // max: entity?.quantity, // 🔥 动态使用当前行数量作为最大值
            precision: 0,
          };
        },
      },

      {
        title: "退款原因",
        width: 130,
        dataIndex: "reasonId",
        valueType: "select",

        fieldProps: (form: any, { entity }: any) => {
          const currentRow = form?.getFieldValue(entity.id) || {};
          const goodsStatus = currentRow.goodsStatus;
          // 默认选项

          return {
            placeholder: "选择退款原因",
            // options: reasonOptions,
            style: { maxWidth: 130, minWidth: 130 }, // 限制输入框宽度
            dropdownMatchSelectWidth: false, // 下拉框不要跟随宽度
          };
        },

        formItemProps: {
          rules: [{ required: true, message: "请选择退款原因" }],
        },
      },
      {
        title: "退款备注",
        dataIndex: "refundDesc",
        valueType: "textarea",
        ellipsis: true,
        width: 240,
        fieldProps: {
          placeholder: "请输入退款备注（可选）",
          autoSize: { minRows: 2, maxRows: 4 },
          maxLength: 200,
          showCount: true,
        },
        formItemProps: {
          rules: [
            {
              required: false,
            },
          ],
        },
        render: (text: any) =>
          text ? (
            <span>{text}</span>
          ) : (
            <span style={{ color: "#ccc" }}>无备注</span>
          ),
      },
    ],
    returnFlag: [
      {
        title: "商品",
        width: 150,
        editable: false,
        render: (_: any, item: any) => (
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
              <div style={{ color: "#666", fontSize: 12 }}>
                {item.propAndValue?.propName_valueName || "默认规格"}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "快递公司",
        dataIndex: "logisticsCompany",
        width: 200,
        valueType: "select",
        fieldProps: {
          placeholder: "选择快递公司",
          options: LOGISTICS_COMPANIES.map((item) => ({
            label: item?.label,
            value: item?.value,
          })),
        },
        formItemProps: {
          rules: [
            {
              required: true,
              message: "请选择快递公司",
            },
          ],
        },
        render: (text: any) =>
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
        render: (text: any) =>
          text || <span style={{ color: "#ccc" }}>未填写</span>,
      },
    ],
  };
  /** 修改 */
  const handleEdit = (record: any, modalType: any) => {
    setCurrentRow(record);
    // console.log("record", record);
    if (modalType === "applyFlag") {
      if (record?.source === "TAOBAO") {
        handleExpand(record);
      } else if (record?.source === "1688") {
        setApply1688ModalOpen(true);
      } else if (record?.source === "WEIDIAN") {
        handleExpand(record);
      } else {
        // setApplyModalOpen(true);
      }
    } else {
      setModalType(modalType);
    }
  };



  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      console.log("tableData", tableData);
      console.log("modalType", modalType);
      let values: any = [];
      setLoading(true);
      if (modalType == "returnFlag") {
        values = tableData.map((item: any) => ({
          id: item.id,
          logisticsCompany: item.logisticsCompany?.trim(),
          logisticsCode: item.logisticsCode?.trim(),
        }));
        const res: any = await putOrderRefundGoodsSend(values);
        log("提交发货 values", values);
        if (res.success) {
          message.success("修改成功");
          fetchData();
          setModalType(null);
        }
      }
      // const res = await updatePurchaseLogistics(values);
      // // let res;
      // // if (currentRow?.packages?.[0]) {
      // //   res = await putPurchaseLogistics(values);
      // // } else {
      // //   res = await createPurchaseLogistics(values);
      // // }
    } catch (e) {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };
  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    const filterParams = Object.fromEntries(
      Object.entries({
        orderCode: values.orderCode,
        logisticsCode: values.logistics,
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
                value={record.returnGoodsList || []}
                rowKey="id"
                recordCreatorProps={false}
                editable={{
                  type: "single",
                  editableKeys: editableKeys,
                  onChange: setEditableKeys,
                  deleteText: 123,
                  onSave: async (rowKey, data, row) => {
                    try {
                      // 1. 准备保存数据
                      const query = {
                        id: row.id,
                        logisticsCompany: data.logisticsCompany?.trim(),
                        logisticsCode: data.logisticsCode?.trim(),
                      };
                      const res = await putOrderRefundGoodsUpdate(query);
                      // 3. 处理响应
                      if (res.success) {
                        message.success("快递信息保存成功");
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
                    render: (q, record) => (
                      <span> ￥{record.price}×{q}</span>
                    ),
                  },
                  {
                    title: "快递公司",
                    dataIndex: "logisticsCompany",
                    width: 180,
                    valueType: "select",
                    fieldProps: {
                      placeholder: "选择快递公司",
                      options: LOGISTICS_COMPANIES.map((item) => ({
                        label: item?.label,
                        value: item?.value,
                      })),
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
                      // if (item?.statusCode == 0 || item?.statusCode == 1) {
                      //   return null;
                      // }
                      const isEditing = editableKeys.includes(item.id);

                      if (isEditing) {
                        return null; // 编辑时操作按钮在 actionRender 中
                      }

                      return (
                        <div style={{ display: "flex", gap: "5px" }}>
                          {item?.applyFlag && (
                            <Button
                              key="apply"
                              type="primary"
                              size="small"
                              onClick={() => {
                                // 申请
                                if (record?.source === "WEIDIAN") {
                                  setApplyWeidianModalOpen(true);
                                } else {
                                  setApplyModalOpen(true);
                                }
                                setCurrentRow(item);
                              }}
                            >
                              申请
                            </Button>
                          )}
                          {item?.updateFlag && (
                            <Button
                              key="edit"
                              type="primary"
                              size="small"
                              onClick={() => {
                                // 开始编辑这一行
                                action?.startEditable?.(item.id);
                              }}
                            >
                              修改
                            </Button>
                          )}
                          {item?.refundFlag && (
                            <Button
                              key="edit"
                              type="primary"
                              size="small"
                              onClick={() => {
                                // 开始编辑这一行
                                action?.startEditable?.(item.id);
                              }}
                            >
                              发货
                            </Button>
                          )}
                          {item?.signFlag && (
                            <Button
                              key="submit"
                              size="small"
                              type="primary"
                              loading={confirmLoading}
                              disabled={item.statusCode === 4}
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
                          )}
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
          rowExpandable: (record: any) => record.returnGoodsList?.length > 0,
        }}
      />
      <Modal
        title="发货"
        open={!!modalType}
        onCancel={() => setModalType(null)}
        onOk={handleSave}
        confirmLoading={loading}
        width={1200}
        centered
      >
        <EditableProTable
          size="small"
          pagination={false}
          value={currentRow?.returnGoodsList?.filter((item: any) => item?.statusCode == 1) || []}
          rowKey="id"
          recordCreatorProps={false}
          editable={{
            type: "single",
            editableKeys: currentRow?.returnGoodsList?.map((i: any) => i.id) || [],
            onChange: setEditableKeys,
            onValuesChange: (record, recordList: any) => {
              setTableData(recordList); // ⭐ 必须同步，否则 handleSave 拿不到最新值
            },
            actionRender: (row, config, defaultDom) => {
              return [defaultDom.save, defaultDom.cancel];
            },
          }}
          columns={modalColumns.returnFlag}
        />
      </Modal>

      <TaobaoRefundModal
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        onOk={() => fetchData()}
        data={currentRow}
      />

      <A1688RefundModal
        open={apply1688ModalOpen}
        onCancel={() => setApply1688ModalOpen(false)}
        data={currentRow}
      />

      <WeidianRefundModal
        open={applyWeidianModalOpen}
        onCancel={() => setApplyWeidianModalOpen(false)}
        onOk={() => fetchData()}
        data={currentRow}
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
