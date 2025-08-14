import { mkpurchase, mktaobaopy, mktaobaosd } from "@/services/mock";
import { PageContainer } from "@ant-design/pro-components";
import { Button, Card, Form, Input, Space, message } from "antd";
import React from "react";

const { TextArea } = Input;

const TestDataGenerator: React.FC = () => {
  // 每个层的提交方法
  const handleSubmit = async (values: any, apiUrl: any) => {
    try {
      console.log("提交数据:", values);
      const res = await apiUrl(values);
      console.log("返回数据:", res.data);
    } catch (error) {
      console.error(error);
      message.error("请求失败");
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
                mkpurchase
              )
            }
          >
            <Form.Item
              name="orderCodeSet"
              rules={[{ required: true, message: "请输入采购ID集合" }]}
            >
              <TextArea
                placeholder="请输入采购ID集合（每行一个或用逗号隔开）"
                rows={3}
                style={{ width: 300 }}
              />
            </Form.Item>
            <Form.Item
              name="remark"
              rules={[{ required: true, message: "请输入备注" }]}
            >
              <Input placeholder="备注" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
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
              handleSubmit({ msgCode: "pay", ...values }, mktaobaopy)
            }
          >
            <Form.Item
              name="orderCode"
              rules={[{ required: true, message: "请输入orderCode" }]}
            >
              <Input placeholder="orderCode" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
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
              handleSubmit({ msgCode: "send", ...values }, mktaobaosd)
            }
          >
            <Form.Item
              name="orderCode"
              rules={[{ required: true, message: "请输入orderCode" }]}
            >
              <Input placeholder="orderCode" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
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
