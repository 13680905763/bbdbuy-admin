import { PageContainer, ProTable, ActionType } from "@ant-design/pro-components";
import {
  Button,
  Form,
  InputNumber,
  message,
  Modal,
  Pagination,
  Space,
  Tabs,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

import { getPaymentFeeList, putPaymentFeeList } from "@/services";

const ConfigList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"PROPORTION" | "FIXED">(
    "PROPORTION"
  );
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null); // null 表示新建
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType | null>(null);

  // 分页
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  /** 拉取数据 */
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
      const res: any = await getPaymentFeeList(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ itemTypeCode: activeTab });
  }, [activeTab]);
  /** ✅ 分页变化 */
  const handlePageChange = (page: number, pageSize?: number) => {
    console.log("分页", page, pageSize, { current: page, size: pageSize });

    setCurrent(page);
    setSize(pageSize || 10);
    fetchData({ current: page, size: pageSize, itemTypeCode: activeTab });
  };
  /** 修改 */
  const handleEdit = (record: any) => {
    setCurrentRow(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  /** 保存（新增/修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("values", values);

      setLoading(true);

      // 修改
      await putPaymentFeeList({
        itemValue: values.itemValue,
        id: values.paymentFeeId,
      });
      message.success("修改成功");

      setEditModalVisible(false);
      fetchData({ itemTypeCode: activeTab });
    } catch (e) {
      console.error(e);
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };
  const columns = {
    PROPORTION: [
      {
        title: "方法名称",
        dataIndex: "methodName",
        key: "methodName",
        width: 120,
      },
      {
        title: "支付方式",
        dataIndex: "payName",
        key: "payName",
        width: 150,
        render: (text: any, record: any) => (
          <Space>
            <img
              src={record.logoUrl}
              alt={text}
              style={{ width: 40, height: 40 }}
            />
            <span>{text}</span>
          </Space>
        ),
      },
      {
        title: "收取方式",
        dataIndex: "itemType",
        key: "itemType",
        width: 120,
      },
      {
        title: "比例值（%）",
        dataIndex: "itemValue",
        key: "itemValue",
        width: 120,
      },
      {
        title: "操作",
        valueType: "option",
        render: (_: any, record: any) => (
          <div>
            <Button
              type="link"
              style={{ color: "#1890ff", padding: 0 }}
              onClick={() => handleEdit(record)}
            >
              修改
            </Button>
          </div>
        ),
        width: 80,
      },
    ],
    FIXED: [
      {
        title: "方法名称",
        dataIndex: "methodName",
        key: "methodName",
        width: 120,
      },
      {
        title: "支付方式",
        dataIndex: "payName",
        key: "payName",
        width: 150,
        render: (text: any, record: any) => (
          <Space>
            <img
              src={record.logoUrl}
              alt={text}
              style={{ width: 40, height: 40 }}
            />
            <span>{text}</span>
          </Space>
        ),
      },
      {
        title: "固定费用",
        dataIndex: "itemType",
        key: "itemType",
        width: 120,
      },
      {
        title: "美金",
        dataIndex: "itemValue",
        key: "itemValue",
        width: 120,
      },
      {
        title: "操作",
        valueType: "option",
        render: (_: any, record: any) => (
          <div>
            <Button
              type="link"
              style={{ color: "#1890ff", padding: 0 }}
              onClick={() => handleEdit(record)}
            >
              修改
            </Button>
          </div>
        ),
        width: 80,
      },
    ],
  };
  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={[
          { label: "手续费", key: "PROPORTION" },
          { label: "固定费用", key: "FIXED" },
        ]}
      />

      <ProTable
        size="small"
        options={{
          reload: false,
          fullScreen: true,
          density: false,
        }}
        bordered
        actionRef={actionRef}
        rowKey="id"
        search={false}
        pagination={false}
        dataSource={dataSource}
        loading={loading}
        columns={columns[activeTab]}
      />

      <Modal
        title={"修改"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        confirmLoading={loading}
        width={480}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item name="paymentFeeId" hidden />

          <Form.Item
            name="itemValue"
            label={activeTab === "FIXED" ? "美金" : "比例值（%）"}
          >
            <InputNumber
              // step={0.01}
              min={0}
              // precision={activeTab === "FIXED" ? 1 : 3} // 必须和step对应
              // step={activeTab === "FIXED" ? 0.1 : 0.001}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
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

export default ConfigList;
