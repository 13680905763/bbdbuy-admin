import {
  batchSyncOrder,
  getPurchaseListByPage,
  purchaseInitiate,
  PurchaseManual,
  putPurchaseSync,
  updatePurchaseLogistics,
  getDiyOrderDetail,
} from "@/services/order";
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
  DatePicker,
  Form,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
} from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import EditModal, { EditModalRef } from "./editmodal";
import DiyDetailModal from "./DiyDetailModal";
const { RangePicker } = DatePicker;
export interface ProcureStatusItem {
  label: string; // 显示文字
  value: number; // 状态码
  color: string; // 标签颜色
}

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const editModalRef = useRef<EditModalRef>(null);

  const [dataSource, setDataSource] = useState<any>([]);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowsState, setSelectedRows] = useState<any>([]);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]); // ✅ 展开行控制
  // 弹窗状态
  const [modalType, setModalType] = useState<"edit" | "manual" | null>(null);
  const [currentRow, setCurrentRow] = useState<any>(null);

  const [form] = Form.useForm();

  // 用于接收 EditModal 的数据
  const [editModalData, setEditModalData] = useState<any[]>([]);
  const [editModalRemark, setEditModalRemark] = useState("");

  // DIY Modal State
  const [diyModalOpen, setDiyModalOpen] = useState(false);
  const [diyModalData, setDiyModalData] = useState<any>(null);
  const [diyModalLoading, setDiyModalLoading] = useState(false);

  const handleDiyDetail = async (orderId: string) => {
    setDiyModalOpen(true);
    setDiyModalLoading(true);
    try {
      const res: any = await getDiyOrderDetail(orderId);
      if (res.success) {
        setDiyModalData(res.data);
      } else {
        message.error(res.msg || "获取详情失败");
      }
    } catch (error) {
      message.error("获取详情失败");
    } finally {
      setDiyModalLoading(false);
    }
  };

  const fetchData = async (params?: any) => {
    const query = {
      current,
      size,
      // ...filters,目前 搜索跟分页自己带上
      ...params,
    };
    console.log("fetchData -> query", query);

    setLoading(true);
    try {
      const res: any = await getPurchaseListByPage(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
      setSelectedRows([]);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };
  const handleExpand = (record: any) => {
    setExpandedRowKeys((prev) =>
      prev.includes(record.id)
        ? prev.filter((k) => k !== record.id)
        : [...prev, record.id]
    );
  };

  const columns: ProColumns<any>[] = [
    // {
    //   title: "采购编号",
    //   dataIndex: "purchaseCode",
    //   hideInSearch: true,
    // },
    {
      title: "订单编号",
      dataIndex: "orderCode",
    },
    {
      title: "客户昵称",
      dataIndex: "customerName",
    },
    {
      title: "商品信息",
      dataIndex: "products",
      hideInSearch: true,
      render: (products: any = [], record) => {
        const preview = products?.slice(0, 3);
        const expanded = expandedRowKeys.includes(record.id);
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
      title: "平台",
      hideInSearch: true,

      dataIndex: "source",
    },
    {
      title: "平台采购单号",
      dataIndex: "sourceOrderId",
    },

    {
      title: "快递单号",
      dataIndex: "packages",
      width: 180,
      render: (_, record: any) => {
        const packages = record.packages;
        return packages?.map((item: any) => {
          return (
            <div>
              {item.logisticsCompany}-{item.logisticsCode}
            </div>
          );
        });
      },
    },
    {
      title: "采购状态",
      dataIndex: "statusCode",
      width: 80,
      render: (value: any) => renderStatusTag("purchase", value),
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择采购状态"
            allowClear
            options={getStatusOptions("purchase")}
          />
        );
      },
    },

    {
      title: "采购员",
      dataIndex: "dispatchUserName",
      hideInSearch: true,
    },
    {
      title: "限制/备注",
      dataIndex: "remark",
      hideInSearch: true,
      render: (text: any, record: any) => {
        console.log('record.purchaseLimited', record.purchaseLimited, record.purchaseLimited && record.purchaseLimited != 0);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

            {!!record.purchaseLimited && record.purchaseLimited != 0 && (
              <div>{renderStatusTag("purchaseLimited", record.purchaseLimited)}</div>
            )}
            <div>{text}</div>

          </div>
        );
      },
    },

    {
      title: "时间信息",
      dataIndex: "createTime",
      valueType: "dateTimeRange",
      formItemProps: {
        label: false, // ✅ 关键：隐藏 label
        // style: { width: "900px" },
      },
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
              <span style={{ color: "#999" }}>采购：</span>
              {record.purchaseTime || "-"}
            </div>
            <div>
              <span style={{ color: "#999" }}>付款：</span>
              {record.payTime || "-"}
            </div>
            <div>
              <span style={{ color: "#999" }}>发货：</span>
              {record.sendTime || "-"}
            </div>
          </div>
        );
      },
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => (
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <Form.Item
            name="purchaseTime"
            label="采购时间"
            style={{ marginBottom: 0 }}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
              placeholder={["开始时间", "结束时间"]}
            />
          </Form.Item>
          <Form.Item
            name="payTime"
            label="付款时间"
            style={{ marginBottom: 0 }}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
              placeholder={["开始时间", "结束时间"]}
            />
          </Form.Item>
          <Form.Item
            name="sendTime"
            label="发货时间"
            style={{ marginBottom: 0 }}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: "100%" }}
              placeholder={["开始时间", "结束时间"]}
            />
          </Form.Item>
        </div>
      ),
    },
    {
      title: "操作",
      valueType: "option",
      render: (_: any, record: any) => {
        return (
          <div
            style={{
              display: "flex",
              gap: 4,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {record?.purchaseLimited === 3 && (
              <Button
                size="small"
                onClick={() => handleDiyDetail(record.orderId)}
              >
                DIY详情
              </Button>
            )}
            {record?.manualFlag && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleOption(record, "manual")}
              >
                手动采购
              </Button>
            )}
            {record?.updateFlag && (
              <Button
                type="default"
                size="small"
                onClick={() => handleOption(record, "edit")}
              >
                修改
              </Button>
            )}
            {record?.syncFlag && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleSync(record)}
              >
                手动同步
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  /** 操作 */
  const handleOption = (record: any, type: "edit" | "manual") => {
    setCurrentRow(record);
    if (type === "edit") {
      // 初始化 EditModal 数据 (这里假设如果已有 packages，需要转换成 EditModal 需要的格式)
      // 目前简单起见，如果需要回显，可以转换 record.packages
      // 这里先置空，或根据需求回显
      if (record.packages && record.packages.length > 0) {
        const initialData = record.packages.map((item: any) => ({
          id: item.id,
          logisticsCompany: item.logisticsCompany,
          logisticsCode: item.logisticsCode,
          productList: item.items.map((prod: any) => ({
            id: prod.orderProductId,
            quantity: prod.quantity,
          })),
        }));
        console.log("initialData", initialData);

        setEditModalData(initialData);
        // 回显第一条记录的备注，或者合并所有备注，这里取第一条有备注的记录
        setEditModalRemark(record?.remark || "");
      } else {
        setEditModalData([]);
        setEditModalRemark("");
      }
    }
    setModalType(type);
    console.log("record", record);

    if (type === "manual") {
      form.setFieldsValue({
        sourceOrderId: record?.sourceOrderId || "",
        remark: record?.remark || "",
      });
    }
  };
  const handleSync = async (record: any) => {
    Modal.confirm({
      title: "手动同步",
      content:
        "该操作以平台数据更新本地数据，可能造成本地数据异常，请谨慎使用！",
      okButtonProps: {
        type: "primary",
        style: {
          backgroundColor: "#f0700c",
          borderColor: "#f0700c",
        },
      },
      onOk: async () => {
        const res = await putPurchaseSync(record.id);
        if (res.success) {
          message.success("同步成功");
          fetchData();
        }
      }, // ✅ 确认后继续
    });
  };
  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      setLoading(true);
      let res;
      const values: any = {};
      values.id = currentRow.id;

      // 合并 EditModal 的数据
      if (modalType === "edit") {
        // 调用 EditModal 内部的校验方法

        const valid = await editModalRef.current?.validate();
        if (!valid) return;

        values.packageList = editModalData.map((item) => ({
          logisticsCompany: item.logisticsCompany,
          logisticsCode: item.logisticsCode,
          productList: item.productList,
        }));
        values.remark = editModalRemark;
        res = await updatePurchaseLogistics(values);
        console.log("value", values);
        // console.log("editModalRemark", editModalRemark);
      } else {
        const formdata = await form.validateFields();
        values.sourceOrderId = formdata.sourceOrderId;
        values.remark = formdata.remark;
        res = await PurchaseManual(values);
        console.log("value", values);
      }

      if (res.success) {
        message.success("修改成功");
        fetchData();
        setModalType(null);
      } else {
        message.error(res.message || "操作失败");
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const doSubmit = async (ids: string[]) => {
    try {
      console.log("采购请求");

      const res: any = await purchaseInitiate({
        ids,
        remark: "",
      });

      if (res.data && res.success) {
        const errorEntries = Object.entries(res.data);

        const content = (
          <div style={{ maxWidth: 400 }}>
            <div
              style={{
                marginBottom: 8,
                fontWeight: 600,
                color: "#ff4d4f",
                fontSize: 14,
              }}
            >
              ({errorEntries.length} 个 操作失败)
            </div>
            <div
              style={{
                overflow: "auto",
                backgroundColor: "#fff2f0",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ffccc7",
              }}
            >
              {errorEntries.map(([orderId, errorMsg]: any, index) => (
                <div
                  key={orderId}
                  style={{
                    marginBottom: 6,
                    paddingBottom: 6,
                    borderBottom:
                      index < errorEntries.length - 1
                        ? "1px dashed #ffa39e"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      color: "#d4380d",
                      fontWeight: 500,
                      fontSize: 12,
                      marginBottom: 2,
                    }}
                  >
                    📦 订单号: {orderId}
                  </div>
                  <div style={{ fontSize: 13 }}>❌ {errorMsg}</div>
                </div>
              ))}
            </div>
          </div>
        );

        message.info({
          content,
          duration: 5,
          icon: <></>,
        });
      } else if (res.success) {
        message.success("采购发起成功！");
      }

      actionRef?.current?.reload();
    } catch (error: any) {
      console.error("采购发起失败", error);
      message.error(error?.message || "采购发起失败，请重试");
    }
  };

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    const [purchaseStartTime, purchaseEndTime] = values.purchaseTime || [];
    const [payStartTime, payEndTime] = values.payTime || [];
    const [sendStartTime, sendEndTime] = values.sendTime || [];
    const filterParams = {
      orderCode: values.orderCode,
      sourceOrderId: values.sourceOrderId,
      customerName: values.customerName,
      logisticsCode: values.packages,
      statusCode: values.statusCode,
      purchaseTimeFrom: purchaseStartTime
        ? moment(purchaseStartTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      purchaseTimeTo: purchaseEndTime
        ? moment(purchaseEndTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      payTimeFrom: payStartTime
        ? moment(payStartTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      payTimeTo: payEndTime
        ? moment(payEndTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      sendTimeFrom: sendStartTime
        ? moment(sendStartTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      sendTimeTo: sendEndTime
        ? moment(sendEndTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
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
    // 清空URL参数
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);

    fetchData({ current: 1 });
  };

  /** ✅ 初始化加载 */
  useEffect(() => {
    // 获取 URL 参数
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get("orderCode");
    const sourceOrderId = urlParams.get("sourceOrderId");

    if (orderCode) {
      // 如果有 orderCode，设置 filters 并搜索
      const initialFilters = { orderCode };
      setFilters(initialFilters);
      formRef.current?.setFieldsValue({ orderCode });
      fetchData({ current: 1, ...initialFilters });
    } else if (sourceOrderId) {
      // 如果有 sourceOrderId，设置 filters 并搜索
      const initialFilters = { sourceOrderId };
      setFilters(initialFilters);
      formRef.current?.setFieldsValue({ sourceOrderId });
      fetchData({ current: 1, ...initialFilters });
    } else {
      // 否则正常加载
      fetchData();
    }
  }, []);

  return (
    <PageContainer>
      <ProTable
        bordered
        size="small"
        formRef={formRef}
        actionRef={actionRef}
        rowKey="id"
        pagination={false} // ❗️我们自己控制分页
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => handleExpand(record),
          expandedRowRender: (record) => (
            <Table
              size="small"
              pagination={false}
              showHeader={false}
              dataSource={record.products}
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
                  dataIndex: "propAndValue",
                  render: (propAndValue) => (
                    <div
                      style={{
                        color: "#e60012",
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: "1.4",
                        maxWidth: 200,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {propAndValue?.propName_valueName || "-"}
                    </div>
                  ),
                },
                {
                  dataIndex: "purchaseQuantity",
                  render: (q) => <span style={{ color: "#4b5563" }}>×{q}</span>,
                },
                {
                  dataIndex: "price",
                  render: (p) => (
                    <span style={{ color: "#1f2937", fontWeight: 500 }}>
                      ¥{p}
                    </span>
                  ),
                },
                {
                  dataIndex: "remark",
                  render: (remark) => (
                    <span style={{ color: "#1f2937", fontWeight: 500 }}>
                      <span style={{ color: "#6b7280", fontWeight: 400 }}>
                        备注：
                      </span>
                      {remark || "-"}
                    </span>
                  ),
                },
              ]}
            />
          ),
          expandIcon: () => null, // ✅ 隐藏默认的展开图标
          expandIconColumnIndex: -1,
          expandRowByClick: false, // 由我们手动控制点击
          rowExpandable: (record) => record.products?.length > 0,
        }}
        search={{
          labelWidth: "auto",
          defaultCollapsed: false, // ❗ 默认展开
        }}
        options={{
          reload: false,
          fullScreen: true,
          density: false,
        }}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            onClick={async () => {
              if (!selectedRowsState.length) {
                message.error("请选择需要采购的商品！");
                return;
              }
              const canManualData = selectedRowsState.filter((item: any) => item.id && item.manualFlag);
              console.log('canManualData', canManualData);
              if (canManualData.length !== selectedRowsState.length) {
                message.error("请只勾选支持采购的商品！");
                return;
              }
              const hasRemarkData = selectedRowsState.filter(
                (item: any) => canManualData.map(
                  (item: any) => item?.id
                ).includes(item.id) && item.orderRemark
              );
              console.log('selectedRowsState', selectedRowsState);
              console.log('hasRemarkData', hasRemarkData);

              const ids = hasRemarkData.map(
                (item: any) => item?.id
              );
              if (hasRemarkData.length) {
                Modal.confirm({
                  title: "确认操作",
                  content: "所选采购单中存在商品备注，是否确认继续？",
                  okText: "确认继续",
                  cancelText: "返回检查",
                  okButtonProps: {
                    type: "primary",
                    style: {
                      backgroundColor: "#f0700c",
                      borderColor: "#f0700c",
                    },
                  },
                  onOk: () => doSubmit(ids), // ✅ 确认后继续
                });
                return;
              }

              // ✅ 没备注，直接执行
              console.log("采购");

              await doSubmit(canManualData.map((item: any) => item?.id));
            }}
          >
            批量采购
          </Button>,
          <Button
            onClick={async () => {
              console.log(selectedRowsState);

              if (!selectedRowsState.length) {
                message.error("请选择需要同步的商品！");
                return;
              }
              const canSyncData = selectedRowsState.filter((item: any) => item.id && item.syncFlag);
              console.log('canSyncData', canSyncData);

              if (canSyncData.length !== selectedRowsState.length) {
                message.error("请只勾选支持同步的商品！");
                return;
              }
              const ids = canSyncData.map(
                (item: any) => item?.id
              );

              Modal.confirm({
                title: "确认操作",
                content: "是否确认同步选中的采购单？",
                okButtonProps: {
                  type: "primary",
                  style: {
                    backgroundColor: "#f0700c",
                    borderColor: "#f0700c",
                  },
                },
                onOk: async () => {
                  const res: any = await batchSyncOrder({ idSet: ids });
                  if (!res.success) {
                    message.error(res?.msg || "同步失败");
                    return;
                  }
                  message.success(res?.msg || "同步成功");
                  actionRef.current?.reload();
                }, // ✅ 确认后继续
              });
            }}
          >
            批量同步
          </Button>,
        ]}
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
      <Modal
        title={modalType === "edit" ? "修改采购单" : "手动采购"}
        open={modalType !== null}
        onCancel={() => setModalType(null)}
        onOk={handleSave}
        confirmLoading={loading}
        width={modalType === "edit" ? 1200 : 500}
        centered
        maskClosable={false} // ✅ 允许点击遮罩层关闭
        destroyOnHidden // ✅ 确保每次打开都重置
      >
        {modalType === "edit" ? (
          <EditModal
            ref={editModalRef}
            products={currentRow?.products || []}
            value={editModalData}
            onChange={setEditModalData}
            remark={editModalRemark}
            onRemarkChange={setEditModalRemark}
          />
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="sourceOrderId"
              label="平台采购单号"
              rules={[{ required: true, message: "请输入平台采购单号" }]}
            >
              <Input placeholder="请输入平台采购单号" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea placeholder="请输入备注" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <DiyDetailModal
        open={diyModalOpen}
        onCancel={() => {
          setDiyModalOpen(false);
          setDiyModalData(null);
        }}
        data={diyModalData}
        loading={diyModalLoading}
      />
    </PageContainer>
  );
};

export default TableList;
