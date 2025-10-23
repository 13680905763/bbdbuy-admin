import {
  createGoodsType,
  delGoodsType,
  getGoodsType,
  putGoodsType,
} from "@/services";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Tag,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

const ConfigList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();

  /** 拉取数据 */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getGoodsType();
      setDataSource(res.data);
    } catch (e) {
      message.error("加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [couponType, setCouponType] = useState<number | null>(null);
  const [srcType, setSrcType] = useState<number | null>(null);

  /** 新建 */
  const handleAdd = () => {
    setCurrentRow(null);
    form.resetFields();
    setCouponType(null);
    setSrcType(null);
    setEditModalVisible(true);
  };

  /** 修改 */
  const handleEdit = (record: any) => {
    setCurrentRow(record);
    form.setFieldsValue(record);
    setCouponType(record.type ?? null);
    setSrcType(record.src ?? null);
    setEditModalVisible(true);
  };

  /** 删除 */
  const handleDelete = async (record: any) => {
    const res = await delGoodsType(record.id);
    if (res.success) {
      message.success("删除成功");
      fetchData();
    }
  };

  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);
      console.log("values", values);

      let res;
      if (currentRow?.id) {
        values.id = currentRow.id;
      }
      if (currentRow?.id) {
        // 修改
        res = await putGoodsType(values);
      } else {
        // 新增
        res = await createGoodsType(values);
      }

      if (res.success) {
        message.success(currentRow ? "修改成功" : "新增成功");
        setEditModalVisible(false);
        fetchData();
      } else {
        message.error(res.message || "操作失败");
      }
    } catch (e) {
      console.error(e);
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const columns: any = [
    { title: "货物类别", dataIndex: "categoryName" },
    { title: "一级类别", dataIndex: "firstCategory" },
    { title: "二级类别", dataIndex: "secondCategory" },
    {
      title: "是否默认",
      dataIndex: "defaultCategory",
      align: "center",
      width: 100,
      render: (value: any) => {
        const isDefault = value == 1 ? true : false;
        return (
          <Tag color={isDefault ? "green" : "default"}>
            {isDefault ? "是" : "否"}
          </Tag>
        );
      },
    },

    {
      title: "操作",
      valueType: "option",
      render: (_: any, record: any) => [
        <Button
          type="link"
          style={{ color: "#1890ff", padding: 0 }}
          onClick={() => handleEdit(record)}
        >
          修改
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除吗？"
          onConfirm={() => handleDelete(record)}
        >
          <a style={{ color: "#ff4d4f" }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
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
        columns={columns}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建
          </Button>,
        ]}
      />

      {/* 新增/修改 弹窗 */}
      <Modal
        title={currentRow ? "修改" : "新增"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        confirmLoading={loading}
        width={500}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input hidden />
          </Form.Item>
          <Form.Item
            name="firstCategory"
            label="一级类别"
            rules={[{ required: true, message: "一级类别" }]}
          >
            <Input placeholder="请输入一级类别" />
          </Form.Item>
          <Form.Item
            name="secondCategory"
            label="二级类别"
            rules={[{ required: true, message: "二级类别" }]}
          >
            <Input placeholder="请输入二级类别" />
          </Form.Item>

          {/* 来源 */}
          <Form.Item
            name="defaultCategory"
            label="是否默认"
            rules={[{ required: true, message: "请选择是否默认" }]}
          >
            <Select placeholder="请选择是否默认">
              <Select.Option value={1}>是</Select.Option>
              <Select.Option value={2}>否</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
