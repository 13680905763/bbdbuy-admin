import {
  createServicesList,
  delServices,
  getServicesList,
  putServicesList,
  uploadShippingLineLogo,
} from "@/services";
import { CloseCircleFilled, PlusOutlined } from "@ant-design/icons";
import type { ActionType } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Form,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Upload,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

const ConfigList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<any>([]); // 用 state 存 logo

  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();

  // 分页
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
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
      const res: any = await getServicesList(query);
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
    setCurrent(page);
    setSize(pageSize || 10);
    fetchData({ current: page, size: pageSize });
  };
  const handleUpload = async ({ file }: any) => {
    try {
      const res: any = await uploadShippingLineLogo(file as File);
      setLogoUrl([...logoUrl, res.data]); // 保存到 state
      form.setFieldsValue({ sample: [...logoUrl, res.data] }); // 同步到表单字段
      message.success("上传成功");
    } catch (err) {
      message.error("上传失败");
    }
  };
  /** 新建 */
  const handleAdd = () => {
    setCurrentRow(null);
    form.resetFields();
    setEditModalVisible(true);
  };

  /** 修改 */
  const handleEdit = (record: any) => {
    setCurrentRow(record);
    form.setFieldsValue(record);
    console.log("[...logoUrl, record.sample]", [...logoUrl, ...record.sample]);

    // 如果 record 有 logoUrl，设置到 state 方便预览
    if (record.sample) {
      setLogoUrl([...logoUrl, ...record.sample]);
    } else {
      setLogoUrl([]);
    }

    setEditModalVisible(true);
  };
  /** 删除 */
  const handleDelete = async (record: any) => {
    try {
      const res = await delServices(record.id);
      if (res.success) {
        message.success("删除成功");
        fetchData();
      } else {
        message.error(res.message || "删除失败");
      }
    } catch (e) {
      message.error("删除失败");
    }
  };
  const handleRemove = (url: string) => {
    console.log(
      "logoUrl.filter((item) => item !== url)",
      logoUrl.filter((item: any) => item !== url)
    );

    setLogoUrl((prev: any) => prev.filter((item: any) => item !== url));
    form.setFieldsValue({
      sample: [...logoUrl.filter((item: any) => item !== url)],
    }); // 同步到表单字段
  };
  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("values", values);

      // 同步 logoUrl 到提交数据
      setLoading(true);
      setLogoUrl([]); // 清空上传状态，防止残留

      let res;
      if(values.chargeType === 1){
        values.ratio = 0;
      }else if(values.chargeType === 2){
        values.price = 0;
      }
      if (currentRow?.id) {
        values.id = currentRow.id;
        res = await putServicesList(values);
      } else {
        res = await createServicesList(values);
      }

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
    { title: "服务编码", dataIndex: "serviceCode" },
    { title: "服务类型", dataIndex: "serviceTypeDesc" },

    { title: "服务级别", dataIndex: "serviceLevelDesc" },
    { title: "服务名", dataIndex: "serviceName" },
    {
      title: "样例",
      dataIndex: "sample",
      render: (sample: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={sample}
            alt="logo"
            style={{ width: 50, height: 50, objectFit: "contain" }}
          />
        </div>
      ),
    },
    { title: "服务介绍", dataIndex: "introduction" },
    { title: "收费类型", dataIndex: "chargeType", render: (val: any) => val === 1 ? "固定费用" : val === 2 ? "比例收费" : "--" },
    { title: "服务费", dataIndex: "price" },
    { title: "收费比例", dataIndex: "ratio" },
    { title: "是否可叠加", dataIndex: "stackedDesc" },

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
            新建
          </Button>,
        ]}
      />

      {/* 新增/修改 弹窗 */}
      <Modal
        title={currentRow ? "修改" : "新增"}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setLogoUrl([]); // 如果需要也可以清掉 logo
        }}
        onOk={handleSave}
        confirmLoading={loading}
        width={500}
        centered
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="serviceCode"
            label="服务编码"
            rules={[{ required: true, message: "请输入服务编码" }]}
          >
            <Input placeholder="请输入服务编码" />
          </Form.Item>
          <Form.Item
            name="serviceName"
            label="服务名称"
            rules={[{ required: true, message: "请输入服务名称" }]}
          >
            <Input placeholder="请输入服务编码" />
          </Form.Item>
          <Form.Item
            name="serviceType"
            label="服务类型"
            rules={[{ required: true, message: "请选择服务类型" }]}
          >
            <Select
              placeholder="请选择服务类型"
              options={[
                {
                  label: "基本服务",
                  value: 1,
                },
                {
                  label: "增值服务",
                  value: 2,
                },
              ]}
              showSearch
              allowClear
            />
          </Form.Item>
          <Form.Item
            name="serviceLevel"
            label="服务级别"
            rules={[{ required: true, message: "请选择服务级别" }]}
          >
            <Select
              placeholder="请选择服务级别"
              options={[
                {
                  label: "商品级服务",
                  value: 1,
                },
                {
                  label: "包裹级服务",
                  value: 2,
                },
                {
                  label: "保险服务",
                  value: 3,
                },
              ]}
              showSearch
              allowClear
            />
          </Form.Item>
          <Form.Item name="introduction" label="服务介绍">
            <Input.TextArea rows={3} placeholder="请输入服务介绍" />
          </Form.Item>
          <Form.Item name="sample" label="服务示例" rules={[{ required: true, message: "请上传服务示例" }]}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Upload
                name="sample"
                showUploadList={false}
                customRequest={({ file }) => handleUpload({ file })}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    border: "1px dashed #ccc",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <PlusOutlined />
                </div>
              </Upload>

              {/* 图片预览 + 删除按钮 */}
              {logoUrl.length > 0 &&
                logoUrl.map((url: any) => (
                  <div
                    key={url}
                    style={{
                      position: "relative",
                      width: 100,
                      height: 100,
                    }}
                  >
                    <Image
                      src={url}
                      alt="logo"
                      width={100}
                      height={100}
                      style={{
                        border: "1px solid #eee",
                        objectFit: "contain",
                        borderRadius: 4,
                      }}
                    />
                    <CloseCircleFilled
                      onClick={() => handleRemove(url)}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        color: "#ff4d4f",
                        fontSize: 18,
                        cursor: "pointer",
                        background: "#fff",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                ))}
            </div>
          </Form.Item>
          <Form.Item
            name="chargeType"
            label="收费类型"
            rules={[{ required: true, message: "请选择收费类型" }]}
          >
            <Select
              placeholder="请选择收费类型"
              options={[
                {
                  label: "固定费用",
                  value: 1,
                },
                {
                  label: "比例收费",
                  value: 2,
                },
              ]}
              showSearch
              allowClear
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.chargeType !== currentValues.chargeType}
          >
            {({ getFieldValue }) => {
              const chargeType = getFieldValue("chargeType");
              if (chargeType === 1) {
                return (
                  <Form.Item
                    name="price"
                    label="服务费(单位：元)"
                    rules={[{ required: true, message: "请输入服务费" }]}
                  >
                    <Input type="number" placeholder="请输入服务费" />
                  </Form.Item>
                );
              }
              if (chargeType === 2) {
                return (
                  <Form.Item
                    name="ratio"
                    label="收费比例"
                    rules={[
                      { required: true, message: "请输入收费比例" },
                      {
                        validator: async (_, value) => {
                          if (value && Number(value) > 1) {
                            return Promise.reject(new Error("收费比例不能大于1"));
                          }
                          if (value && Number(value) < 0) {
                            return Promise.reject(new Error("收费比例不能小于0"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input type="number" step="0.01" max={1} min={0} placeholder="请输入收费比例(0-1)" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item
            name="stacked"
            label="可否叠加服务"
            rules={[{ required: true, message: "请选择可否叠加服务" }]}
          >
            <Select
              placeholder="请选择可否叠加服务"
              options={[
                {
                  label: "可以",
                  value: 1,
                },
                {
                  label: "不可以",
                  value: 2,
                },
              ]}
              showSearch
              allowClear
            />
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
