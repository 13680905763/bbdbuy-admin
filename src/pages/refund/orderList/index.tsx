import { getOrderRefundList, updateRefund } from "@/services/refund";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Tag,
  message,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

type OrderProductRow = {
  id: string;
  orderCode: string;
  customerName: string;
  callNo: string;
  totalFee: number;
  postFee: number;
  discountFee: number;
  customerPayStatusCode: number;
  createTime: string;
  remark?: string;
  orderRowSpan?: number;
  productTitle: string;
  sku: any;
  picUrl: any;
};

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<OrderProductRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();
  const [statusCode, setStatusCode] = useState<number>(2); // 默认固定值
  // 新增 state
  const [confirmLoading, setConfirmLoading] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    console.log(6666);

    try {
      const res: any = await getOrderRefundList({ page, pageSize });
      setDataSource(res.data.records);
      setTotal(res.data.total);
    } catch (e) {
      message.error("加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);
  console.log("dataSource", dataSource);

  const columns: ProColumns<OrderProductRow>[] = [
    {
      title: "退款单号",
      dataIndex: "refundCode",
    },
    {
      title: "订单号",
      dataIndex: "orderCode",
    },
    {
      title: "商品",
      dataIndex: "productTitle",
    },
    {
      title: "商品图片",
      dataIndex: "picUrl",
      key: "picUrl",
      width: 100,
      render: (picUrl: any, row: any) => {
        return <img src={row?.skuPicUrl || row?.picUrl} alt="" width={100} />;
      },
    },
    {
      title: "价格",
      dataIndex: "price",
    },
    {
      title: "sku",
      dataIndex: "propAndValue",
      key: "propAndValue",
      width: 200,
      render: (propAndValue: any) => {
        return propAndValue?.propName_valueName;
      },
    },

    {
      title: "数量",
      dataIndex: "quantity",
    },
    {
      title: "退款金额",
      dataIndex: "refundAmount",
    },

    {
      title: "状态",
      dataIndex: "status",
      render: (dom, record: any) => {
        const status = record.status;
        const statusCode = record.statusCode;
        let color: string = "default";

        switch (statusCode) {
          case 1: // 待审核
            color = "orange";
            break;
          case 2: // 处理中
            color = "blue";
            break;
          case 3: // 已退款
            color = "green";
            break;
          case 4: // 已驳回
            color = "red";
            break;
          default:
            color = "default";
        }

        return <Tag color={color}>{status}</Tag>;
      },
    },
    { title: "申请时间", dataIndex: "createTime" },
    {
      title: "审核时间",
      dataIndex: "updateTime",
      render: (dom, record: any) => {
        const statusCode = record.statusCode;
        const updateTime = record.updateTime;
        if (statusCode === 1) return "--";
        return updateTime;
      },
    },
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
            审核
          </Button>
        </div>
      ),
    },
  ];
  const handleEdit = (record: any) => {
    console.log("record", record);

    setCurrentRow(record);
    form.setFieldsValue({ ...record });
    setStatusCode(record.statusCode); // 默认固定值
    setEditModalVisible(true);
  };
  const handleSave = async () => {
    try {
      setConfirmLoading(true); // 🔹点击确定时显示 loading

      const values = await form.validateFields();
      console.log("values", values);

      const res = await updateRefund(values);
      console.log("res", res);

      if (res.success) {
        message.success("修改成功");
        setEditModalVisible(false);
        fetchData();
      } else {
        message.error(res.message || "修改失败");
      }
    } catch (e) {
      console.error(e);
      message.error("修改失败");
    } finally {
      setConfirmLoading(false); // 🔹无论成功失败都关闭 loading
    }
  };
  return (
    <PageContainer>
      <ProTable<OrderProductRow>
        bordered
        actionRef={actionRef}
        rowKey="id"
        // search={false}
        pagination={false} // ❗️我们自己控制分页
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        // rowSelection={{
        //   onChange: (_, selectedRows) => {
        //     // setSelectedRows(selectedRows);
        //   },
        // }}
      />
      <div style={{ padding: 16, textAlign: "right" }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger={true}
          onChange={(newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize); // 更新页大小
            // 发起请求，例如 fetchData(newPage, newSize)
          }}
        />
      </div>
      {/* 退款审核 */}
      <Modal
        title="退款审核"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={confirmLoading} // 🔹确认按钮 loading
        onOk={handleSave}
        width={500} // 🔹稍微加宽
      >
        <Form form={form} layout="vertical">
          {/* 隐藏字段 */}
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="refundCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="orderId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="orderCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="customerId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="来源" name="source" hidden>
            <Input />
          </Form.Item>
          {/* 只读展示字段 */}
          <Form.Item label="客户名" name="customerName">
            <Input disabled />
          </Form.Item>
          {/* 状态选择 */}
          <Form.Item
            label="状态"
            name="statusCode"
            rules={[{ required: true, message: "请选择状态" }]}
          >
            <Select
              options={[
                { label: "待审核", value: 1 }, //不显示数量和金额，只显示状态选择
                { label: "处理中", value: 2 },
                { label: "已退款", value: 3 }, //数量、金额必填
                { label: "已驳回", value: 4 },
              ]}
              onChange={(value) => {
                setStatusCode(value);
              }}
            />
          </Form.Item>
          {/* 备注：在“处理中”和“已驳回”状态下必填 */}
          {statusCode === 3 && (
            <>
              <Form.Item label="退款数量" name="quantity">
                <Input />
              </Form.Item>
              <Form.Item label="退款金额(元)" name="refundAmount">
                <Input />
              </Form.Item>
            </>
          )}
          {statusCode !== 1 && (
            <Form.Item
              label="备注"
              name="remark"
              rules={[{ message: "请输入备注" }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TableList;
