import {
  getCountries,
  getOutboundSend,
  getOutboundSendListByPage,
  getShippingFeeTemplate,
  getShippingServers,
  getShippingTemplates,
  updateOutboundSendShippingCode,
  uploadOutboundSend,
} from "@/services";
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import {
  ArrowDownOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from "@ant-design/pro-components";
import { Button, Form, Pagination, Select, Upload, message } from "antd";
import React, { useEffect, useRef, useState } from "react";

type OrderProductRow = {
  id: string;
  outboundCode: string;
  customerName: string;
  sendStatus: string;
  sendList: any[];
  shippingList: any[];
};

const EditShippingModal: React.FC<{
  record: any;
  serverOptions: { label: string; value: string }[];
  onSuccess: () => void;
}> = ({ record, serverOptions, onSuccess }) => {
  const [form] = Form.useForm();
  const [routeOptions, setRouteOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [templateOptions, setTemplateOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    getCountries().then((res: any) => {
      setCountryOptions(
        res.data.map((item: any) => ({
          label: item.name,
          value: item.id,
        }))
      );
    });
  }, []);

  const fetchRoutes = async (serverId: string) => {
    if (!serverId) {
      setRouteOptions([]);
      return;
    }
    try {
      const res = await getShippingFeeTemplate(serverId);
      if (res?.data) {
        setRouteOptions(
          res.data.map((item: any) => ({
            label: item.lineName,
            value: item.id,
          }))
        );
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchTemplates = async (serverId: string, lineId: string, countryId?: string) => {
    console.log('serverId', serverId);
    console.log('lineId', lineId);
    console.log('countryId', countryId);
    if (!serverId || !lineId || !countryId) {
      setTemplateOptions([]);
      return;
    }
    try {
      const res = await getShippingTemplates(serverId, lineId, countryId);
      if (res?.data) {
        setTemplateOptions(
          res.data.map((item: any) => ({
            label: item.templateName,
            value: item.id,
          }))
        );
      }
    } catch (e) {
      console.log('e', e);
      // ignore
    }
  };

  return (
    <ModalForm<{
      shippingCode: string;
      serverId: string;
      lineId: string;
      templateId: string;
      remark: string;
      countryId: string;
    }>
      title="修改国际物流单号"
      trigger={<EditOutlined style={{ cursor: "pointer", color: "orange" }} />}
      width={400}
      form={form}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
      }}
      onOpenChange={async (visible) => {
        if (visible) {
          const serverId = record?.shipping?.serverId;
          const lineId = record?.shipping?.lineId; // 这里的取值逻辑可能需要根据实际字段调整
          const countryId = record?.address?.countryId; // 这里的取值逻辑可能需要根据实际字段调整
          if (serverId) {
            await fetchRoutes(serverId);
            if (lineId) {
              await fetchTemplates(serverId, lineId, countryId);
            }
          }
          form.setFieldsValue({
            shippingCode: record?.shipping?.shippingCode,
            serverId: serverId,
            lineId: lineId,
            templateId: record?.shipping?.templateId,
            remark: record?.remark,
            countryId: countryId,
          });
        }
      }}
      onFinish={async (values) => {
        try {
          const res = await updateOutboundSendShippingCode({
            id: record.id,
            shippingCode: values.shippingCode,
            templateId: values.templateId,
            remark: values.remark,
          });
          // @ts-ignore
          if (res?.success) {
            message.success("修改成功");
            onSuccess();
            return true;
          }
          return false;
        } catch (error) {
          message.error("修改失败");
          return false;
        }
      }}
    >
      <ProFormSelect
        name="countryId"
        label="国家"
        placeholder="请选择国家"
        showSearch
        fieldProps={{
          filterOption: (input, option: any) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
          onChange: (val: any) => {
            const serverId = form.getFieldValue("serverId");
            const lineId = form.getFieldValue("lineId");
            if (serverId && lineId) {
              fetchTemplates(serverId, lineId, val);
            }
          }
        }}
        options={countryOptions}
        rules={[{ required: true, message: "请选择国家" }]}
      />
      <ProFormText
        name="shippingCode"
        label="国际物流单号"
        placeholder="请输入国际物流单号"
        rules={[{ required: true, message: "请输入国际物流单号" }]}
      />
      <ProFormSelect
        name="serverId"
        label="承运商"
        placeholder="请选择承运商"
        allowClear
        options={serverOptions}
        fieldProps={{
          onChange: (val: any) => {
            form.setFieldValue("lineId", undefined);
            form.setFieldValue("templateId", undefined);
            fetchRoutes(val);
            setTemplateOptions([]);
          },
        }}
        rules={[{ required: true, message: "请选择承运商" }]}
      />
      <ProFormSelect
        name="lineId"
        label="运输路线"
        placeholder="请选择路线"
        allowClear
        options={routeOptions}
        fieldProps={{
          onChange: (val: any) => {
            form.setFieldValue("templateId", undefined);
            const serverId = form.getFieldValue("serverId");
            const countryId = form.getFieldValue("countryId");
            fetchTemplates(serverId, val, countryId);
          },
        }}
        rules={[{ required: true, message: "请选择路线" }]}
      />
      <ProFormSelect
        name="templateId"
        label="运输模板"
        placeholder="请选择运输模板"
        allowClear
        options={templateOptions}
        rules={[{ required: true, message: "请选择运输模板" }]}
      />
      <ProFormTextArea name="remark" label="备注" placeholder="请输入备注" />
    </ModalForm>
  );
};

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [serverOptions, setServerOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [routeOptions, setRouteOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<Record<string, any>>({});

  /** ✅ 初始化获取承运商列表 */
  useEffect(() => {
    const fetchServerList = async () => {
      try {
        setLoading(true);
        const res = await getShippingServers(); // 假设返回的数据结构是 { data: [...] }
        if (res?.data) {
          // 转换为 ProFormSelect 需要的格式
          const options = res.data.map((item: any) => ({
            label: item.serverName,
            value: item.id,
          }));
          setServerOptions(options);
        }
      } catch (err) {
        message.error("获取承运商列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchServerList();
  }, []);

  /** ✅ 选中承运商时加载路线 */
  const handleServerChange = async (serverId: string) => {
    console.log("serverId", serverId);
    // 清空之前的路线选择值
    formRef.current?.setFieldsValue({ lineId: undefined });
    setRouteOptions([]);
    if (!serverId) {
      setRouteOptions([]);
      return;
    }
    try {
      setLoading(true);
      const res = await getShippingFeeTemplate(serverId);
      if (res?.data) {
        const list = res.data.map((item: any) => ({
          label: item.lineName,
          value: item.id,
        }));
        setRouteOptions(list);
      }
    } catch (err) {
      message.error("获取路线失败");
    } finally {
      setLoading(false);
    }
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
      const res: any = await getOutboundSendListByPage(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
      setSelectedRows([]);
      setSelectedRowKeys([]);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "包裹编号",
      dataIndex: "packingPackageCode",
    },
    {
      title: "尺寸/重量",
      dataIndex: "packing",
      minWidth: 200,
      hideInSearch: true,
      render: (row: any, record: any) => {
        if (!row) return "--";

        const dims = [row.length, row.width, row.height].filter(
          (v) => v != null && v !== "" && v !== 0
        );

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.4,
              color: "#555",
            }}
          >
            {dims.length > 0 && (
              <div>
                <span style={{ color: "#999", marginRight: 4 }}>长宽高：</span>
                <span>{dims.join(" x ")}</span>
                <span style={{ color: "#999", marginLeft: 4 }}>cm</span>
              </div>
            )}
            {row.weight != null && row.weight > 0 && (
              <div>
                <span style={{ color: "#999", marginRight: 4 }}>重量：</span>
                <span>{row.weight}</span>
                <span style={{ color: "#999", marginLeft: 4 }}>g</span>
              </div>
            )}
            {record.location?.locationCode && (
              <div style={{ color: "#999", marginRight: 4, marginTop: 8 }}>
                <span >货位：</span>
                <span>{record.location.locationCode}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "收件人",
      dataIndex: "address",
      hideInSearch: true,
      render: (record: any) => {
        // record 是每行的完整对象
        return (
          <div>
            <div>
              <strong>{record.recipient}</strong> &nbsp; {record.phone}
            </div>
            <div>
              {record.country} {record.state} {record.city} {record.address}{" "}
              {record.doorNo} {record.postcode}
            </div>
          </div>
        );
      },
    },
    {
      title: "承运商",
      minWidth: 70,

      dataIndex: "serverId", // 搜索表单字段名必须是独立字段
      key: "serverId",
      render: (_, record: any) => record.shipping?.serverName || "--",
      renderFormItem: () => (
        <ProFormSelect
          placeholder="请选择承运商"
          allowClear
          options={serverOptions}
          fieldProps={{
            onChange: (val: any) => {
              handleServerChange(val); // 拉取路线
            },
          }}
        />
      ),
    },
    {
      title: "运输路线",
      minWidth: 120,
      dataIndex: "lineId",
      key: "lineId",
      render: (_, record: any) => record.shipping?.lineName || "--",
      renderFormItem: () => (
        <ProFormSelect
          placeholder="请选择路线"
          allowClear
          options={routeOptions}
        />
      ),
    },
    {
      title: "国际物流单号",
      dataIndex: "shippingCode",
      width: 150,
      render: (_, record: any) => {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{record?.shipping?.shippingCode || "--"}</span>

            {record?.shipping?.shippingCode && (
              <EditShippingModal
                record={record}
                serverOptions={serverOptions}
                onSuccess={() => actionRef.current?.reload()}
              />)}
          </div>
        );
      },
    },
    {
      title: "备注",
      dataIndex: "remark",
      hideInSearch: true,
    },
    {
      title: "发货状态",
      dataIndex: "sendStatusCode",
      render: (value: any) => renderStatusTag("delivery", value),
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择发货状态"
            allowClear
            options={getStatusOptions("delivery")}
          />
        );
      },
    },
    {
      title: "发货人",
      dataIndex: "updateUserName",
      hideInSearch: true,
    },
    {
      title: "发货时间",
      dataIndex: "updateTime",
      hideInSearch: true,
      render: (_, record: any) => {
        const sendStatusCode = record.sendStatusCode;
        const updateTime = record.updateTime;
        if (sendStatusCode == 2041) return "--";
        return updateTime;
      },
    },
  ];
  // 上传按钮配置
  const uploadProps = {
    accept: ".xlsx,.xls", // 限制文件类型
    beforeUpload: (file: File) => {
      setUploadLoading(true);
      uploadOutboundSend(file)
        .then((res) => {
          if (res.success) {
            message.success(res.msg || "上传成功");
          }
        })
        .catch(() => {
          message.error("上传失败");
        })
        .finally(() => setUploadLoading(false));
      return false; // 阻止 antd 自动上传
    },
  };

  // 工具栏按钮
  const toolBarRender = () => {
    const buttons: React.ReactNode[] = [];
    // 获取当前搜索表单值
    const currentFormValues = formRef.current?.getFieldsValue?.();
    const serverId = currentFormValues?.serverId;
    const lineId = currentFormValues?.lineId;
    // 导出发货 Excel 按钮
    if (serverId) {
      buttons.push(
        <Button
          key="export-outbound"
          type="primary"
          icon={<ArrowDownOutlined />}
          onClick={async () => {
            if (!serverId) {
              message.info("请先筛选承运商");
              return;
            }
            // if (selectedRows.length === 0) {
            //   message.info("请先勾选需要导出的数据");
            //   return;
            // }

            try {
              const res = await getOutboundSend({
                outboundSendIdSet: selectedRows.map((item) => item.id),
                serverId,
                lineId,
              });
              if (res?.data) {
                window.open(res.data, "_blank");
              }
            } catch {
              message.error("导出失败");
            }
          }}
        >
          导出发货 Excel
        </Button>
      );
    }

    // 上传出库单按钮（未选承运商时隐藏）
    buttons.push(
      <Upload key="upload-outbound" {...uploadProps} showUploadList={false}>
        <Button icon={<UploadOutlined />} loading={uploadLoading}>
          上传出库单
        </Button>
      </Upload>
    );

    return buttons;
  };

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    // const [startTime, endTime] = values.createTime || [];
    const filterParams = {
      outboundCode: values.outboundCode,
      packingPackageCode: values.packingPackageCode,
      shippingCode: values.shippingCode,
      sendStatusCode: values.sendStatusCode,
      serverId: values.serverId,
      lineId: values.lineId,
      // createTimeFrom: startTime
      //   ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
      //   : undefined,
      // createTimeTo: endTime
      //   ? moment(endTime).format("YYYY-MM-DD HH:mm:ss")
      //   : undefined,
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
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        size="small"
        columns={columns}
        pagination={false}
        dataSource={dataSource}
        loading={loading}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        toolBarRender={toolBarRender}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
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
