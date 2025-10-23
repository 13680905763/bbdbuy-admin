import { createCoupon, delCoupon, getCouponList, putCoupon } from "@/services";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
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
      const res: any = await getCouponList();
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
    const res = await delCoupon(record.id);
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
        res = await putCoupon(values);
      } else {
        // 新增
        res = await createCoupon(values);
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

  const columns = [
    { title: "标题", dataIndex: "title" },
    { title: "来源", dataIndex: "srcMsg" },
    { title: "优惠券类型", dataIndex: "typeMsg" },
    { title: "面额", dataIndex: "denomination" },
    { title: "折扣", dataIndex: "discount" },
    { title: "使用门槛", dataIndex: "thresholdAmount" },
    { title: "有效期", dataIndex: "expirationDate" },
    { title: "VIP等级", dataIndex: "vipLv" },
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
            新建优惠券
          </Button>,
        ]}
      />

      {/* 新增/修改 弹窗 */}
      <Modal
        title={currentRow ? "修改优惠券" : "新增优惠券"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
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
            if ("type" in changed) setCouponType(changed.type);
            if ("src" in changed) setSrcType(changed.src);
          }}
        >
          {/* 标题 */}
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="请输入优惠券标题" />
          </Form.Item>

          {/* 来源 */}
          <Form.Item
            name="src"
            label="来源"
            rules={[{ required: true, message: "请选择来源" }]}
          >
            <Select placeholder="请选择来源">
              <Select.Option value={1}>注册</Select.Option>
              <Select.Option value={2}>积分兑换</Select.Option>
            </Select>
          </Form.Item>

          {/* 类型 */}
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value={1}>面额</Select.Option>
              <Select.Option value={2}>折扣</Select.Option>
            </Select>
          </Form.Item>

          {/* 面额（类型=面额时必传） */}
          {couponType === 1 && (
            <Form.Item
              name="denomination"
              label="面额"
              rules={[{ required: true, message: "请输入面额" }]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                placeholder="请输入面额"
              />
            </Form.Item>
          )}

          {/* 折扣（类型=折扣时必传） */}
          {couponType === 2 && (
            <Form.Item
              name="discount"
              label="折扣"
              rules={[{ required: true, message: "请输入折扣" }]}
            >
              <InputNumber
                min={0.1}
                max={1}
                step={0.01}
                style={{ width: "100%" }}
                placeholder="0.1 ~ 1，例如 0.8 表示 8 折"
              />
            </Form.Item>
          )}

          {/* 使用门槛 */}
          <Form.Item
            name="thresholdAmount"
            label="使用门槛"
            rules={[{ required: true, message: "请输入使用门槛" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="请输入使用门槛"
            />
          </Form.Item>

          {/* 有效期（天） */}
          <Form.Item
            name="expirationDate"
            label="有效期（天）"
            rules={[{ required: true, message: "请输入有效期（天）" }]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="请输入有效期（天）"
            />
          </Form.Item>

          {/* VIP 等级（仅来源=注册时必传） */}
          {srcType === 1 && (
            <Form.Item
              name="vipLv"
              label="邀请人VIP等级"
              rules={[{ required: true, message: "请输入邀请人VIP等级" }]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                placeholder="请输入VIP等级"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
