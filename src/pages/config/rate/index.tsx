import { getRateList, putRate } from "@/services";
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

// 假设有更新和删除接口
async function updateConfig(data: any) {
  console.log("updateConfig params", data);
  return { success: true };
}
async function deleteConfig(id: number) {
  console.log("deleteConfig id", id);
  return { success: true };
}

const ConfigList: React.FC = () => {
  const [convertType, setConvertType] = useState<number>(2); // 默认固定值
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getRateList();
      setDataSource(res.data);
    } catch (e) {
      message.error("加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (record: any) => {
    setCurrentRow(record);
    form.setFieldsValue(record);
    setConvertType(record.convertType ?? 2); // 默认固定值
    setEditModalVisible(true);
  };

  const handleDelete = async (record: any) => {
    const res = await deleteConfig(record.id);
    if (res.success) {
      message.success("删除成功");
      fetchData();
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // 构造提交参数
      const payload: any = {
        id: currentRow.id,
        currency: currentRow.currency,
        convertType: values.convertType, // 1=百分比, 2=固定值
      };

      // 根据 convertType 决定提交字段
      if (values.convertType === 1) {
        payload.ratio = values.ratio;
      } else if (values.convertType === 2) {
        payload.rate = values.rate;
      }

      const res = await putRate(payload);

      if (res.success) {
        message.success("修改成功");
        setEditModalVisible(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
      message.error("修改失败");
    }
  };

  const columns = [
    {
      title: "货币代码",
      dataIndex: "currency",
    },
    {
      title: "符号",
      dataIndex: "symbol",
    },
    {
      title: "汇率类型",
      dataIndex: "convertType",
      render: (_: any, record: any) => {
        return record.convertType === 1 ? "百分比" : "固定值";
      },
    },

    {
      title: "百分比",
      dataIndex: "ratio",
    },
    {
      title: "汇率",
      dataIndex: "rate",
    },
    {
      title: "更新时间",
      dataIndex: "updateTime",
    },
    {
      title: "操作",
      valueType: "option",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="link"
            style={{ color: "#1890ff", padding: 0 }}
            onClick={() => handleEdit(record)}
          >
            修改
          </Button>

          <Popconfirm
            title="确认删除这条汇率吗？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            {/* <Button type="link" danger style={{ padding: 0 }}>
              删除
            </Button> */}
          </Popconfirm>
        </div>
      ),
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
      />

      <Modal
        title="修改汇率"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            convertType: 2, // 默认固定值
            rate: currentRow?.rate,
            ratio: currentRow?.ratio,
          }}
        >
          <Form.Item label="货币代码" name="currency">
            <Input disabled />
          </Form.Item>

          <Form.Item label="符号" name="symbol">
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="汇率类型"
            name="convertType"
            rules={[{ required: true, message: "请选择汇率类型" }]}
          >
            <Select
              options={[
                { label: "百分比", value: 1 },
                { label: "固定值", value: 2 },
              ]}
              value={convertType}
              onChange={(value) => {
                setConvertType(value);
                form.setFieldsValue({ rate: undefined, ratio: undefined });
              }}
            />
          </Form.Item>

          {convertType === 2 && (
            <Form.Item
              label="汇率值"
              name="rate"
              rules={[{ required: true, message: "请输入汇率值" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          )}

          {convertType === 1 && (
            <Form.Item
              label="百分比值"
              name="ratio"
              rules={[{ required: true, message: "请输入百分比值" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={1}
                step={0.0001}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
