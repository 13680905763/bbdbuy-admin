import MediaPreviewGroup from "@/components/MediaPreviewGroup";
import { getPhotoList } from "@/services";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { DatePicker, Pagination, Select, Tag, message } from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";

const { RangePicker } = DatePicker;

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [dataSource, setDataSource] = useState<any[]>([]);
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
      // ...filters,目前 搜索跟分页自己带上
      ...params,
    };
    console.log("fetchData -> query", query);

    setLoading(true);
    try {
      const res: any = await getPhotoList(query);
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
    待拍照: "orange",
    已拍照: "green",
  };

  const renderStatusTag = (text: string) => {
    const color = statusMap[text] || "default"; // 未匹配的状态使用默认色
    return <Tag color={color}>{text}</Tag>;
  };
  const columns: ProColumns<any>[] = [
    {
      title: "订单号",
      dataIndex: "orderCode",
    },
    {
      title: "包裹单号",
      dataIndex: "packageCode",
    },
    {
      title: "服务名",
      dataIndex: "serviceName",
      hideInSearch: true,
    },
    {
      title: "拍照/视频",
      dataIndex: "fileList",
      hideInSearch: true,
      minWidth: 400,
      render: (_, record) => {
        if (!record.fileList || record.fileList.length === 0) return null;
        return (
          <MediaPreviewGroup fileList={record.fileList} thumbnailSize={40} />
        );
      },
    },
    {
      title: "拍照状态",
      dataIndex: "serviceStatus",
      render: (text: any) => renderStatusTag(text),
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => {
        return (
          <Select
            placeholder="请选择拍照状态"
            allowClear
            style={{ width: "100%" }}
            options={[
              { label: "待拍照", value: 1051 },
              { label: "已拍照", value: 1052 },
            ]}
          />
        );
      },
    },
    {
      title: "拍照人",
      dataIndex: "userName",
      hideInSearch: true,
    },
    {
      title: "拍照时间",
      dataIndex: "updateTime",
      valueType: "dateTimeRange",
      render: (_, records: any) => {
        if (records?.serviceStatus === "已拍照") {
          return records?.updateTime;
        }
        return "-";
      },
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => (
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

    const [startTime, endTime] = values.updateTime || [];
    const filterParams = {
      orderCode: values.orderCode,
      packageCode: values.packageCode,
      serviceStatusCode: values.serviceStatus,
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
