import { PlusOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ActionType } from "@ant-design/pro-table";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Tabs,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

import {
  createPromotion,
  delPromotion,
  getPromotionList,
  putPromotion,
} from "@/services";

const ConfigList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"EXPERIENCE" | "LEVEL" | "POINTS">(
    "EXPERIENCE"
  );
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null); // null 表示新建
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType | null>(null);

  /** 拉取数据 */
  const fetchData = async (type: string) => {
    setLoading(true);
    try {
      const res: any = await getPromotionList(type);
      setDataSource(res?.data || []);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  /** 新建 */
  const handleAdd = () => {
    setCurrentRow(null);
    form.resetFields();
    form.setFieldsValue({ configType: activeTab });
    setEditModalVisible(true);
  };

  /** 修改 */
  const handleEdit = (record: any) => {
    setCurrentRow(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  /** 删除 */
  const handleDelete = async (record: any) => {
    setLoading(true);
    try {
      await delPromotion(record.id);
      message.success("删除成功");
      fetchData(activeTab);
    } catch (e) {
      message.error("删除失败");
    } finally {
      setLoading(false);
    }
  };

  /** 保存（新增/修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (currentRow?.id) {
        values.id = currentRow.id;
      }
      setLoading(true);

      if (currentRow?.id) {
        // 修改
        await putPromotion(values);
        message.success("修改成功");
      } else {
        // 新增
        await createPromotion(values);
        message.success("新建成功");
      }

      message.success(currentRow ? "修改成功" : "新建成功");
      setEditModalVisible(false);
      fetchData(activeTab);
    } catch (e) {
      console.error(e);
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  /** 表格列 */
  const columns: any[] = [
    { title: "配置类型", dataIndex: "configType" },
    { title: "配置编码", dataIndex: "configCode" },
    { title: "配置值", dataIndex: "configValue" },
    { title: "范围最小值", dataIndex: "rangeMin" },
    { title: "范围最大值", dataIndex: "rangeMax" },
    { title: "会员等级编码", dataIndex: "rangeCode" },
    { title: "会员等级名称", dataIndex: "rangeName" },
    { title: "优先级", dataIndex: "priority" },
    { title: "描述", dataIndex: "description" },
    {
      title: "操作",
      valueType: "option",
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>
          修改
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除吗？"
          onConfirm={() => handleDelete(record)}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={[
          { label: "经验等级", key: "EXPERIENCE" },
          { label: "奖金配置", key: "LEVEL" },
          { label: "积分配置", key: "POINTS" },
        ]}
      />

      <ProTable
        bordered
        actionRef={actionRef}
        rowKey="id"
        search={false}
        pagination={false}
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建
          </Button>,
        ]}
      />

      <Modal
        title={currentRow ? "修改配置" : "新建配置"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        confirmLoading={loading}
        width={480}
        destroyOnClose
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item name="configType" label="配置类型">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="configCode"
            label="配置编码"
            rules={[{ required: true, message: "请输入配置编码" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="configValue"
            label="配置值"
            rules={[{ required: true, message: "请输入配置值" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="rangeMin" label="范围最小值">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="rangeMax" label="范围最大值">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="rangeCode" label="会员等级编码">
            <Input />
          </Form.Item>

          <Form.Item name="rangeName" label="会员等级名称">
            <Input />
          </Form.Item>

          <Form.Item name="priority" label="优先级">
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
