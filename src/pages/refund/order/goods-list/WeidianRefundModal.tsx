import React, { useEffect, useState } from 'react';
import { Modal, Form, Radio, Input, InputNumber, Select, Image, message, Typography, Divider, Card } from 'antd';
import { submitRefundApply } from '@/services/refund';
import { log } from 'console';

const { TextArea } = Input;
const { Text } = Typography;

interface WeidianRefundModalProps {
  open: boolean;
  onCancel: () => void;
  onOk?: () => Promise<void>;
  data: any; // 包含 items 的记录
}

const WeidianRefundModal: React.FC<WeidianRefundModalProps> = ({
  open,
  onCancel,
  onOk,
  data,
}) => {
  const [form] = Form.useForm();
  const [reasonOptions, setReasonOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refundType, setRefundType] = useState<number | undefined>(undefined);
  const [goodsStatus, setGoodsStatus] = useState<number | undefined>(undefined);

  // 直接使用传入的 data 作为当前操作的 item
  const item = data || {};

  // 计算建议的最大退款金额
  const maxRefundAmount = (() => {
    const price = item.refundFee || ((item.productPrice || item.price) * item.quantity);
    return Number(price) || 0;
  })();

  // Hardcoded reasons for Weidian
  const WEIDIAN_REASONS = [
    { value: '1', label: '多拍/错拍/不想要/不喜欢', type: 'not_received' },
    { value: '2', label: '实物商品未收到货', type: 'not_received' },
    { value: '3', label: '漏发/错发/缺货', type: 'not_received' },
    { value: '4', label: '承诺未做到（未按约定时间发货）', type: 'not_received' },
    { value: '5', label: '空包裹', type: 'not_received' },
    { value: '6', label: '虚拟商品未收到货', type: 'not_received' },
    { value: '7', label: '商品故障/过期/变质等质量问题', type: 'received' },
    { value: '8', label: '规格样式/商品信息描述不符', type: 'received' },
    { value: '9', label: '材质/面料描述不符', type: 'received' },
    { value: '10', label: '承诺未做到', type: 'received' },
    { value: '11', label: '假货', type: 'received' },
    { value: '12', label: '包装/商品破损/污渍', type: 'received' },
    { value: '13', label: '漏发/错发', type: 'received' },
    { value: '14', label: '运费', type: 'received' },
  ];

  useEffect(() => {
    if (open) {
      form.resetFields();
      setRefundType(undefined);
      setGoodsStatus(undefined);
      // Set default refund fee
      form.setFieldsValue({ refundFee: maxRefundAmount });
    }
  }, [open, data]);

  // Update reason options based on goodsStatus
  useEffect(() => {
    // goodsStatus can be 0 (Not Received) or 1 (Received)
    if (goodsStatus !== undefined) {
      const isReceived = goodsStatus === 1;
      const filteredReasons = WEIDIAN_REASONS.filter(r => 
        isReceived ? r.type === 'received' : r.type === 'not_received'
      );
      setReasonOptions(filteredReasons);
      form.setFieldValue('reasonId', undefined);
    } else {
      setReasonOptions([]);
    }
  }, [goodsStatus]);

  const handleTypeChange = (e: any) => {
    const val = e.target.value;
    setRefundType(val);
    if (val === 2) {
      setGoodsStatus(1);
      form.setFieldsValue({ goodsStatus: 1 });
    } else {
      setGoodsStatus(undefined);
      form.setFieldsValue({ goodsStatus: undefined });
    }
  };

  const handleStatusChange = (e: any) => {
    setGoodsStatus(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const submitData = {
        applyList: [{
          id: item.id,
          refundQty: item.quantity,
          refundFee: values.refundFee,
          refundShippingFee: values.refundShippingFee, // 使用表单中的运费
          reasonId: values.reasonId,
          refundDesc: values.refundDesc,
          refundType: values.refundType,
          goodsStatus: values.goodsStatus,
        }]
      };
      log("submitData", submitData);
      const res: any = await submitRefundApply(submitData);
      if (res.success) {
        message.success('申请提交成功');
        onCancel();
        if (onOk) onOk();
      }
      setLoading(false);
    } catch (error) {
      console.error('Validate Failed:', error);
      setLoading(false);
    }
  };

  return (
    <Modal
      title="微店退款申请"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      centered
      okText="提交申请"
      cancelText="取消"
      bodyStyle={{ padding: '24px 24px 0 24px' }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
        <Card
          style={{ background: '#f9f9f9', marginBottom: 24 }}
        >
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 16 }}>退款商品</Text>
          </div>
          <div style={{
            display: 'flex',
            gap: 16,
            background: '#fff',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #f0f0f0'
          }}>
            <Image
              src={item.skuPicUrl || item.picUrl}
              width={70}
              height={70}
              style={{ borderRadius: 4 }}
              preview={false}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{item.productTitle}</div>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
                {item.propAndValue?.propName_valueName || "默认规格"}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">¥{item.productPrice || item.price}</Text>
                <Text type="secondary">x{item.quantity}</Text>
              </div>
            </div>
          </div>
        </Card>

        <Form
          form={form}
          layout="vertical"
          initialValues={{}}
          size="large"
        >
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

            <Form.Item label="货物状态" name="goodsStatus" rules={[{ required: true }]}>
              <Radio.Group  onChange={handleStatusChange} style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Radio.Button disabled={refundType === 2} value={0} style={{ flex: 1, textAlign: 'center', height: 40, lineHeight: '40px' }}>未收到货</Radio.Button>
                  <Radio.Button value={1} style={{ flex: 1, textAlign: 'center', height: 40, lineHeight: '40px' }}>已收到货</Radio.Button>
                </div>
              </Radio.Group>
            </Form.Item>

            {refundType && goodsStatus !== undefined && (
              <div style={{ marginTop: 16, animation: 'fadeIn 0.3s ease-in-out' }}>
                <Divider style={{ margin: '12px 0 24px 0' }} />

                <Form.Item label="退款原因" name="reasonId" rules={[{ required: true, message: '请选择退款原因' }]}>
                  <Select
                    placeholder="请选择退款原因"
                    options={reasonOptions}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="退款金额"
                  name="refundFee"
                  rules={[{ required: true, message: '请输入退款金额' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="¥"
                    precision={2}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="退款运费"
                  name="refundShippingFee"
                  rules={[{ required: true, message: '请输入退款运费' }]}
                  initialValue={0}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="¥"
                    precision={2}
                    size="large"
                    min={0}
                  />
                </Form.Item>

                <Form.Item label="退款说明" name="refundDesc">
                  <TextArea placeholder="退款说明（选填）" rows={4} maxLength={200} showCount />
                </Form.Item>
              </div>
            )}
          </Card>
        </Form>
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

export default WeidianRefundModal;
