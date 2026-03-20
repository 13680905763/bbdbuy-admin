import {
  createShippingServers,
  delShippingServers,
  getShippingServersList,
  putShippingServers,
} from "@/services";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, Form, Input, message, Modal, Popconfirm } from "antd";
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
      const res: any = await getShippingServersList();
      setDataSource(res.data);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** 新建 */
  const handleAdd = () => {
    setCurrentRow(null);
    form.resetFields();
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
    try {
      const res = await delShippingServers(record.id);
      if (res.success) {
        message.success("删除成功");
        fetchData();
      } else {
        message.error(res.message || "删除失败");
      }
    } catch (e) {
      message.error("删除失败");
    }
  };

  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let res;
      if (currentRow?.id) {
        values.id = currentRow.id;
        res = await putShippingServers(values);
      } else {
        res = await createShippingServers(values);
      }

      if (res.success) {
        message.success(currentRow ? "修改成功" : "新增成功");
        setEditModalVisible(false);
        fetchData();
      } else {
        message.error(res.message || "操作失败");
      }
    } catch (e) {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "服务商代码", dataIndex: "serverCode" },
    { title: "服务商名称", dataIndex: "serverName" },
    { title: "更新时间", dataIndex: "updateTime" },
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
        destroyOnHidden
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="serverCode"
            label="服务商代码"
            rules={[{ required: true, message: "请输入服务商代码" }]}
          >
            <Input placeholder="请输入服务商代码" />
          </Form.Item>

          <Form.Item
            name="serverName"
            label="服务商名称"
            rules={[{ required: true, message: "请输入服务商名称" }]}
          >
            <Input placeholder="请输入服务商名称" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
