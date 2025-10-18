import { getReceiveWarehouseList } from "@/services";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { DatePicker, Pagination, Tag, message } from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";

type OrderProductRow = {
  id: string;
  logisticsCode: string;
  scanMsg: string;
  signatureMsg: string;
  userName: string;
  updateTime: string;
};

const { RangePicker } = DatePicker;

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});

  /** ✅ fetchData 不依赖外部状态，只依赖参数 */
  const fetchData = async (params?: any) => {
    const query = {
      current,
      size,
      // ...filters,
      ...params,
    };
    console.log("fetchData -> query", query);

    setLoading(true);
    try {
      const res: any = await getReceiveWarehouseList(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  /** ✅ 状态列渲染 */
  const statusMap: Record<string, string> = {
    识别成功: "green",
    已签收: "green",
  };

  const renderStatusTag = (text: string) => {
    const color = statusMap[text] || "red"; // 未匹配的状态使用默认色
    return <Tag color={color}>{text}</Tag>;
  };
  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "快递单号",
      dataIndex: "logisticsCode",
    },
    {
      title: "识别结果",
      dataIndex: "scanMsg",
      render: (text: any) => renderStatusTag(text),
      hideInSearch: true,
    },
    {
      title: "签收状态",
      dataIndex: "signatureMsg",
      render: (text: any) => renderStatusTag(text),
      hideInSearch: true,
    },
    {
      title: "签收人",
      dataIndex: "userName",
      hideInSearch: true,
    },
    {
      title: "签收时间",
      dataIndex: "updateTime",
      valueType: "dateTimeRange",
      render: (_, record) => record?.updateTime,
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => (
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: "100%" }}
          // value={form?.getFieldValue("updateTime") || undefined}
          // onChange={(dates) => {
          //   form?.setFieldsValue({
          //     updateTime: dates || undefined,
          //   });
          // }}
        />
      ),
    },
  ];

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    const [startTime, endTime] = values.updateTime || [];
    const filterParams = {
      logisticsCode: values.logisticsCode,
      updateTimeFrom: startTime
        ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      updateTimeTo: endTime
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
        formRef={formRef}
        size="small"
        bordered
        actionRef={actionRef}
        rowKey="id"
        pagination={false}
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
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
