import {
  createServicesList,
  delServices,
  getServicesList,
  putServicesList,
  uploadShippingLineLogo,
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
  Upload,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

const ConfigList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(""); // 用 state 存 logo

  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();

  /** 拉取数据 */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getServicesList({});
      setDataSource(res.data.records);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async ({ file }: any) => {
    try {
      const res: any = await uploadShippingLineLogo(file as File);
      setLogoUrl(res.data); // 保存到 state
      form.setFieldsValue({ sample: res.data }); // 同步到表单字段
      message.success("上传成功");
    } catch (err) {
      message.error("上传失败");
    }
  };
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

    // 如果 record 有 logoUrl，设置到 state 方便预览
    if (record.sample) {
      setLogoUrl(record.sample);
    } else {
      setLogoUrl("");
    }

    setEditModalVisible(true);
  };
  /** 删除 */
  const handleDelete = async (record: any) => {
    try {
      const res = await delServices(record.id);
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
      console.log("values", values);

      // 同步 logoUrl 到提交数据
      setLoading(true);
      setLogoUrl(""); // 清空上传状态，防止残留

      let res;
      if (currentRow?.id) {
        values.id = currentRow.id;
        res = await putServicesList(values);
      } else {
        res = await createServicesList(values);
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
    { title: "服务编码", dataIndex: "serviceCode" },
    { title: "服务类型", dataIndex: "serviceLevelDesc" },
    { title: "服务名", dataIndex: "serviceName" },
    {
      title: "样例",
      dataIndex: "sample",
      render: (sample: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={sample}
            alt="logo"
            style={{ width: 50, height: 50, objectFit: "contain" }}
          />
        </div>
      ),
    },
    { title: "服务描述", dataIndex: "serviceTypeDesc" },
    { title: "服务介绍", dataIndex: "introduction" },
    { title: "价格", dataIndex: "price" },
    { title: "是否可叠加", dataIndex: "stackedDesc" },

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
        onCancel={() => {
          setEditModalVisible(false);
          setLogoUrl(""); // 如果需要也可以清掉 logo
        }}
        onOk={handleSave}
        confirmLoading={loading}
        width={500}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="serviceCode"
            label="服务编码"
            rules={[{ required: true, message: "请输入服务编码" }]}
          >
            <Input placeholder="请输入服务编码" />
          </Form.Item>
          <Form.Item
            name="serviceName"
            label="服务名称"
            rules={[{ required: true, message: "请输入服务名称" }]}
          >
            <Input placeholder="请输入服务编码" />
          </Form.Item>
          <Form.Item
            name="serviceType"
            label="服务类型"
            rules={[{ required: true, message: "请选择服务类型" }]}
          >
            <Select
              placeholder="请选择服务类型"
              options={[
                {
                  label: "基本服务",
                  value: 1,
                },
                {
                  label: "增值服务",
                  value: 2,
                },
              ]}
              showSearch
              allowClear
            />
          </Form.Item>
          <Form.Item
            name="serviceLevel"
            label="服务级别"
            rules={[{ required: true, message: "请选择服务级别" }]}
          >
            <Select
              placeholder="请选择服务级别"
              options={[
                {
                  label: "订单服务",
                  value: 1,
                },
                {
                  label: "运单服务",
                  value: 2,
                },
              ]}
              showSearch
              allowClear
            />
          </Form.Item>
          <Form.Item name="introduction" label="服务介绍">
            <Input.TextArea rows={3} placeholder="请输入服务介绍" />
          </Form.Item>
          <Form.Item name="sample" label="服务示例">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Upload
                name="sample"
                showUploadList={false}
                customRequest={({ file }) => handleUpload({ file })}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    border: "1px dashed #ccc",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <PlusOutlined />
                </div>
              </Upload>

              {/* 预览 */}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="logo"
                  style={{
                    width: 100,
                    height: 100,
                    border: "1px solid #eee",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </Form.Item>
          <Form.Item
            name="price"
            label="服务费"
            rules={[{ required: true, message: "请输入服务费" }]}
          >
            <Input type="number" placeholder="请输入服务费" />
          </Form.Item>
          <Form.Item
            name="stacked"
            label="可否叠加服务"
            rules={[{ required: true, message: "请选择可否叠加服务" }]}
          >
            <Select
              placeholder="请选择可否叠加服务"
              options={[
                {
                  label: "可以",
                  value: 1,
                },
                {
                  label: "不可以",
                  value: 2,
                },
              ]}
              showSearch
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
