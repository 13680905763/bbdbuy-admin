import React, { useEffect, useState } from 'react';
import { Modal, Form, Radio, Input, InputNumber, Select, Image, message, Typography, Space, Divider, Button, Card, Row, Col, Table } from 'antd';
import { apply1688Refund, get1688GoodsStatus, submitRefundApply } from '@/services/refund';
import { log } from 'console';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface A1688RefundModalProps {
  open: boolean;
  onCancel: () => void;
  onOk?: (values: any) => Promise<void>;
  data: any; // Order record
}

const A1688RefundModal: React.FC<A1688RefundModalProps> = ({
  open,
  onCancel,
  onOk,
  data,
}) => {
  const [form] = Form.useForm();
  const [reasonOptions, setReasonOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refundType, setRefundType] = useState<number | undefined>(undefined);
  const [goodsStatusOptions, setGoodsStatusOptions] = useState<any[]>([]);
  const [renderItemList, setRenderItemList] = useState<any[]>([]);

  // data is the order record
  const order = data || {};
  const items = order.returnGoodsList || [];

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setRefundType(undefined);
      setStep(1);
      setSelectedRowKeys([]);
      setSelectedItems([]);
      setReasonOptions([]);
    }
  }, [open, data]);

  const fetchGoodsStatus = async () => {
    try {
      const idList = selectedItems.map((i: any) => i.id);
      const res: any = await get1688GoodsStatus({ idList });
      if (res.data && Array.isArray(res.data)) {
        setGoodsStatusOptions(
          res.data.map((item: any) => ({
            label: item.goodsStatus,
            value: item.goodsStatusCode,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch goods status", error);
    }
  };

  const fetchReasons = async (status: string) => {
    try {
      const idList = selectedItems.map((i: any) => i.id);

      const res: any = await apply1688Refund({
        goodsStatusCode: status,
        idList: idList,
      });

      if (res.data) {
        if (Array.isArray(res.data.reasonList)) {
          setReasonOptions(
            res.data.reasonList.map((item: any) => ({
              label: item.name,
              value: item.id,
            }))
          );
        }

        if (Array.isArray(res.data.renderItemList)) {
          setRenderItemList(res.data.renderItemList);
        }

        if (res.data.totalRefundFee !== undefined) {
          const fee = Number(res.data.totalRefundFee);
          form.setFieldsValue({ refundFee: fee });
        }
      }
    } catch (error) {
      console.error("Failed to fetch refund reasons", error);
    }
  };

  const handleNextStep = async () => {
    if (selectedItems.length === 0) {
      message.error("请至少选择一个商品");
      return;
    }

    if (refundType === 1) {
      // 仅退款：获取货物状态
      await fetchGoodsStatus();
    } else {
      // 退货退款：不需要选择货物状态，直接获取原因
      fetchReasons('');
    }

    setStep(2);
    // 计算选中商品的最大退款金额
    const totalAmount = selectedItems.reduce((acc, item) => {
      const price =
        item.refundFee || (item.productPrice || item.price) * item.quantity;
      return acc + (Number(price) || 0);
    }, 0);
    form.setFieldsValue({ refundFee: totalAmount });
  };

  const handleTypeChange = (e: any) => {
    const val = e.target.value;
    setRefundType(val);
    // 第一步不触发接口请求，只记录类型
    // 清空 goodsStatus，因为类型变了，后续可选的状态也可能变（虽然UI上没限制，但逻辑上）
    form.setFieldsValue({ goodsStatus: undefined });
  };

  const handleStatusChange = (e: any) => {
    const val = e.target.value;

    fetchReasons(val);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const submitData = {
        applyList: selectedItems.map((item) => {
          // 从 renderItemList 中找到对应的商品退款金额
          // 注意：renderItemList 中的 id 可能是 1688 的子订单 ID，而 item.id 是我们系统的子订单 ID。
          // 假设它们是匹配的，或者通过其他字段匹配。
          // 根据示例，renderItemList 中的 id 看起来很长，像是 1688 的 ID。
          // 我们的 item.id 也是长整型吗？
          // 暂时假设 ID 可以匹配。如果不匹配，可能需要通过 sourceOrderId 或其他字段。

          // 在 fetchReasons 时，我们传了 idList，后端应该返回对应这些 id 的 renderItemList。
          // 我们可以尝试通过 id 匹配。
          const renderItem = renderItemList.find(
            (r: any) => String(r.id) === String(item.id) || String(r.id) === String(item.sourceOrderId)
          );

          const fee = renderItem ? Number(renderItem.refundFee) / 100 : 0;

          return {
            id: item.id,
            refundQty: item.quantity,
            refundFee: fee,
            refundShippingFee: 0,
            reasonId: values.reasonId,
            refundDesc: values.refundDesc,
            goodsStatus: refundType === 2 ? "" : values.goodsStatus,
            refundType: refundType,
          };
        }),
      };
      log("submitData", submitData);
      const res: any = await submitRefundApply(submitData);
      if (res.success) {
        message.success('申请提交成功');
        onCancel();
        if (onOk) onOk(values);
      }
      setLoading(false);
    } catch (error) {
      console.error('Validate Failed:', error);
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '商品信息',
      dataIndex: 'productTitle',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', gap: 10 }}>
          <Image src={record.skuPicUrl || record.picUrl} referrerPolicy="no-referrer" width={50} height={50} style={{ borderRadius: 4 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.propAndValue?.propName_valueName || "默认规格"}</div>
          </div>
        </div>
      )
    },
    {
      title: '单价',
      dataIndex: 'price',
      width: 80,
      render: (text: any, record: any) => `¥${record.productPrice || record.price}`
    },
    {
      title: '可退数量',
      dataIndex: 'quantity',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '本次申请数量',
      width: 120,
      render: (_: any, record: any) => (
        <InputNumber
          min={1}
          max={record.quantity}
          defaultValue={record.quantity}
          onChange={(val) => {
            const newItems = selectedItems.map(item =>
              item.id === record.id ? { ...item, quantity: val } : item
            );
            setSelectedItems(newItems);
          }}
          disabled={!selectedRowKeys.includes(record.id)}
        />
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: any[]) => {
      setSelectedRowKeys(keys);
      // 保留已修改的数量
      const newSelectedItems = rows.map(row => {
        const existing = selectedItems.find(i => i.id === row.id);
        return existing || { ...row, quantity: row.quantity }; // 默认全选
      });
      setSelectedItems(newSelectedItems);
    }
  };

  return (
    <Modal
      title="1688退款申请"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {step === 1 ? (
          <>
            <Form form={form} layout="vertical">
              <Card bordered={false} bodyStyle={{ padding: 0 }}>
                <Form.Item label="退款类型" name="refundType" rules={[{ required: true }]}>
                  <Radio.Group onChange={handleTypeChange} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <Radio.Button value={1} style={{ flex: 1, textAlign: 'center', height: 'auto', padding: '12px 0' }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>仅退款</div>
                        <div style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>未收到货, 或协商同意前提下</div>
                      </Radio.Button>
                      <Radio.Button value={2} style={{ flex: 1, textAlign: 'center', height: 'auto', padding: '12px 0' }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>退货退款</div>
                        <div style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>已收到货, 需要退换已收到的货物</div>
                      </Radio.Button>
                    </div>
                  </Radio.Group>
                </Form.Item>
              </Card>
            </Form>

            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 12, fontWeight: 500 }}>选择退款商品</div>
              <Table
                rowKey="id"
                rowSelection={rowSelection}
                columns={columns}
                dataSource={items}
                pagination={false}
                size="small"
                bordered
              />
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={onCancel}>取消</Button>
                <Button type="primary" onClick={handleNextStep} disabled={!refundType || selectedRowKeys.length === 0}>
                  下一步
                </Button>
              </Space>
            </div>
          </>
        ) : (
          <Form form={form} layout="vertical">
            <Button type="link" onClick={() => setStep(1)} style={{ paddingLeft: 0, marginBottom: 16 }}>
              &lt; 返回上一步
            </Button>

            <Card style={{ background: '#f9f9f9', marginBottom: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <Text strong>已选退款商品 (共 {selectedItems.length} 件)</Text>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {selectedItems.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 8, padding: 8, background: '#fff', borderRadius: 4 }}>
                    <Image referrerPolicy="no-referrer" src={item.skuPicUrl || item.picUrl} width={40} height={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12 }}>{item.productTitle}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 12 }}>
                        <span>¥{item.productPrice || item.price}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {refundType === 1 && (
              <Form.Item
                label="货物状态"
                name="goodsStatus"
                rules={[{ required: true, message: "请选择货物状态" }]}
              >
                <Radio.Group onChange={handleStatusChange} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {goodsStatusOptions.map(option => (
                      <Radio.Button
                        key={option.value}
                        value={option.value}
                        style={{ flex: 1, textAlign: 'center', height: 40, lineHeight: '40px' }}
                      >
                        {option.label}
                      </Radio.Button>
                    ))}
                  </div>
                </Radio.Group>
              </Form.Item>
            )}

            <Form.Item label="退款原因" name="reasonId" rules={[{ required: true, message: '请选择退款原因' }]}>
              <Select placeholder="请选择退款原因" options={reasonOptions} size="large" />
            </Form.Item>

            <Form.Item
              label="退款金额"
              name="refundFee"
              rules={[{ required: true, message: '请输入退款金额' }]}
            // extra={`最多可退 ¥${maxRefundAmount}`}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="¥"
                precision={2}
                size="large"
              />
            </Form.Item>

            <Form.Item label="退款说明" name="refundDesc">
              <TextArea placeholder="退款说明（选填）" rows={4} maxLength={200} showCount />
            </Form.Item>

            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Space>
                <Button onClick={onCancel}>取消</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  提交申请
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Modal>
  );
};

export default A1688RefundModal;
