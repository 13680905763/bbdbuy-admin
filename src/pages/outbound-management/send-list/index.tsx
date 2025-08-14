import {
  getOutboundSend,
  getOutboundSendListByPage,
  getShippingFeeTemplate,
  getShippingServers,
  uploadOutboundSend,
} from "@/services";
import { ArrowDownOutlined, UploadOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  PageContainer,
  ProFormSelect,
  ProTable,
} from "@ant-design/pro-components";
import { Button, Pagination, Upload, message } from "antd";
import React, { useEffect, useRef, useState } from "react";

type OrderProductRow = {
  id: string;
  outboundCode: string;
  customerName: string;
  sendStatus: string;
  sendList: any[];
  shippingList: any[];
};

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<OrderProductRow[]>([]);

  // 搜索选项
  const [serverId, setServerId] = useState<{ label: string; value: string }[]>(
    []
  );
  const [templateId, setTemplateId] = useState<
    { label: string; value: string }[]
  >([]);
  const [searchValues, setSearchValues] = useState<{
    serverId?: string;
    templateId?: string;
  }>({});

  // 获取承运商列表（运输路线）
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await getShippingServers();
        const options = res?.data.map((item: any) => ({
          label: item.serverName,
          value: item.id,
        }));
        setServerId(options);
      } catch (err) {
        console.error("获取运输路线失败", err);
      }
    }
    fetchRoutes();
  }, []);

  // 联动：选路线时刷新承运商
  const handleRouteChange = async (routeCode: string) => {
    try {
      const res = await getShippingFeeTemplate(routeCode);
      const options = res?.data.map((item: any) => ({
        label: item.templateName,
        value: item.id,
      }));
      setTemplateId(options);
    } catch (err) {
      console.error("获取承运商失败", err);
    }
  };

  const fetchData = async (values?: { route?: string; carrier?: string }) => {
    setLoading(true);
    console.log("val", values);

    try {
      const res: any = await getOutboundSendListByPage({
        page,
        pageSize,
        ...values,
      });
      setDataSource(res.data.records);
      setTotal(res.data.total);
    } catch (err) {
      message.error("加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("searchValues", searchValues);

    fetchData(searchValues);
  }, [page, pageSize, searchValues]);

  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "出库单号",
      dataIndex: "outboundCode",
    },
    {
      title: "货位",
      dataIndex: "sendList",
      render: (sendList: any[]) =>
        sendList.map(
          (item) =>
            `${item.location.packageCode}--${item.location.locationCode}--${item.location.locationStatus}`
        ),
    },
    {
      title: "承运商",
      dataIndex: "shippingList.methodName",
      hideInTable: true,
      renderFormItem: (_, { value, onChange }) => (
        <ProFormSelect
          placeholder="请选择承运商"
          name="serverId" // <-- 明确表单字段名
          options={serverId}
          value={value}
          onChange={(val) => {
            onChange?.(val);
            console.log("val", val);
            if (val) {
              handleRouteChange(val); // 选路线刷新承运商
            } else {
              setTemplateId([]);
            }
          }}
        />
      ),
    },
    {
      title: "运输路线",
      dataIndex: "shippingList.serverName",
      hideInTable: true,
      renderFormItem: (_, { value, onChange }) => (
        <ProFormSelect
          name="templateId" // <-- 明确表单字段名
          placeholder="请选择运输路线"
          options={templateId}
          value={value}
          onChange={onChange}
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "sendStatus",
    },
  ];
  const props = {
    accept: ".xlsx,.xls", // 限制文件类型
    beforeUpload: (file: File) => {
      setLoading(true);
      uploadOutboundSend(file)
        .then(() => {
          message.success("上传成功");
        })
        .catch(() => {
          message.error("上传失败");
        })
        .finally(() => setLoading(false));
      return false; // 阻止 antd 自动上传
    },
  };

  return (
    <PageContainer>
      <ProTable<OrderProductRow>
        bordered
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        pagination={false}
        dataSource={dataSource}
        loading={loading}
        search={{
          labelWidth: "auto",
          // collapsed: false,
        }}
        onSubmit={(values) => {
          console.log("values", values);

          setSearchValues({
            serverId: values.serverId,
            templateId: values.templateId,
          });
          setPage(1);
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            icon={<ArrowDownOutlined />}
            onClick={async () => {
              if (selectedRows.length < 1) {
                message.info("请先勾选打印数据");
                return;
              }
              if (!searchValues.serverId) {
                message.info("请筛选承运商");
                return;
              }
              console.log(
                "点击了打印拣货单按钮666",
                searchValues,
                selectedRows.map((item) => item.id)
              );
              const res = await getOutboundSend({
                outboundIdSet: selectedRows.map((item) => item.id),
                ...searchValues,
              });
            }}
          >
            导出发货excel
          </Button>,
          <Upload {...props} showUploadList={false}>
            <Button icon={<UploadOutlined />} loading={loading}>
              上传出库单
            </Button>
          </Upload>,
        ]}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
      <div style={{ padding: 16, textAlign: "right" }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          onChange={(newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize);
          }}
        />
      </div>
    </PageContainer>
  );
};

export default TableList;
