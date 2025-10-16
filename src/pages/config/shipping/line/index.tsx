import {
  createShippingLine,
  delShippingLine,
  getCountries,
  getGoodsType,
  getShippingCompanyList,
  getShippingLineList,
  getShippingServersList,
  putShippingLine,
} from "@/services";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Tag,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

const ConfigList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverOptions, setServerOptions] = useState<any[]>([]);
  const [companyOptions, setCompanyOptions] = useState<any[]>([]);
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [cargoCategoryOptions, setCargoCategoryOptions] = useState<any[]>([]);
  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [form] = Form.useForm();
  console.log(
    "currentRow",
    currentRow,
    currentRow?.countries?.map((c: any) => c.countryId)
  );

  /** 拉取数据 */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getShippingLineList();
      const res1: any = await getShippingServersList();
      const res2: any = await getShippingCompanyList();
      const res3: any = await getCountries();
      const res4: any = await getGoodsType();
      console.log("res3", res3);

      setDataSource(res.data);
      setServerOptions(res1.data);
      setCompanyOptions(res2.data);
      setCountryOptions(res3.data);
      setCargoCategoryOptions(res4.data);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** 新建 */
  const handleAdd = () => {
    setCurrentRow(null);
    form.resetFields();
    setEditModalVisible(true);
  };

  /** 修改 */
  const handleEdit = (record: any) => {
    console.log("record", record);

    setCurrentRow(record);
    form.setFieldsValue({
      ...record,
      countryIds: record.countries?.map((c: any) => c.countryId) || [],
    });
    setEditModalVisible(true);
  };

  /** 删除 */
  const handleDelete = async (record: any) => {
    try {
      const res = await delShippingLine(record.id);
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

  /** 保存（新增 / 修改） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      // if (currentRow?.countries.length) {
      //   values.countryIds = currentRow.countries;
      // }
      let res;
      if (currentRow?.id) {
        values.id = currentRow.id;
        res = await putShippingLine(values);
      } else {
        res = await createShippingLine(values);
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
    { title: "服务商名称", dataIndex: "serverName", width: 90 },
    { title: "服务商代码", dataIndex: "serverCode" },
    { title: "公司名", dataIndex: "companyName" },
    { title: "路线名", dataIndex: "lineName" },
    {
      title: "支持的国家",
      dataIndex: "countries",
      render: (countries: any[]) => {
        if (!countries || countries.length === 0) return "-";
        return (
          <>
            {countries.map((c) => (
              <Tag key={c.countryId}>{c.countryName}</Tag>
            ))}
          </>
        );
      },
    },
    {
      title: "货物类型",
      dataIndex: "cargoCategories",
      render: (cargoCategories: any) => {
        if (
          !cargoCategories ||
          cargoCategories.length === 0 ||
          cargoCategories == "-"
        ) {
          return "-";
        }
        return (
          <>
            {cargoCategories?.map((c: any) => (
              <Tag key={c.id}>{c.categoryName}</Tag>
            ))}
          </>
        );
      },
    },
    { title: "最快天数", dataIndex: "minDays" },
    { title: "最慢天数", dataIndex: "maxDays" },
    { title: "最小体积", dataIndex: "minVolume" },
    { title: "最大体积", dataIndex: "maxVolume" },
    { title: "最小重量", dataIndex: "minWeight" },
    { title: "最大重量", dataIndex: "maxWeight" },

    { title: "描述", dataIndex: "description" },
    { title: "更新时间", dataIndex: "updateTime" },
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
            修改
          </Button>
          <Popconfirm
            title="确认删除该路线吗？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger style={{ padding: 0 }}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable
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
      {/* 新增/修改 弹窗 */}
      <Modal
        title={currentRow ? "修改" : "新增"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        confirmLoading={loading}
        width={600}
        destroyOnClose
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item name="serverId" label="服务商">
            <Select
              placeholder="请选择服务商"
              options={serverOptions.map((item: any) => ({
                label: item?.serverName, // 下拉显示服务商名称
                value: item.id, // 保存服务商代码
              }))}
              showSearch
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="companyId"
            label="运输公司"
            rules={[{ required: true, message: "请输入运输公司" }]}
          >
            <Select
              placeholder="请选择运输公司"
              options={companyOptions.map((item: any) => ({
                label: item.companyName, // 下拉显示服务商名称
                value: item.id, // 保存服务商代码
              }))}
              showSearch
              allowClear
            />
          </Form.Item>

          <Form.Item name="lineName" label="路线名">
            <Input placeholder="请输入路线名" />
          </Form.Item>
          <Form.Item
            name="countryIds"
            label="支持的国家"
            rules={[{ required: true, message: "请选择支持的国家" }]}
            // initialValue={currentRow?.countries?.map((c: any) => c.countryId)}
          >
            <Select
              mode="multiple"
              placeholder="请选择支持的国家"
              allowClear
              options={countryOptions.map((item: any) => ({
                label: item.name,
                value: item.id,
              }))}
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
          <Form.Item
            name="cargoCategoryIds"
            label="货物类型"
            rules={[{ required: true, message: "请选择支持的货物类型" }]}
            // initialValue={currentRow?.countries?.map((c: any) => c.countryId)}
          >
            <Select
              mode="multiple"
              placeholder="请选择支持的货物类型"
              allowClear
              options={cargoCategoryOptions.map((item: any) => ({
                label: item.categoryName,
                value: item.id,
              }))}
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
          <Form.Item name="minDays" label="最快天数">
            <Input type="number" placeholder="请输入最快天数" />
          </Form.Item>

          <Form.Item name="maxDays" label="最慢天数">
            <Input type="number" placeholder="请输入最慢天数" />
          </Form.Item>

          <Form.Item name="minVolume" label="最小体积">
            <Input type="number" placeholder="请输入最小体积" />
          </Form.Item>

          <Form.Item name="maxVolume" label="最大体积">
            <Input type="number" placeholder="请输入最大体积" />
          </Form.Item>

          <Form.Item name="minWeight" label="最小重量">
            <Input type="number" placeholder="请输入最小重量" />
          </Form.Item>

          <Form.Item name="maxWeight" label="最大重量">
            <Input type="number" placeholder="请输入最大重量" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigList;
