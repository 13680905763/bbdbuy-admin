import { freeSendOutbound, getOutboundListByPage } from "@/services";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { PlusOutlined } from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  message,
} from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { printPickingList } from "./pre";

const { RangePicker } = DatePicker;

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [dataSource, setDataSource] = useState<any[]>([]);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
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
      const res: any = await getOutboundListByPage(query);
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
      title: "出库单号",
      dataIndex: "outboundCode",
    },
    {
      title: "用户名",
      dataIndex: "customerName",
      hideInSearch: true,
    },
    {
      title: "运费",
      dataIndex: "shippingFee",
      hideInSearch: true,
    },
    {
      title: "服务费",
      dataIndex: "serviceFee",
      hideInSearch: true,
    },
    {
      title: "总费用",
      dataIndex: "totalFee",
      formItemProps: {
        label: "出库包裹号",
      },
      renderFormItem: () => {
        return <Input placeholder="请输入" />;
      },
    },
    {
      title: "包裹信息",
      dataIndex: "packing",
      render: (packing: any) => {
        console.log("packing", packing);
        return (
          <div className="purchase-table">
            <Table
              bordered
              rowKey="id"
              dataSource={packing}
              columns={[
                {
                  title: "包裹编号",
                  dataIndex: "packingPackageCode",
                  key: "packingPackageCode",
                },
                {
                  title: "状态",
                  dataIndex: "statusCode",
                  key: "statusCode",
                  render: (value: any, record: any) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {renderStatusTag("outbound", value)}
                      {value == 203 && (
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => {
                            Modal.confirm({
                              title: "内测客户免费发货",
                              cancelButtonProps: {
                                style: { borderColor: "#f0700c", color: "#f0700c" },
                              },
                              okButtonProps: {
                                style: { backgroundColor: "#f0700c" },
                              },
                              content:
                                "请仔细核对该运单是否属于内测客户，点击'确认'即代表该运单免费邮寄。",
                              onOk: async () => {
                                try {
                                  await freeSendOutbound(
                                    record.packingPackageCode
                                  );
                                  message.success("操作成功");
                                  fetchData({ ...filters, current, size });
                                } catch (error) {
                                  console.error("免费发货失败", error);
                                }
                              },
                            });
                          }}
                        >
                          免运费
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              pagination={false}
            />
          </div>
        );
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择包裹状态"
            allowClear
            options={getStatusOptions("outbound")}
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
      outboundCode: values.outboundCode,
      packingPackageCode: values.totalFee,
      statusCode: values.packing,
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
        size="small"
        bordered
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        pagination={false} // ❗️我们自己控制分页
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
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
              if (selectedRows.length < 1) {
                message.info("请先勾选打印数据");
                return;
              }
              console.log("点击了打印拣货单按钮", selectedRows);
              const printData = selectedRows
                .map((packing: any) => {
                  return packing.packing
                    .filter((item: any) => item.statusCode != 200) // 过滤掉已取消 (200)
                    .map((item: any) => {
                      return {
                        packingPackageCode: item?.packingPackageCode,
                        customerName: item?.customerName,
                        methodName: item?.shipping?.methodName,
                        remark: packing?.remark,
                        services: item?.services.map((service: any) => {
                          return service?.serviceName;
                        }),
                        items: item.items.map((pag: any) => {
                          return {
                            packageCode: pag?.packageCode,
                            locationCode: pag?.location?.locationCode,
                            quantity: pag.quantity,
                          };
                        }),
                      };
                    });
                })
                .flat();
              console.log("printData", printData);
              if (printData.length === 0) {
                message.warning("所选订单中没有可打印的包裹");
                return;
              }
              printPickingList(printData);
            }}
          >
            打印拣货单
          </Button>,
        ]}
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
