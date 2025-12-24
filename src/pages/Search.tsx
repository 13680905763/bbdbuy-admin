import { CommonSearch } from "@/services";
import { renderStatusTag } from "@/utils/status-render";
import { SearchOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import ProTable, { ActionType } from "@ant-design/pro-table";
import { Card, Image, Input, message, Tabs } from "antd";
import React, { useRef, useState } from "react";

const ConfigList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | "order"
    | "orderProduct"
    | "purchase"
    | "inbound"
    | "inboundReceive"
    | "inboundInspection"
    | "inboundPutaway"
    // | "packageItem"
  >("order");

  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // 存储所有tab的完整数据
  const [allTabData, setAllTabData] = useState<Record<string, any[]>>({});

  // 当前显示的表格数据
  const currentData = allTabData[activeTab] || [];

  const actionRef = useRef<ActionType | null>(null);

  /** 定义每个tab的列配置 */
  const tabColumns: Record<string, any[]> = {
    order: [
      { title: "订单号", dataIndex: "orderCode" },
      { title: "用户名", dataIndex: "customerName", hideInSearch: true },
      { title: "商品金额", dataIndex: "productFee", hideInSearch: true },
      { title: "运费金额", dataIndex: "postFee", hideInSearch: true },
      { title: "服务费金额", dataIndex: "serviceFee", hideInSearch: true },
      { title: "退款金额", dataIndex: "refundAmount", hideInSearch: true },
      { title: "订单总金额", dataIndex: "totalFee", hideInSearch: true },
      {
        title: "订单状态",
        dataIndex: "statusCode",
        render: (value: any) => renderStatusTag("order", value),
      },
      { title: "备注", dataIndex: "remark", hideInSearch: true },
      {
        title: "下单时间",
        dataIndex: "createTime",
        valueType: "dateTimeRange",
        render: (_: any, records: any) => {
          return records?.createTime;
        },
      },
    ],
    orderProduct: [
      {
        title: "商品图片",
        dataIndex: "skuPicUrl",
        render: (url: any, records: any) => (
          <Image
            src={url || records?.picUrl}
            width={50}
            referrerPolicy="no-referrer"
          />
        ),
      },
      {
        title: "商品名称",
        dataIndex: "productTitle",
        width: 150,
      },
      {
        title: "sku",
        dataIndex: "propAndValue",
        render: (propAndValue: any) => (
          <div
            style={{
              color: "#e60012",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: "1.4",
              maxWidth: 200,
              whiteSpace: "nowrap",
            }}
          >
            {propAndValue?.propName_valueName || "-"}
          </div>
        ),
      },
      {
        title: "采购数量",
        dataIndex: "purchaseQuantity",
        render: (q: any) => <span style={{ color: "#4b5563" }}>×{q}</span>,
      },
      {
        title: "价格",
        dataIndex: "price",
        render: (p: any) => (
          <span style={{ color: "#1f2937", fontWeight: 500 }}>¥{p}</span>
        ),
      },
      {
        title: "备注",
        dataIndex: "remark",
        render: (remark: any) => (
          <span style={{ color: "#1f2937", fontWeight: 500 }}>
            {remark || "-"}
          </span>
        ),
      },
    ],
    purchase: [
      {
        title: "采购编号",
        dataIndex: "purchaseCode",
        hideInSearch: true,
      },
      {
        title: "订单编号",
        dataIndex: "orderCode",
      },

      {
        title: "平台采购单号",
        dataIndex: "sourceOrderId",
      },

      {
        title: "采购状态",
        dataIndex: "statusCode",
        width: 80,
        render: (value: any) => renderStatusTag("purchase", value),
      },

      {
        title: "采购员",
        dataIndex: "dispatchUserName",
        hideInSearch: true,
      },

      {
        title: "时间信息",
        dataIndex: "createTime",
        valueType: "dateTimeRange",
        formItemProps: {
          label: false, // ✅ 关键：隐藏 label
          // style: { width: "900px" },
        },
        render: (_: any, record: any) => {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 12,
                lineHeight: 1.4,
                color: "#555",
              }}
            >
              <div>
                <span style={{ color: "#999" }}>采购：</span>
                {record.purchaseTime || "-"}
              </div>
              <div>
                <span style={{ color: "#999" }}>付款：</span>
                {record.payTime || "-"}
              </div>
              <div>
                <span style={{ color: "#999" }}>发货：</span>
                {record.sendTime || "-"}
              </div>
            </div>
          );
        },
      },
    ],

    inboundReceive: [
      {
        title: "订单号",
        dataIndex: "orderCode",
      },
      {
        title: "采购编号",
        dataIndex: "purchaseCode",
      },

      {
        title: "快递公司",
        dataIndex: "logisticsCompany",
        hideInSearch: true,
      },
      {
        title: "快递单号",
        dataIndex: "logisticsCode",
      },
      {
        title: "收货人",
        dataIndex: "userName",
        hideInSearch: true,
      },
      {
        title: "收货状态",
        dataIndex: "receiveStatusCode",
        render: (value: any) => renderStatusTag("receiving", value),
      },
      {
        title: "发货时间",
        dataIndex: "createTime",
        valueType: "dateTimeRange",
        render: (_: any, record: any) => record?.createTime,
      },
      {
        title: "收货时间",
        dataIndex: "updateTime",
        valueType: "dateTimeRange",
        render: (_: any, records: any) => {
          if (records?.receiveStatus === "已收货") {
            return records?.updateTime;
          }
          return "-";
        },
      },
    ],
    inboundInspection: [
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
        title: "用户名",
        dataIndex: "customerName",
        hideInSearch: true,
        width: 100,
      },

      {
        title: "验货状态",
        dataIndex: "inspectionStatus",
        render: (_: any, record: any) => {
          const { inspectionStatus, abnormalMsg, inspectionStatusCode } =
            record;
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
      },
      {
        title: "验货人",
        dataIndex: "userName",
        width: 100,
        hideInSearch: true,
        render: (userName: any, records: any) => {
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
        render: (_: any, records: any) => {
          if (records?.inspectionStatus === "待验货") {
            return "-";
          }
          return records?.updateTime;
        },
      },
    ],
    inboundPutaway: [
      {
        title: "订单号",
        dataIndex: "orderCode",
      },
      {
        title: "入库单号",
        dataIndex: "inboundCode",
      },
      {
        title: "包裹编号",
        dataIndex: "packageCode",
      },

      {
        title: "状态",
        dataIndex: "putawayStatusCode",
        render: (value: any) => renderStatusTag("inputaway", value),
      },

      {
        title: "上架时间",
        dataIndex: "updateTime",
        hideInSearch: true,
        render: (_: any, record: any) => {
          const putawayStatusCode = record.putawayStatusCode;
          const updateTime = record.updateTime;
          if (putawayStatusCode == 1071) return "--";
          return updateTime;
        },
      },
    ],
    // packageItem: [
    //   { title: "包裹号", dataIndex: "packageNo", key: "packageNo", width: 150 },
    //   {
    //     title: "运单号",
    //     dataIndex: "trackingNo",
    //     key: "trackingNo",
    //     width: 150,
    //   },
    //   {
    //     title: "物流公司",
    //     dataIndex: "logistics",
    //     key: "logistics",
    //     width: 120,
    //   },
    //   { title: "重量", dataIndex: "weight", key: "weight", width: 80 },
    //   { title: "状态", dataIndex: "status", key: "status", width: 80 },
    // ],
  };

  /** 拉取数据 - 一次获取所有tab数据 */
  const fetchData = async (keyword: string) => {
    setLoading(true);
    try {
      const res: any = await CommonSearch(keyword);

      if (res?.data) {
        // 保存所有tab的数据
        setAllTabData(res.data);
        setHasSearched(true);
        setSearchKeyword(keyword);
      } else {
        // 没有数据时，初始化空对象
        setAllTabData({});
        setHasSearched(true);
        setSearchKeyword(keyword);
      }
    } catch (e) {
      message.error("搜索失败");
      setAllTabData({});
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  /** 处理回车搜索 */
  const handleSearch = (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword) {
      fetchData(trimmedKeyword);
    } else {
      message.info("请输入搜索关键词");
    }
  };

  /** 清空搜索 */
  const handleClear = () => {
    setInputValue("");
    setSearchKeyword("");
    setAllTabData({});
    setHasSearched(false);
  };

  /** 切换tab时清空搜索状态 */
  const handleTabChange = (key: string) => {
    setActiveTab(key as any);
    // 切换tab不清空数据，只清空输入框
    // setInputValue("");
  };

  // 根据tab类型获取中文名称
  const getTabChineseName = (tab: string) => {
    const tabMap: Record<string, string> = {
      order: "订单",
      orderProduct: "订单商品",
      purchase: "采购",
      inbound: "入库",
      inboundReceive: "入库收货",
      inboundInspection: "入库检查",
      inboundPutaway: "上架",
      // packageItem: "包裹",
    };
    return tabMap[tab] || tab;
  };

  // 当前tab的列配置
  const currentColumns = tabColumns[activeTab] || [];

  return (
    <PageContainer>
      <Card className="mb-4" bodyStyle={{ padding: "20px 24px" }}>
        <Input
          placeholder={`搜索所有数据...（按回车搜索）`}
          prefix={<SearchOutlined className="text-gray-400" />}
          style={{
            width: 320,
            height: 42,
            fontSize: "16px",
            borderRadius: "8px",
          }}
          allowClear
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={(e) => {
            const keyword = inputValue.trim();
            if (keyword) {
              handleSearch(keyword);
            } else {
              message.info("请输入搜索关键词");
            }
          }}
          onClear={handleClear}
        />
        <div className="flex items-center gap-4">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={[
              {
                label: `订单 (${allTabData.order?.length || 0})`,
                key: "order",
              },
              {
                label: `订单商品 (${allTabData.orderProduct?.length || 0})`,
                key: "orderProduct",
              },
              {
                label: `采购列表 (${allTabData.purchase?.length || 0})`,
                key: "purchase",
              },
              // { label: "入库", key: "inbound" },
              {
                label: `收货列表 (${allTabData.inboundReceive?.length || 0})`,
                key: "inboundReceive",
              },
              {
                label: `验货列表 (${
                  allTabData.inboundInspection?.length || 0
                })`,
                key: "inboundInspection",
              },
              {
                label: `上架 (${allTabData.inboundPutaway?.length || 0})`,
                key: "inboundPutaway",
              },
              // { label: "包裹", key: "packageItem" },
            ]}
          />

          <div className="flex-1"></div>
        </div>
      </Card>

      {hasSearched ? (
        <Card>
          {/* 搜索结果显示 */}
          {currentData.length > 0 ? (
            <>
              <div className="mb-4 text-gray-500">
                共找到 {currentData.length} 条数据
                {searchKeyword && (
                  <span className="ml-2">
                    搜索关键词：
                    <span className="text-blue-600 font-medium">
                      "{searchKeyword}"
                    </span>
                  </span>
                )}
                <span className="ml-2 text-gray-400">
                  （当前查看：{getTabChineseName(activeTab)}）
                </span>
                <span className="ml-4 text-sm text-gray-400">
                  提示：切换标签查看不同分类的数据
                </span>
              </div>

              <ProTable
                size="middle"
                options={{
                  reload: false,
                  fullScreen: true,
                  density: true,
                  setting: true,
                }}
                bordered
                actionRef={actionRef}
                rowKey="id"
                search={false}
                pagination={false}
                dataSource={currentData}
                loading={loading}
                columns={currentColumns}
                scroll={{ x: "max-content" }}
                style={{ borderRadius: "8px" }}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                未找到数据
              </h3>
              <p className="text-gray-400">
                {searchKeyword
                  ? `在${getTabChineseName(
                      activeTab
                    )}中未找到包含 "${searchKeyword}" 的相关数据`
                  : `当前${getTabChineseName(activeTab)}暂无数据`}
              </p>
              <div className="mt-4 text-sm text-gray-400">
                可以尝试切换其他标签查看其他分类的数据
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-6 text-gray-300">📊</div>
            <h3 className="text-xl font-medium text-gray-500 mb-3">搜索数据</h3>
            <p className="text-gray-400 text-center max-w-md">
              请输入关键词并按回车键，一次搜索所有分类的数据
            </p>
            <div className="mt-6 text-sm text-gray-400">
              提示：搜索后可以切换不同标签查看相应分类的数据
            </div>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};

export default ConfigList;
