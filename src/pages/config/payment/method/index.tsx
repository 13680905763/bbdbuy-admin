import { getPaymentList, putPaymentList } from "@/services";
import { renderStatusTag } from "@/utils/status-render";
import type { ActionType } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Space,
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

  // 分页
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(50);
  const [total, setTotal] = useState(0);

  /** ✅ fetchData 不依赖外部状态，只依赖参数 */
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
      const res: any = await getPaymentList(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };
  /** ✅ 初始化加载 */
  useEffect(() => {
    fetchData();
  }, []);
  /** ✅ 分页变化 */
  const handlePageChange = (page: number, pageSize?: number) => {
    console.log("分页", page, pageSize, { current: page, size: pageSize });

    setCurrent(page);
    setSize(pageSize || 10);
    fetchData({ current: page, size: pageSize });
  };

  /** 修改 */
  const handleEdit = (record: any) => {
    console.log("record", record);

    setCurrentRow(record);
    form.setFieldsValue(record);

    setEditModalVisible(true);
  };

  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("values", values);

      let res;
      values.id = currentRow.id;
      res = await putPaymentList(values);

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
      title: "排序",
      dataIndex: "sort",
      key: "sort",
      width: 80,
      sorter: (a: any, b: any) => a.sort - b.sort,
    },
    {
      title: "状态",
      dataIndex: "delFlag",
      key: "delFlag",
      width: 100,
      render: (value: any) => renderStatusTag("payment", value),
      // render: (text: any) => (
      //   <Tag color={!text ? "blue" : "red"}>{!text ? "启用" : "关闭"}</Tag>
      // ),
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

      {/* 新增/修改 弹窗 */}
      <Modal
        title={"修改"}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
        }}
        onOk={handleSave}
        confirmLoading={loading}
        width={500}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item name="delFlag" label="启用状态">
            <Select
              placeholder="请选择启用状态"
              options={[
                {
                  label: "启用",
                  value: false,
                },
                {
                  label: "关闭",
                  value: true,
                },
              ]}
            />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <Input type="number" placeholder="请输入排序" />
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
