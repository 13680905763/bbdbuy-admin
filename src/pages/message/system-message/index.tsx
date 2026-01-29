import { messageApi } from "@/services/message";
import { closeOrder, getOrderListByPage } from "@/services/order"; // 你的接口路径
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { CopyOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
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
  Typography,
} from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const { RangePicker } = DatePicker;

  const { listSystemMessage, readSystemMessage } = messageApi;
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
      // ...filters,目前 搜索跟分页自己带上
      ...params,
    };
    console.log("fetchData -> query", query);

    setLoading(true);
    try {
      const res: any = await listSystemMessage(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };


  const columns: ProColumns<any>[] = [
    {
      title: "业务单号", dataIndex: "content", width: 300,
      render: (text: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            onClick={async () => {
              // 先调用已读接口
              try {
                if (record.statusCode === 0) { // 只有未读才调用已读
                  await readSystemMessage(record.id);
                  // 刷新页面数据
                  fetchData({ ...filters, current, size });
                }
              } catch (error) {
                console.error("标记已读失败", error);
                return;
              }
              const orderCode = record?.content;

              if (orderCode) {
                window.open(`/order-list?orderCode=${orderCode}`, "_blank");
              }
            }}
          >
            {text}
          </a>
          <Typography.Text
            copyable={{
              text: text,
              tooltips: ["复制", "复制成功"],
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: "orange",
            }}
          />
        </div>
      ),
    },
    {
      title: "通知类型",
      dataIndex: "noticeTypeCode",
      render: (value: any) => renderStatusTag("noticeType", value),
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => {
        return (
          <Select
            placeholder="请选择通知类型"
            allowClear
            options={getStatusOptions("noticeType")}
          />
        );
      },
    },
    { title: "接收人", dataIndex: "userName", hideInSearch: true },
    {
      title: "状态",
      dataIndex: "statusCode",
      render: (value: any) => renderStatusTag("systemMessage", value),
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => {
        return (
          <Select
            placeholder="请选择消息状态"
            allowClear
            options={getStatusOptions("systemMessage")}
          />
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      valueType: "dateTime",
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
      noticeTypeCode: values.noticeTypeCode,
      content: values.content,
      statusCode: values.statusCode,

      startTime: startTime
        ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      endTime: endTime
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
