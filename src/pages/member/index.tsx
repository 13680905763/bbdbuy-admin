import { getCouponList } from "@/services";
import { disguiseMember, distributionCoupons, getMemberList, topUpMember, updateMember } from "@/services/member";
import { closeOrder, getOrderListByPage } from "@/services/order"; // 你的接口路径
import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormList,
  ProFormGroup,
  ProTable,
} from "@ant-design/pro-components";
import {
  AutoComplete,
  Button,
  DatePicker,
  Image,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";

const { RangePicker } = DatePicker;

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [dataSource, setDataSource] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]); // ✅ 展开行控制
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);


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
      const res: any = await getMemberList(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  // // ✅ 切换展开状态
  // const handleExpand = (record: any) => {
  //   setExpandedRowKeys((prev) =>
  //     prev.includes(record.id)
  //       ? prev.filter((k) => k !== record.id)
  //       : [...prev, record.id]
  //   );
  // };
  // /** 操作 */
  // const handleClose = (record: any) => {
  //   let reasonCode = ""; // 默认原因

  //   Modal.confirm({
  //     title: "关闭订单",
  //     content: (
  //       <div style={{ marginTop: 12 }}>
  //         <div style={{ marginBottom: 8 }}>确认关闭订单吗？</div>
  //         <Select
  //           style={{ width: "100%" }}
  //           placeholder="请选择关闭原因"
  //           defaultValue={reasonCode}
  //           onChange={(value) => {
  //             reasonCode = value;
  //           }}
  //           options={[
  //             { value: "INSUFFICIENT_STOCK", label: "库存不足" },
  //             { value: "EXPIRED_GOODS", label: "失效商品" },
  //             { value: "SCAM", label: "骗货" },
  //             { value: "BLACKLIST", label: "黑名单" },
  //             { value: "FALSE_SHIPMENT", label: "虚假发货" },
  //             { value: "OTHER", label: "其他" },
  //           ]}
  //         />

  //       </div>
  //     ),
  //     okButtonProps: {
  //       type: "primary",
  //       style: {
  //         backgroundColor: "#f0700c",
  //         borderColor: "#f0700c",
  //       },
  //     },
  //     onOk: async () => {
  //       const res = await closeOrder(record.id, reasonCode);
  //       if (res.success) {
  //         message.success("关闭成功");
  //         fetchData();
  //       }
  //     }, // ✅ 确认后继续
  //   });
  // };
  const columns: ProColumns<any>[] = [
    {
      title: "头像",
      dataIndex: "avatarUrl",
      search: false,
      render: (_, record) => (
        <Image
          src={
            record.avatarUrl ||
            "https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png"
          }
          width={40}
          height={40}
          style={{ objectFit: "cover" }}
        />
      ),
    },
    { title: "姓名", dataIndex: "name" },
    { title: "昵称", dataIndex: "nickName" },
    { title: "电话", dataIndex: "mobile", search: false },
    { title: "邮箱", dataIndex: "email" },
    {
      title: "余额",
      dataIndex: "balance",
      search: false,
      valueType: "money",
    },
    { title: "VIP等级", dataIndex: "vipLv", search: false },
    { title: "积分", dataIndex: "myPoints", search: false },
    { title: "邀请码", dataIndex: "inviteCode", search: false },
    { title: "邀请数量", dataIndex: "inviteCount", search: false },

    {
      title: "注册时间",
      dataIndex: "createTime",
      valueType: "dateTime",
      search: false,
    },
    {
      title: "操作",
      valueType: "option",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            size="small"
            onClick={async () => {
              try {
                const res = await disguiseMember(record.id);
                if (res.success) {
                  message.success("登录成功");
                  const currentDomain = window.location.hostname;
                  let targetUrl = "https://bbdbuy1.com/dashboard";
                  if (currentDomain === "dev.bbdbuy1.com") {
                    targetUrl = "https://dev.bbdbuy1.com/dashboard";
                  }
                  window.open(targetUrl, "_blank");
                }
              } catch (error) {
                console.error(error);
              }
            }}
          >
            登录
          </Button>
          <ModalForm
            title="充值/扣款"
            trigger={
              <Button type="primary" size="small" ghost>
                充值/扣款
              </Button>
            }
            onFinish={async (values: any) => {
              try {
                await topUpMember({
                  customerId: record.id,
                  ...values,
                });
                message.success("操作成功");
                fetchData({ current, size, ...filters });
                return true;
              } catch (error) {
                console.error(error);
                return false;
              }
            }}
          >
            <ProFormSelect
              name="currencyCode"
              label="币种"
              valueEnum={{
                USD: "美元 (USD)",
                CNY: "人民币 (CNY)",
              }}
              placeholder="请选择币种"
              rules={[{ required: true, message: "请选择币种" }]}
            />
            <ProFormDigit
              name="amount"
              label="金额"
              placeholder="请输入金额（正数充值，负数扣款）"
              rules={[{ required: true, message: "请输入金额" }]}
              min={-100000000}
              fieldProps={{ precision: 2 }}
            />
            <ProFormText
              name="remark"
              label="备注"
              placeholder="请输入备注"
            />
          </ModalForm>
          <ModalForm
            title="修改会员信息"
            trigger={
              <Button type="primary" size="small" ghost>
                修改
              </Button>
            }
            onFinish={async (values: any) => {
              try {
                await updateMember({
                  customerId: record.id,
                  ...values,
                });
                message.success("修改成功");
                fetchData({ current, size, ...filters });
                return true;
              } catch (error) {
                console.error(error);
                return false;
              }
            }}
            initialValues={{
              vipLv: record.vipLv,
              points: record.myPoints,
            }}
          >
            <ProFormDigit
              name="vipLv"
              label="VIP等级"
              placeholder="请输入VIP等级"
              min={0}
              fieldProps={{ precision: 0 }}
            />
            <ProFormDigit
              name="points"
              label="可用积分"
              placeholder="请输入可用积分"
              min={0}
              fieldProps={{ precision: 0 }}
            />
          </ModalForm>
        </div >
      ),
    },
  ];

  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    const filterParams = { ...values };

    // 移除空值
    Object.keys(filterParams).forEach(key => {
      if (filterParams[key] === undefined || filterParams[key] === '') {
        delete filterParams[key];
      }
    });

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

    fetchData();
  }, []);
  return (
    <PageContainer>
      <ProTable
        bordered
        formRef={formRef}
        size="small"
        actionRef={actionRef}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        search={{
          labelWidth: "auto",
          defaultCollapsed: false, // ❗ 默认展开
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
        }}
        toolBarRender={() => [
          <ModalForm
            key="coupon"
            title="发放优惠券"
            trigger={
              <Button type="primary" disabled={selectedRowKeys.length === 0}>
                发放优惠券
              </Button>
            }
            width={600}
            onFinish={async (values) => {
              const couponInfo: any = {};
              // 处理 ProFormList 的数据
              if (values.coupons && values.coupons.length > 0) {
                values.coupons.forEach((item: any) => {
                  if (item.couponId && item.count) {
                    couponInfo[item.couponId] = item.count;
                  }
                });
              }

              if (Object.keys(couponInfo).length === 0) {
                 message.error("请至少选择一张优惠券并填写数量");
                 return false;
              }

              try {
                await distributionCoupons({
                  customerIds: selectedRowKeys,
                  couponInfo,
                });
                message.success("发放成功");
                setSelectedRowKeys([]);
                return true;
              } catch (error) {
                console.error(error);
                return false;
              }
            }}
          >
            <ProFormList
              name="coupons"
              // label="优惠券列表"
              initialValue={[{}]}
              creatorButtonProps={{
                position: 'bottom',
                creatorButtonText: '添加优惠券',
              }}
              min={1}
              copyIconProps={false} // 禁用复制按钮
            >
              <ProFormGroup key="group">
                <ProFormSelect
                  name="couponId"
                  label="选择优惠券"
                  placeholder="请选择优惠券"
                  width="md"
                  rules={[{ required: true, message: "请选择优惠券" }]}
                  request={async () => {
                    const res = await getCouponList({ src: 3 }); // 仅获取后台发放优惠券
                    return (res.data || []).map((item: any) => ({
                      label: item.title, // 使用 title
                      value: item.id,
                    }));
                  }}
                />
                <ProFormDigit
                  name="count"
                  label="数量"
                  placeholder="请输入发放数量"
                  width="xs"
                  min={1}
                  initialValue={1}
                  rules={[{ required: true, message: "请输入数量" }]}
                />
              </ProFormGroup>
            </ProFormList>
          </ModalForm>,
        ]}
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
    </PageContainer>
  );
};

export default TableList;
