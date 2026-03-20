import { closeOrder, getOrderListByPage } from "@/services/order"; // 你的接口路径
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  AutoComplete,
  Button,
  DatePicker,
  Image,
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

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [dataSource, setDataSource] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]); // ✅ 展开行控制
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});

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
      const res: any = await getOrderListByPage(query);
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
  /** 操作 */
  const handleClose = (record: any) => {
    let reasonCode = ""; // 默认原因

    Modal.confirm({
      title: "关闭订单",
      content: (
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8 }}>确认关闭订单吗？</div>
          <Select
            style={{ width: "100%" }}
            placeholder="请选择关闭原因"
            defaultValue={reasonCode}
            onChange={(value) => {
              reasonCode = value;
            }}
            options={[
              { value: "INSUFFICIENT_STOCK", label: "库存不足" },
              { value: "EXPIRED_GOODS", label: "失效商品" },
              { value: "SCAM", label: "骗货" },
              { value: "BLACKLIST", label: "黑名单" },
              { value: "FALSE_SHIPMENT", label: "虚假发货" },
              { value: "OTHER", label: "其他" },
            ]}
          />

        </div>
      ),
      cancelButtonProps: {
        style: { borderColor: "#f0700c", color: "#f0700c" },
      },
      okButtonProps: {
        style: { backgroundColor: "#f0700c" },
      },
      onOk: async () => {
        const res = await closeOrder(record.id, reasonCode);
        if (res.success) {
          message.success("关闭成功");
          fetchData();
        }
      }, // ✅ 确认后继续
    });
  };
  const columns: ProColumns<any>[] = [
    { title: "订单号", dataIndex: "orderCode" },
    { title: "客户昵称", dataIndex: "customerName", },
    { title: "商品金额", dataIndex: "productFee", search: false },
    { title: "运费", dataIndex: "postFee", search: false },
    { title: "服务费", dataIndex: "serviceFee", search: false },
    { title: "退款金额", dataIndex: "refundAmount", search: false },
    { title: "订单总金额", dataIndex: "totalFee", search: false },
    {
      title: "商品信息",
      dataIndex: "products",
      hideInForm: true,
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
      title: "订单状态",
      dataIndex: "statusCode",
      render: (value: any) => renderStatusTag("order", value),
      formItemRender: (_, { type, defaultRender, ...rest }, form) => {
        return (
          <Select
            placeholder="请选择订单状态"
            allowClear
            options={getStatusOptions("order")}
          />
        );
      },
    },
    {
      title: "备注",
      dataIndex: "remark",
      hideInForm: true,
      ellipsis: true, // 超过宽度自动显示省略号
      width: 200, // 设置列宽
    },
    {
      title: "下单时间",
      dataIndex: "createTime",
      valueType: "dateTimeRange",
      render: (_, records: any) => {
        return records?.createTime;
      },
      formItemRender: () => (
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: "100%" }}
        />
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
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {record?.canCloseFlag && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleClose(record)}
              >
                关闭订单
              </Button>
            )}


          </div>
        );
      },
    },
  ];

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    const [startTime, endTime] = values.createTime || [];
    const filterParams = {
      orderCode: values.orderCode,
      statusCode: values.statusCode,
      customerName: values.customerName,
      customerId: values.customerId,

      createTimeFrom: startTime
        ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      createTimeTo: endTime
        ? moment(endTime).format("YYYY-MM-DD HH:mm:ss")
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
    const customerId = urlParams.get("customerId");
    const customerName = urlParams.get("customerName");

    if (orderCode) {
      // 如果有 orderCode，设置 filters 并搜索
      const initialFilters = { orderCode };
      setFilters(initialFilters);
      formRef.current?.setFieldsValue(initialFilters);
      fetchData({ current: 1, ...initialFilters });
    } else if (customerId || customerName) {
      // 如果有 orderCode，设置 filters 并搜索
      const initialFilters = { customerId, customerName };
      setFilters(initialFilters);
      formRef.current?.setFieldsValue(initialFilters);
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
