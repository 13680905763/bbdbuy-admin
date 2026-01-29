import { getGoodsType } from "@/services";
import { getInspectionListByPage, putInspection } from "@/services/order"; // 你自己的接口路径
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  message,
} from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
const { RangePicker } = DatePicker;
const inspectionStatusOptions = [
  { value: "1032", label: "验货正常" },
  { value: "1033", label: "验货异常" },
];

const abnormalOptions = [
  { value: "10331", label: "破损" },
  { value: "10332", label: "质量问题" },
  { value: "10333", label: "少发" },
  { value: "10334", label: "错发" },
  { value: "10335", label: "少买" },
  { value: "10336", label: "错买" },
  { value: "10337", label: "多发" },
  { value: "10338", label: "多买" },
];
const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [inspectionStatus, setInspectionStatus] = useState<any>(null);
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: string | number }[]
  >([]);
  const [form] = Form.useForm();
  // 1️⃣ 初始化商品类型
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await getGoodsType();
        const options = res.data.map((item: any) => ({
          label: item.categoryName,
          value: item.id,
          isDefault: item.defaultCategory === 1 ? true : false, // 标记是否默认
        }));
        setCategoryOptions(options);
      } catch (err) {
        message.error("加载商品类型失败");
      }
    };

    fetchCategories();
  }, []);
  /** ✅ fetchData 不依赖外部状态，只依赖参数 */
  const fetchData = async (params?: any) => {
    const query = {
      current,
      size,
      ...params,
    };
    console.log("fetchData -> query", query);

    setLoading(true);
    try {
      const res: any = await getInspectionListByPage(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<any>[] = [
    {
      title: "订单号",
      dataIndex: "orderCode",
    },
    {
      title: "快递单号",
      dataIndex: "logisticsCode",
    },
    {
      title: "包裹单号",
      dataIndex: "packageCode",
    },

    {
      title: "商品名称",
      dataIndex: "orderProduct",
      hideInSearch: true,
      width: 300,
      render: (orderProduct: any) => {
        return (
          <div style={{ display: "flex", gap: 12, padding: "8px 0" }}>
            {/* 左侧图片 */}
            <Image
              width={90}
              height={90}
              src={orderProduct?.skuPicUrl || orderProduct?.picUrl}
              alt={orderProduct?.productTitle || "商品图片"}
              preview={orderProduct?.picUrl}
              style={{ objectFit: "cover", borderRadius: 4 }}
              referrerPolicy="no-referrer"
            />
            {/* 右侧内容 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* 商品标题 */}
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: "#333",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {orderProduct.productTitle}
              </div>

              {/* 属性 */}
              {orderProduct.propAndValue?.propName_valueName && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#999",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {orderProduct.propAndValue.propName_valueName}
                </div>
              )}

              {/* 价格与数量 */}
              <div style={{ fontSize: 14, color: "#e60012", marginTop: 2 }}>
                ￥{orderProduct.price} × {orderProduct.quantity}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "商品类型",
      dataIndex: "packageItem.categoryName",
      width: 300,
      hideInSearch: true,
      render: (_: any, record: any) => {
        return <div>{record?.packageItem?.categoryName}</div>;
      },
    },
    {
      title: "用户名",
      dataIndex: "customerName",
      hideInSearch: true,
      width: 100,
    },
    {
      title: "验货详情",
      dataIndex: "packageItem.id",
      width: 400,
      hideInSearch: true,
      render: (_: any, record: any) => {
        return (
          <div style={{ fontSize: 13, color: "#555", lineHeight: "20px" }}>
            <div>
              尺寸：{record?.packageItem?.length} x {record?.packageItem?.width}{" "}
              x {record?.packageItem?.height} cm
            </div>
            <div>体积：{record?.packageItem?.volume} cm³</div>
            <div>重量：{record?.packageItem?.weight} g</div>
            <div>数量：{record?.packageItem?.quantity}</div>
          </div>
        );
      },
    },

    {
      title: "验货状态",
      dataIndex: "inspectionStatus",
      render: (_, record: any) => {
        const { inspectionStatus, abnormalMsg, inspectionStatusCode } = record;
        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div>
              {renderStatusTag("inspection", inspectionStatusCode)}
              {inspectionStatus === "验货异常" && abnormalMsg && (
                <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
                  异常原因：{abnormalMsg}
                </div>
              )}
            </div>
          </div>
        );
      },
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择验货状态"
            allowClear
            options={getStatusOptions("inspection")}
          />
        );
      },
    },
    {
      title: "验货人",
      dataIndex: "userName",
      width: 100,
      hideInSearch: true,
      render: (userName, records: any) => {
        if (records?.inspectionStatus === "待验货") {
          return "-";
        }
        return userName;
      },
    },

    {
      title: "验货时间",
      dataIndex: "updateTime",
      valueType: "dateTimeRange",
      width: 200,
      render: (_, records: any) => {
        if (records?.inspectionStatus === "待验货") {
          return "-";
        }
        return records?.updateTime;
      },
      renderFormItem: () => (
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "操作",
      valueType: "option",
      render: (_: any, records: any) => {
        if (records?.inspectionStatus === "待验货") {
          return "-";
        }
        return (
          <Button
            type="link"
            style={{ color: "#1890ff", padding: 0 }}
            onClick={() => {
              setEditingRecord(records);

              setInspectionStatus(records?.inspectionStatusCode);
              form.setFieldsValue({
                ...records,
                length: records.packageItem?.length || 0,
                width: records.packageItem?.width || 0,
                height: records.packageItem?.height || 0,
                weight: records.packageItem?.weight || 0,
                quantity: records.packageItem?.quantity || 0,
                categoryId: records.packageItem?.categoryId || 0,
              });
              setModalVisible(true);
            }}
          >
            修改
          </Button>
        );
      },
    },
  ];

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);

    const [startTime, endTime] = values.updateTime || [];
    const filterParams = {
      orderCode: values.orderCode,
      logisticsCode: values.logisticsCode,
      packageCode: values.packageCode,
      inspectionStatusCode: values.inspectionStatus,
      updateTimeFrom: startTime
        ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      updateTimeTo: endTime
        ? moment(endTime).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
    };
    setFilters(filterParams);
    setCurrent(1);
    fetchData({ current: 1, ...filterParams });
  };

  /** ✅ 分页变化 */
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrent(page);
    setSize(pageSize || 10);
    fetchData({ current: page, size: pageSize, ...filters });
  };

  /** ✅ 重置搜索 */
  const handleReset = () => {
    setFilters({});
    setCurrent(1);
    formRef.current?.resetFields();
    // 清空URL参数
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);

    fetchData({ current: 1 });
  };

  /** ✅ 初始化加载 */
  useEffect(() => {
    // 获取 URL 参数
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get("orderCode");
    const logisticsCode = urlParams.get("logisticsCode");
    const packageCode = urlParams.get("packageCode");



    if (orderCode) {
      // 如果有 orderCode，设置 filters 并搜索
      const initialFilters = { orderCode };
      setFilters(initialFilters);
      formRef.current?.setFieldsValue(initialFilters);
      fetchData({ current: 1, ...initialFilters });
    } else if (logisticsCode) {
      // 如果有 logisticsCode，设置 filters 并搜索
      const initialFilters = { logisticsCode };
      setFilters(initialFilters);
      formRef.current?.setFieldsValue(initialFilters);
      fetchData({ current: 1, ...initialFilters });
    } else if (packageCode) {
      // 如果有 packageCode，设置 filters 并搜索
      const initialFilters = { packageCode };
      setFilters(initialFilters);
      formRef.current?.setFieldsValue(initialFilters);
      fetchData({ current: 1, ...initialFilters });
    } else {
      // 否则正常加载
      fetchData();
    }
  }, []);
  /** ✅ 保存修改 */
  const handleModalOk = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      values.id = editingRecord?.id;
      values.logisticsCode = editingRecord?.logisticsCode;

      console.log("values", values);

      await putInspection(values);
      message.success("修改成功");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setModalVisible(false);
      fetchData({ current, size, ...filters });
    }
  };

  return (
    <PageContainer>
      <ProTable
        formRef={formRef}
        size="small"
        bordered
        actionRef={actionRef}
        rowKey="id"
        pagination={false} // ❗️我们自己控制分页
        dataSource={dataSource}
        loading={loading}
        columns={columns}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        search={{
          labelWidth: "auto",
          defaultCollapsed: false, // ❗ 默认展开
        }}
        options={{
          reload: false,
          fullScreen: true,
          density: false,
        }}
      />
      <div style={{ padding: 16, textAlign: "right" }}>
        <Pagination
          current={current}
          pageSize={size}
          total={total}
          showSizeChanger
          onChange={handlePageChange}
        />
      </div>
      <Modal
        title="修改"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
        width={500}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="验货状态"
            name="inspectionStatusCode"
            rules={[{ required: true }]}
          >
            <Select
              options={inspectionStatusOptions}
              onChange={(value) => {
                setInspectionStatus(value);
              }}
            />
          </Form.Item>

          {/* 动态渲染 */}
          <Form.Item
            shouldUpdate={(prev, curr) =>
              prev.inspectionStatus !== curr.inspectionStatus
            }
          >
            {() => {
              if (inspectionStatus == 1032) {
                return (
                  <>
                    <div style={{ display: "flex", gap: 16 }}>
                      <Form.Item label="长（cm）" name="length">
                        <Input type="number" min={0} />
                      </Form.Item>
                      <Form.Item label="宽（cm）" name="width">
                        <Input type="number" min={0} />
                      </Form.Item>
                      <Form.Item label="高（cm）" name="height">
                        <Input type="number" min={0} />
                      </Form.Item>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <Form.Item label="重量（g）" name="weight">
                        <Input type="number" min={0} />
                      </Form.Item>
                      <Form.Item label="数量" name="quantity">
                        <Input type="number" min={0} />
                      </Form.Item>
                    </div>
                    <Form.Item label="商品类型" name="categoryId">
                      <Select
                        // value={record.categoryId}
                        // style={{ width: 120 }}
                        // onChange={(newValue) => {
                        //   setTableData((prev) => {
                        //     const updated = [...prev];
                        //     updated[index].categoryId = newValue;
                        //     return updated;
                        //   });
                        // }}
                        options={categoryOptions}
                      />
                    </Form.Item>
                  </>
                );
              }
              if (inspectionStatus == 1033) {
                return (
                  <Form.Item
                    label="异常原因"
                    name="abnormalCode"
                    rules={[{ required: true }]}
                  >
                    <Select options={abnormalOptions} />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TableList;
