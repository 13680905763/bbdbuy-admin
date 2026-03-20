import { PlusOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ActionType } from "@ant-design/pro-table";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Tabs,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

import {
  createPromotion,
  delPromotion,
  getPromotionList,
  putPromotion,
  getInviteBonusList,
  putInviteBonus,
  createInviteBonus,
  delInviteBonus,
} from "@/services";

const ConfigList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "EXPERIENCE" | "LEVEL" | "POINTS" | "VIP" | "INVITE"
  >("EXPERIENCE");
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null); // null 表示新建
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType | null>(null);

  const [inviteDataSource, setInviteDataSource] = useState<any>({});
  const [activeInviteTab, setActiveInviteTab] = useState("1"); // 默认选中第一个子 Tab

  /** 监听 activeInviteTab 变化 */
  useEffect(() => {
    if (activeTab === "INVITE" && inviteDataSource) {
      // 这里只是为了确保 Tab 切换时数据是最新的，如果需要重新请求可以在这里做
      // 目前 inviteDataSource 是一次性获取的，所以不需要重新请求
      // 但是如果在 Tab 2 新建了数据，然后切换到 Tab 1，再切回来，需要确保数据是最新的
      // 最好是在 handleDelete 和 handleSave 成功后重新调用 fetchData
      // fetchData 已经处理了 activeTab 为 INVITE 的情况
    }
  }, [activeInviteTab]);

  /** 拉取数据 */
  const fetchData = async (type: string) => {
    setLoading(true);
    try {
      let query: Record<string, any> = {};

      if (type === "EXPERIENCE" || type === "LEVEL") {
        query = {
          configCode: "LEVEL_BONUS",
          configType: "EXPERIENCE",
        };
      } else if (type === "POINTS") {
        query = {
          configType: "POINTS",
        };
      } else if (type === "VIP") {
        query = {
          configType: "VIP",
          configCode: "LEVEL",
        };
      }

      if (type === "INVITE") {
        const res: any = await getInviteBonusList();
        setInviteDataSource(res?.data || {});
      } else {
        const res: any = await getPromotionList(query);
        setDataSource(res?.data || []);
      }
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  /** 新建 */
  const handleAdd = () => {
    setCurrentRow(null);
    form.resetFields();
    if (activeTab === "INVITE") {
      form.setFieldsValue({ configType: "INVITE", type: Number(activeInviteTab) });
    } else {
      form.setFieldsValue({ configType: activeTab });
    }
    setEditModalVisible(true);
  };

  /** 修改 */
  const handleEdit = (record: any) => {
    setCurrentRow(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  /** 删除 */
  const handleDelete = async (record: any) => {
    setLoading(true);
    try {
      if (activeTab === "INVITE") {
        await delInviteBonus(record.id);
      } else {
        await delPromotion(record.id);
      }
      message.success("删除成功");
      fetchData(activeTab);
    } catch (e) {
      message.error("删除失败");
    } finally {
      setLoading(false);
    }
  };

  /** 保存（新增/修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (currentRow?.id) {
        values.id = currentRow.id;
      }
      setLoading(true);

      if (activeTab === "INVITE") {
        if (currentRow?.id) {
          // 修改
          await putInviteBonus(values);
        } else {
          // 新增
          await createInviteBonus(values);
        }
      } else {
        if (currentRow?.id) {
          // 修改
          await putPromotion(values);
        } else {
          // 新增
          await createPromotion(values);
        }
      }

      message.success(currentRow ? "修改成功" : "新建成功");
      setEditModalVisible(false);
      fetchData(activeTab);
    } catch (e) {
      console.error(e);
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };
  const columns = {
    EXPERIENCE: [
      { title: "范围最小值", dataIndex: "rangeMin" },
      { title: "范围最大值", dataIndex: "rangeMax" },
      { title: "经验等级编码", dataIndex: "rangeCode" },
      { title: "经验等级名称", dataIndex: "rangeName" },
      { title: "优先级", dataIndex: "priority" },
      { title: "描述", dataIndex: "description" },
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
    ],
    LEVEL: [
      { title: "配置值", dataIndex: "configValue" },
      { title: "经验等级编码", dataIndex: "rangeCode" },
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
    ],
    POINTS: [
      { title: "配置值", dataIndex: "configValue" },
      // { title: "范围最小值", dataIndex: "rangeMin" },
      // { title: "范围最大值", dataIndex: "rangeMax" },
      // { title: "会员等级编码", dataIndex: "rangeCode" },
      // { title: "会员等级名称", dataIndex: "rangeName" },
      // { title: "优先级", dataIndex: "priority" },
      { title: "描述", dataIndex: "description" },
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
    ],
    VIP: [
      { title: "范围最小值", dataIndex: "rangeMin" },
      { title: "范围最大值", dataIndex: "rangeMax" },
      { title: "等级编码", dataIndex: "rangeCode" },
      { title: "等级名称", dataIndex: "rangeName" },
      { title: "描述", dataIndex: "description" },
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
    ],
    INVITE: [
      { title: "等级", dataIndex: "vipLv" },
      { title: "邀请奖金", dataIndex: "inviteBonus" },
      { title: "转运奖金", dataIndex: "transferBonus" },
      { title: "商城奖金", dataIndex: "shopBonus" },
    ],
  };
  // /** 表格列 */
  // const columns: any[] = [
  //   // { title: "配置类型", dataIndex: "configType" },
  //   // { title: "配置编码", dataIndex: "configCode" },
  //   { title: "配置值", dataIndex: "configValue" },
  //   { title: "范围最小值", dataIndex: "rangeMin" },
  //   { title: "范围最大值", dataIndex: "rangeMax" },
  //   { title: "会员等级编码", dataIndex: "rangeCode" },
  //   { title: "会员等级名称", dataIndex: "rangeName" },
  //   { title: "优先级", dataIndex: "priority" },
  //   { title: "描述", dataIndex: "description" },
  //   {
  //     title: "操作",
  //     valueType: "option",
  //     render: (_: any, record: any) => [
  //       <Button
  //         type="link"
  //         style={{ color: "#1890ff", padding: 0 }}
  //         onClick={() => handleEdit(record)}
  //       >
  //         修改
  //       </Button>,
  //       <Popconfirm
  //         key="delete"
  //         title="确定要删除吗？"
  //         onConfirm={() => handleDelete(record)}
  //       >
  //         <a style={{ color: "#ff4d4f" }}>删除</a>
  //       </Popconfirm>,
  //     ],
  //   },
  // ];

  const inviteColumns: any = {
    "1": [
      { title: "活跃用户数", dataIndex: "activeUsersNum" },
      { title: "奖金（美元）", dataIndex: "bonus" },
      { title: "描述", dataIndex: "remark" },
      // { title: "创建时间", dataIndex: "createTime", valueType: "dateTime" },
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
    ],
    "2": [
      { title: "活跃用户数", dataIndex: "activeUsersNum" },
      { title: "奖金（美元）", dataIndex: "bonus" },
      { title: "免邮额度(kg)", dataIndex: "freeShipping" },
      { title: "描述", dataIndex: "remark" },
      // { title: "创建时间", dataIndex: "createTime", valueType: "dateTime" },
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
    ],
    "3": [
      { title: "活跃用户数", dataIndex: "activeUsersNum" },
      { title: "奖金（美元）", dataIndex: "bonus" },
      { title: "描述", dataIndex: "remark" },
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
    ],
  };

  const renderContent = () => {
    if (activeTab === "INVITE") {
      return (
        <>
          <Tabs
            activeKey={activeInviteTab}
            onChange={setActiveInviteTab}
            type="card"
            items={[
              { label: "每名活跃用户的现金奖励", key: "1" },
              { label: "BBDBuy 余额 + 包邮", key: "2" },
              { label: "月度工资奖金（固定奖金）", key: "3" },
            ]}
          />
          <ProTable
            size="small"
            options={{
              reload: false,
              fullScreen: true,
              density: false,
            }}
            bordered
            rowKey="id"
            search={false}
            pagination={false}
            dataSource={inviteDataSource[activeInviteTab] || []}
            loading={loading}
            columns={inviteColumns[activeInviteTab]}
            toolBarRender={() => [
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新建
              </Button>,
            ]}
          />
        </>
      );
    }

    return (
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
        columns={columns[activeTab]}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建
          </Button>,
        ]}
      />
    );
  };

  const renderInviteForm = () => {
    return (
      <>
        <Form.Item name="type" label="类型" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          name="activeUsersNum"
          label="活跃用户数"
          rules={[{ required: true, message: "请输入活跃用户数" }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item
          name="bonus"
          label="奖金（美元）"
          rules={[{ required: true, message: "请输入奖金" }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
        </Form.Item>
        {activeInviteTab === "2" && (
          <Form.Item
            name="freeShipping"
            label="免邮额度(kg)"
            rules={[{ required: false, message: "请输入免邮额度" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} step={0.1} />
          </Form.Item>
        )}
        <Form.Item name="remark" label="描述">
          <Input.TextArea rows={2} />
        </Form.Item>
      </>
    );
  };

  const renderCommonForm = () => {
    return (
      <>
        <Form.Item name="configType" label="配置类型">
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="configCode"
          label="配置编码"
          rules={[{ required: true, message: "请输入配置编码" }]}
        >
          <Input disabled={currentRow ? true : false} />
        </Form.Item>

        <Form.Item
          name="configValue"
          label="配置值"
          rules={[{ required: true, message: "请输入配置值" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="rangeMin" label="范围最小值">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="rangeMax" label="范围最大值">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="rangeCode" label="等级编码">
          <Input />
        </Form.Item>

        <Form.Item name="rangeName" label="等级名称">
          <Input />
        </Form.Item>

        <Form.Item name="priority" label="优先级">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} />
        </Form.Item>
      </>
    );
  };

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={[
          { label: "经验等级", key: "EXPERIENCE" },
          { label: "奖金配置", key: "LEVEL" },
          { label: "积分配置", key: "POINTS" },
          { label: "VIP配置", key: "VIP" },
          { label: "邀请奖金列表", key: "INVITE" },
        ]}
      />

      {renderContent()}

      <Modal
        title={currentRow ? "修改配置" : "新建配置"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        confirmLoading={loading}
        width={480}
        centered
      >
        <Form form={form} layout="vertical">
          {activeTab === "INVITE" ? renderInviteForm() : renderCommonForm()}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
