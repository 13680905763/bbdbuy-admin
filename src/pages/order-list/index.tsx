import { getOrderListByPage } from "@/services/order"; // 你的接口路径
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  DatePicker,
  Image,
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

  const columns: ProColumns<any>[] = [
    { title: "订单号", dataIndex: "orderCode" },
    { title: "用户名", dataIndex: "customerName", hideInSearch: true },
    { title: "商品金额", dataIndex: "productFee", hideInSearch: true },
    { title: "运费金额", dataIndex: "postFee", hideInSearch: true },
    { title: "服务费金额", dataIndex: "serviceFee", hideInSearch: true },
    { title: "退款金额", dataIndex: "refundAmount", hideInSearch: true },
    { title: "订单总金额", dataIndex: "totalFee", hideInSearch: true },
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
      title: "订单状态",
      dataIndex: "statusCode",
      render: (value: any) => renderStatusTag("order", value),
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => {
        return (
          <Select
            placeholder="请选择订单状态"
            allowClear
            options={getStatusOptions("order")}
          />
        );
      },
    },
    { title: "备注", dataIndex: "remark", hideInSearch: true },
    {
      title: "下单时间",
      dataIndex: "createTime",
      valueType: "dateTimeRange",
      render: (_, records: any) => {
        return records?.createTime;
      },
      renderFormItem: () => (
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: "100%" }}
        />
      ),
    },
  ];

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    const [startTime, endTime] = values.createTime || [];
    const filterParams = {
      orderCode: values.orderCode,
      statusCode: values.statusCode,
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
