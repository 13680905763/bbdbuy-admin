import { mkpurchase, mktaobaopy, mktaobaosd } from "@/services/mock";
import { PageContainer } from "@ant-design/pro-components";
import { Button, Card, Form, Input, message, Space } from "antd";
import React, { useState } from "react";

const { TextArea } = Input;

const TestDataGenerator: React.FC = () => {
  // 每个按钮的 loading 独立控制
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // 提交方法
  const handleSubmit = async (values: any, apiUrl: any, key: string) => {
    try {
      setLoading((prev) => ({ ...prev, [key]: true }));
      console.log("提交数据:", values);
      const res = await apiUrl(values);
      if (res.success) {
        message.success(res.msg);
      }
    } catch (error) {
      console.error(error);
      // message.error("请求失败");
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <PageContainer>
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 第一层 */}
        <Card title="模拟采购">
          <Form
            layout="inline"
            onFinish={(values) =>
              handleSubmit(
                {
                  orderCodeSet: values.orderCodeSet
                    .split(/[\n,]+/) // 按换行或逗号分隔
                    .map((v: string) => v.trim())
                    .filter((v: string) => v),
                  remark: values.remark,
                },
                mkpurchase,
                "purchase"
              )
            }
          >
            <Form.Item
              name="orderCodeSet"
              rules={[{ required: true, message: "请输入采购ID集合" }]}
            >
              <TextArea
                placeholder="请输入订单编号（每行一个或用逗号隔开）"
                rows={3}
                style={{ width: 300 }}
              />
            </Form.Item>
            <Form.Item name="remark">
              <Input placeholder="备注" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading.purchase}
              >
                采购
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 第二层 */}
        <Card title="模拟采购付款【淘宝】">
          <Form
            layout="inline"
            onFinish={(values) =>
              handleSubmit({ msgCode: "pay", ...values }, mktaobaopy, "pay")
            }
          >
            <Form.Item
              name="orderCode"
              rules={[{ required: true, message: "订单编号" }]}
            >
              <Input placeholder="请输入订单编号" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading.pay}>
                付款
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 第三层 */}
        <Card title="模拟卖家发货【淘宝】">
          <Form
            layout="inline"
            onFinish={(values) =>
              handleSubmit({ msgCode: "send", ...values }, mktaobaosd, "send")
            }
          >
            <Form.Item
              name="orderCode"
              rules={[{ required: true, message: "订单编号" }]}
            >
              <Input placeholder="请输入订单编号" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading.send}>
                发货
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </PageContainer>
  );
};

export default TestDataGenerator;
