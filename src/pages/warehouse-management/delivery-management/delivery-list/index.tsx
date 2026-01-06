import { getDeliveryListByPage } from "@/services/order";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { DatePicker, Pagination, Select, message } from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});

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
      const res: any = await getDeliveryListByPage(query);
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
      title: "订单号",
      dataIndex: "orderCode",
    },
    {
      title: "采购编号",
      dataIndex: "purchaseCode",
    },

    {
      title: "快递公司",
      dataIndex: "logisticsCompany",
      hideInSearch: true,
    },
    {
      title: "快递单号",
      dataIndex: "logisticsCode",
    },


    {
      title: "发货时间",
      dataIndex: "createTime",
      valueType: "dateTimeRange",
      render: (_, record) => record?.createTime,
      renderFormItem: () => (
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "收货状态",
      dataIndex: "receiveStatusCode",
      render: (value: any) => renderStatusTag("receiving", value),
      renderFormItem: (_, { type, defaultRender, ...rest }, form) => {
        return (
          <Select
            placeholder="请选择收货状态"
            allowClear
            style={{ width: "100%" }}
            options={getStatusOptions("receiving")}
          />
        );
      },
    },
    {
      title: "收货人",
      dataIndex: "userName",
      hideInSearch: true,
    },
    {
      title: "收货时间",
      dataIndex: "updateTime",
      valueType: "dateTimeRange",
      render: (_, records: any) => {
        if (records?.receiveStatus === "已收货") {
          return records?.updateTime;
        }
        return "-";
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
    const [createStartTime, createEndTime] = values.createTime || [];
    const [updateStartTime, updateEndTime] = values.updateTime || [];
    const filterParams = {
      orderCode: values.orderCode,
      purchaseCode: values.purchaseCode,
      logisticsCode: values.logisticsCode,
      receiveStatusCode: values.receiveStatusCode,
      createTimeFrom: createStartTime
        ? moment(createStartTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      createTimeTo: createEndTime
        ? moment(createEndTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      updateTimeFrom: updateStartTime
        ? moment(updateStartTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      updateTimeTo: updateEndTime
        ? moment(updateEndTime).format("YYYY-MM-DD HH:mm:ss")
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
