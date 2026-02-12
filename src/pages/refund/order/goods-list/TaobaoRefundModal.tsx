import React, { useEffect, useState } from 'react';
import { Modal, Form, Radio, Input, InputNumber, Select, Image, message, Typography, Divider, Card } from 'antd';
import { applyTaobaoRefund, submitRefundApply } from '@/services/refund';

const { TextArea } = Input;
const { Text } = Typography;

interface TaobaoRefundModalProps {
  open: boolean;
  onCancel: () => void;
  onOk?: () => Promise<void>;
  data: any; // 包含 items 的记录
}

const TaobaoRefundModal: React.FC<TaobaoRefundModalProps> = ({
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

  const [refundFeeData, setRefundFeeData] = useState<any>({});

  // 计算建议的最大退款金额
  const maxRefundAmount = (() => {
    // 优先使用接口返回的最大退款金额
    if (refundFeeData?.max_refund_fee) {
      return Number(refundFeeData.max_refund_fee) / 100;
    }
    // 降级逻辑
    const price = item.refundFee || ((item.productPrice || item.price) * item.quantity);
    return Number(price) || 0;
  })();

  useEffect(() => {
    if (open) {
      form.resetFields();
      setRefundType(undefined);
      setGoodsStatus(undefined);
      setRefundFeeData({});
    }
  }, [open, data]);

  // 当 refundType 和 goodsStatus 都有值时，触发 fetchReasons
  useEffect(() => {
    if (refundType && goodsStatus) {
      fetchReasons();
    }
  }, [refundType, goodsStatus]);

  const fetchReasons = async () => {
    // 重新请求时清空之前选择的理由
    form.setFieldValue('reasonId', undefined);
    
    try {
      const res: any = await applyTaobaoRefund({
        id: item?.id,
        refundType: refundType,
        goodsStatus: goodsStatus
      });
      console.log('res', res);

      const reasons = res.data?.refund_order_template?.refund_reasons || [];
      const feeData = res.data?.refund_order_template?.max_refund_fee || {};

      setRefundFeeData(feeData);

      // 设置默认金额
      if (feeData?.refund_fee) {
        form.setFieldValue('refundFee', Number(feeData.refund_fee) / 100);
      }

      if (reasons && Array.isArray(reasons)) {
        setReasonOptions(reasons.map((item: any) => ({
          label: item.reason_desc,
          value: item.reason_id,
          tips: item.tips,
        })));
      }
    } catch (error) {
      console.error('获取退款原因失败', error);
    }
  };

  const handleTypeChange = (e: any) => {
    const val = e.target.value;
    setRefundType(val);
    // 如果选择了退货退款，货物状态通常默认为已收到货
    if (val === 2) {
      setGoodsStatus(4);
      form.setFieldsValue({ goodsStatus: 4 });
    } else {
      // 切换回仅退款时，清空货物状态，让用户重新选
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
        refundType: values.refundType,
        goodsStatus: values.goodsStatus,
        applyList: [{
          id: item.id,
          refundQty: item.quantity,
          refundFee: values.refundFee,
          refundShippingFee: 0, // 暂时写死，如果需要可以从 refundFeeData 或 item 中获取
          reasonId: values.reasonId,
          refundDesc: values.refundDesc,
        }]
      };
      // log("submitData", submitData);
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
      title="退款申请"
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
                  <Radio.Button disabled={refundType === 2} value={3} style={{ flex: 1, textAlign: 'center', height: 40, lineHeight: '40px' }}>未收到货</Radio.Button>
                  <Radio.Button value={4} style={{ flex: 1, textAlign: 'center', height: 40, lineHeight: '40px' }}>已收到货</Radio.Button>
                </div>
              </Radio.Group>
            </Form.Item>

            {refundType && goodsStatus && (
              <div style={{ marginTop: 16, animation: 'fadeIn 0.3s ease-in-out' }}>
                <Divider style={{ margin: '12px 0 24px 0' }} />

                <Form.Item label="退款原因" name="reasonId" rules={[{ required: true, message: '请选择退款原因' }]}>
                  <Select
                    placeholder="请选择退款原因"
                    options={reasonOptions}
                    size="large"
                    optionRender={(option: any) => (
                      <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                        <div>{option.label}</div>
                        {option.data.tips && <div style={{ fontSize: 12, color: '#999' }}>{option.data.tips}</div>}
                      </div>
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label="退款金额"
                  name="refundFee"
                  rules={[{ required: true, message: '请输入退款金额' }]}
                  extra={refundFeeData?.fee_tips || `最多可退 ¥${maxRefundAmount}`}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="¥"
                    max={maxRefundAmount}
                    precision={2}
                    size="large"
                    disabled={refundFeeData?.can_edit_refund_fee === "false"}
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

export default TaobaoRefundModal;
