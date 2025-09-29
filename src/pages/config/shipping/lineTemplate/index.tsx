import {
  createShippingLineTemplate,
  delShippingLineTemplate,
  getShippingLineList,
  getShippingLineTemplateList,
  putShippingLineTemplate,
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
  const [billType, setBillType] = useState<string>();
  const [lineOptions, setLineOptions] = useState<any[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>(""); // 用 state 存 logo

  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();

  /** 拉取数据 */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getShippingLineTemplateList();
      const res1: any = await getShippingLineList();
      setDataSource(res.data);
      setLineOptions(res1.data);
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
      const res = await uploadShippingLineLogo(file as File);
      setLogoUrl(res.data); // 保存到 state
      form.setFieldsValue({ logoUrl: res.data }); // 同步到表单字段
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
    if (record.logoUrl) {
      setLogoUrl(record.logoUrl);
    } else {
      setLogoUrl("");
    }

    // 设置 billType
    if (record.billTypeCode) {
      setBillType(record.billTypeCode);
    }

    setEditModalVisible(true);
  };
  /** 删除 */
  const handleDelete = async (record: any) => {
    try {
      const res = await delShippingLineTemplate(record.id);
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

      // 同步 logoUrl 到提交数据
      values.logoUrl = logoUrl;
      setLoading(true);
      setLogoUrl(""); // 清空上传状态，防止残留

      let res;
      if (currentRow?.id) {
        values.id = currentRow.id;
        res = await putShippingLineTemplate(values);
      } else {
        res = await createShippingLineTemplate(values);
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
    // { title: "运费模板名", dataIndex: "logoUrl" },
    {
      title: "运费模板",
      dataIndex: "templateName",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {record.logoUrl ? (
            <img
              src={record.logoUrl}
              alt="logo"
              style={{ width: 50, height: 50, objectFit: "contain" }}
            />
          ) : null}
          <span>{record.templateName}</span>
        </div>
      ),
    },

    { title: "服务商", dataIndex: "serverName" },
    { title: "运输公司", dataIndex: "companyName" },
    { title: "路线名称", dataIndex: "lineName" },
    {
      title: "收费模式",
      dataIndex: "billType",
      render: (_: any, record: any) => {
        if (record.billTypeCode === "WEIGHT") {
          return (
            <div>
              <div>
                首重: {record.firstWeight} g / ￥{record.firstWeightFee}
              </div>
              <div>
                续重: {record.additionalWeight} g / ￥
                {record.additionalWeightFee}
              </div>
            </div>
          );
        }
        if (record.billTypeCode === "VOLUME") {
          return (
            <div>
              <div>
                首体积: {record.firstVolume} m³ / ￥{record.firstVolumeFee}
              </div>
              <div>
                续体积: {record.additionalVolume} m³ / ￥
                {record.additionalVolumeFee}
              </div>
            </div>
          );
        }
        if (record.billTypeCode === "VOLUME_WEIGHT") {
          return (
            <div>
              <div>
                首重: {record.firstWeight} g / ￥{record.firstWeightFee}
              </div>
              <div>
                续重: {record.additionalWeight} g / ￥
                {record.additionalWeightFee}
              </div>
              <div>体积重: {record.volumeWeightScale} kg</div>
            </div>
          );
        }
        return <span>-</span>;
      },
    },
    { title: "更新时间", dataIndex: "updateTime" },
    {
      title: "操作",
      valueType: "option",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            style={{ padding: 0 }}
          >
            修改
          </Button>
          <Popconfirm
            title="确认删除该服务商吗？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger style={{ padding: 0 }}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
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

      {/* 新增/修改 弹窗 */}
      <Modal
        title={currentRow ? "修改" : "新增"}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setBillType(undefined); // 关闭时清空收费类型
          setLogoUrl(""); // 如果需要也可以清掉 logo
        }}
        onOk={handleSave}
        confirmLoading={loading}
        width={500}
        destroyOnClose
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed, all) => {
            if (changed.billTypeCode) {
              setBillType(changed.billTypeCode);
            }
          }}
        >
          {/* 模板名称 */}
          <Form.Item
            name="templateName"
            label="模板名称"
            rules={[{ required: true, message: "请输入模板名称" }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          {/* 路线 ID 下拉 */}
          <Form.Item
            name="lineId"
            label="路线"
            rules={[{ required: true, message: "请选择路线" }]}
          >
            <Select
              placeholder="请选择路线"
              options={lineOptions.map((item: any) => ({
                label: item?.lineName, // 下拉显示服务商名称
                value: item.id, // 保存服务商代码
              }))}
              showSearch
              allowClear
            />
          </Form.Item>

          <Form.Item name="logoUrl" label="Logo">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Upload
                name="logo"
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

          {/* 收费类型 */}
          <Form.Item
            name="billTypeCode"
            label="收费类型"
            rules={[{ required: true, message: "请选择收费类型" }]}
          >
            <Select placeholder="请选择收费类型">
              <Select.Option value="WEIGHT">重量</Select.Option>
              <Select.Option value="VOLUME">体积</Select.Option>
              <Select.Option value="VOLUME_WEIGHT">体积重</Select.Option>
            </Select>
          </Form.Item>

          {/* 动态渲染重量 / 体积 */}
          {billType === "WEIGHT" && (
            <>
              <Form.Item
                name="firstWeight"
                label="首重 (g)"
                rules={[{ required: true, message: "请输入首重" }]}
              >
                <Input type="number" placeholder="请输入首重" />
              </Form.Item>
              <Form.Item
                name="firstWeightFee"
                label="首重费用 (¥)"
                rules={[{ required: true, message: "请输入首重费用" }]}
              >
                <Input type="number" placeholder="请输入首重费用" />
              </Form.Item>
              <Form.Item
                name="additionalWeight"
                label="续重 (g)"
                rules={[{ required: true, message: "请输入续重" }]}
              >
                <Input type="number" placeholder="请输入续重" />
              </Form.Item>
              <Form.Item
                name="additionalWeightFee"
                label="续重费用 (¥)"
                rules={[{ required: true, message: "请输入续重费用" }]}
              >
                <Input type="number" placeholder="请输入续重费用" />
              </Form.Item>
            </>
          )}

          {billType === "VOLUME" && (
            <>
              <Form.Item
                name="firstVolume"
                label="首体积 (m³)"
                rules={[{ required: true, message: "请输入首体积" }]}
              >
                <Input type="number" placeholder="请输入首体积" />
              </Form.Item>
              <Form.Item
                name="firstVolumeFee"
                label="首体积费用 (¥)"
                rules={[{ required: true, message: "请输入首体积费用" }]}
              >
                <Input type="number" placeholder="请输入首体积费用" />
              </Form.Item>
              <Form.Item
                name="additionalVolume"
                label="续体积 (m³)"
                rules={[{ required: true, message: "请输入续体积" }]}
              >
                <Input type="number" placeholder="请输入续体积" />
              </Form.Item>
              <Form.Item
                name="additionalVolumeFee"
                label="续体积费用 (¥)"
                rules={[{ required: true, message: "请输入续体积费用" }]}
              >
                <Input type="number" placeholder="请输入续体积费用" />
              </Form.Item>
            </>
          )}
          {billType === "VOLUME_WEIGHT" && (
            <>
              {/* 重量部分 */}
              <Form.Item
                name="firstWeight"
                label="首重 (g)"
                rules={[{ required: true, message: "请输入首重" }]}
              >
                <Input type="number" placeholder="请输入首重" />
              </Form.Item>
              <Form.Item
                name="firstWeightFee"
                label="首重费用 (¥)"
                rules={[{ required: true, message: "请输入首重费用" }]}
              >
                <Input type="number" placeholder="请输入首重费用" />
              </Form.Item>
              <Form.Item
                name="additionalWeight"
                label="续重 (g)"
                rules={[{ required: true, message: "请输入续重" }]}
              >
                <Input type="number" placeholder="请输入续重" />
              </Form.Item>
              <Form.Item
                name="additionalWeightFee"
                label="续重费用 (¥)"
                rules={[{ required: true, message: "请输入续重费用" }]}
              >
                <Input type="number" placeholder="请输入续重费用" />
              </Form.Item>

              {/* 新增体积重换算比例 */}
              <Form.Item
                name="volumeWeightScale"
                label="体积重换算比例 (cm³/kg)"
                rules={[{ required: true, message: "请输入体积重换算比例" }]}
              >
                <Input
                  type="number"
                  placeholder="例如 6000 (表示 6000 cm³ 按 1kg 计)"
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
