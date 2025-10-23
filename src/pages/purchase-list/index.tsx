import {
  createPurchaseLogistics,
  getPurchaseListByPage,
  purchaseInitiate,
  putPurchaseLogistics,
} from "@/services/order";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { DownOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
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
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
export interface ProcureStatusItem {
  label: string; // 显示文字
  value: number; // 状态码
  color: string; // 标签颜色
}

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [dataSource, setDataSource] = useState<any>([]);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowsState, setSelectedRows] = useState<any>([]);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]); // ✅ 展开行控制
  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);

  const [form] = Form.useForm();
  /** ✅ fetchData 不依赖外部状态，只依赖参数 */
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
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };
  // ✅ 切换展开状态
  const handleExpand = (record: any) => {
    setExpandedRowKeys((prev) =>
      prev.includes(record.id)
        ? prev.filter((k) => k !== record.id)
        : [...prev, record.id]
    );
  };

  const columns: ProColumns<any>[] = [
    {
      title: "采购编号",
      dataIndex: "purchaseCode",
      hideInSearch: true,
    },
    {
      title: "订单编号",
      dataIndex: "orderCode",
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
      render: (_: any, record: any) => [
        <Button
          type="link"
          style={{ color: "#1890ff", padding: 0 }}
          onClick={() => handleEdit(record)}
        >
          修改
        </Button>,
      ],
    },
  ];

  /** 修改 */
  const handleEdit = (record: any) => {
    setCurrentRow(record);
    console.log("record", record);

    // 取出第一个 package
    const firstPackage = record?.packages?.[0];

    // 设置表单值
    form.setFieldsValue({
      logisticsCompany: firstPackage?.logisticsCompany || "",
      logisticsCode: firstPackage?.logisticsCode || "",
    });

    setEditModalVisible(true);
  };
  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      values.id = currentRow.id;
      console.log("value", values);

      setLoading(true);

      let res;
      if (currentRow?.packages?.[0]) {
        res = await putPurchaseLogistics(values);
      } else {
        res = await createPurchaseLogistics(values);
      }
      if (res.success) {
        message.success("修改成功");
        setEditModalVisible(false);
        fetchData();
      } else {
        message.error(res.message || "操作失败");
      }
    } catch (e) {
      message.error("操作失败");
    } finally {
      setLoading(false);
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
        size="small"
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
                  dataIndex: "quantity",
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
                      {remark}
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
            icon={<PlusOutlined />}
            onClick={async () => {
              console.log(
                "点击了采购按钮",
                selectedRowsState.map((item: any) => item.id)
              );
              const res = await purchaseInitiate({
                ids: selectedRowsState.map((item: any) => Number(item.id)),
                remark: "",
              });
              actionRef?.current?.reload();
              console.log(res);
            }}
          >
            采购
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
      {/* 新增/修改 弹窗 */}
      <Modal
        title={"修改"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        confirmLoading={loading}
        width={500}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="logisticsCompany"
            label="快递公司"
            rules={[{ required: true, message: "请输入快递公司" }]}
          >
            <Input placeholder="请输入快递公司" />
          </Form.Item>

          <Form.Item
            name="logisticsCode"
            label="快递单号"
            rules={[{ required: true, message: "请输入快递单号" }]}
          >
            <Input placeholder="请输入快递单号" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TableList;
