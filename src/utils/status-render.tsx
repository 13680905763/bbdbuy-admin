// statusUtil.ts
import { Tag } from "antd";
import React from "react";

export type ModuleType =
  | "order"
  | "purchase"
  | "inspection"
  | "receiving"
  | "outbound"
  | "picking"
  | "packing"
  | "putaway"
  | "inputaway"
  | "refund"
  | "refundGoods"
  | "shelf"
  | "payment"
  | "systemMessage"
  | "noticeType"
  | "delivery"; // 可根据项目扩展

export interface StatusItem {
  label: string;
  value: number | string | boolean; // ✅ 明确支持布尔类型
  module: ModuleType;
  color: string;
  icon?: React.ReactNode;
}

// ======================
// ✅ 状态列表统一管理
// ======================
export const STATUS_LIST: StatusItem[] = [
  // 订单状态
  { label: "已取消", value: 100, module: "order", color: "default" },
  { label: "待付款", value: 101, module: "order", color: "orange" },
  { label: "待采购", value: 102, module: "order", color: "blue" },
  { label: "待商家发货", value: 103, module: "order", color: "cyan" },
  { label: "待入库", value: 104, module: "order", color: "purple" },
  { label: "入库中", value: 105, module: "order", color: "geekblue" },
  { label: "已入库", value: 106, module: "order", color: "green" },
  { label: "已关闭", value: 107, module: "order", color: "red" },
  { label: "客户申请退款", value: 108, module: "order", color: "red" },

  // 采购单状态
  { label: "待审核", value: 200, module: "purchase", color: "orange" },
  { label: "待采购", value: 201, module: "purchase", color: "blue" },
  { label: "已采购 待付款", value: 202, module: "purchase", color: "cyan" },
  { label: "已付款 待发货", value: 203, module: "purchase", color: "green" },
  { label: "已发货", value: 204, module: "purchase", color: "purple" },
  { label: "已取消", value: 205, module: "purchase", color: "default" },
  { label: "已退款", value: 206, module: "purchase", color: "red" },
  { label: "客户申请退款", value: 207, module: "purchase", color: "red" },

  // ✅ 收货列表状态
  { label: "待收货", value: 1011, module: "receiving", color: "blue" },
  { label: "已收货", value: 1012, module: "receiving", color: "green" },
  { label: "收货异常", value: 1013, module: "receiving", color: "red" },

  // ✅ 验货列表状态
  { label: "待验货", value: 1031, module: "inspection", color: "blue" },
  { label: "验货正常", value: 1032, module: "inspection", color: "green" },
  { label: "验货异常", value: 1033, module: "inspection", color: "red" },

  // ✅ 出库列表状态
  { label: "已取消", value: 200, module: "outbound", color: "default" },
  { label: "待拣货", value: 201, module: "outbound", color: "orange" },
  { label: "待打包", value: 202, module: "outbound", color: "blue" },
  { label: "待付款", value: 203, module: "outbound", color: "cyan" },
  { label: "待发货", value: 204, module: "outbound", color: "purple" },
  { label: "运输中", value: 205, module: "outbound", color: "geekblue" },
  { label: "已收货", value: 206, module: "outbound", color: "green" },

  // ✅ 拣货列表状态
  { label: "待拣货", value: 2011, module: "picking", color: "blue" },
  { label: "已拣货", value: 2012, module: "picking", color: "green" },
  // ✅ 打包列表状态
  { label: "待打包", value: 2021, module: "packing", color: "blue" },
  { label: "已打包", value: 2022, module: "packing", color: "green" },
  // 打包上架状态（shelf）
  { label: "待上架", value: 2025, module: "shelf", color: "blue" },
  { label: "已上架", value: 2026, module: "shelf", color: "green" },
  // ✅ 上架列表状态
  { label: "待上架", value: 2025, module: "putaway", color: "blue" },
  { label: "已上架", value: 2026, module: "putaway", color: "green" },
  // ✅ 入库上架列表状态
  { label: "待上架", value: 1071, module: "inputaway", color: "blue" },
  { label: "已上架", value: 1072, module: "inputaway", color: "green" },
  // ✅ 发货列表状态
  { label: "待发货", value: 2041, module: "delivery", color: "blue" },
  { label: "已发货", value: 2042, module: "delivery", color: "green" },

  // 退款单状态
  { label: "待审核", value: 1, module: "refund", color: "orange" },
  { label: "处理中", value: 2, module: "refund", color: "blue" },
  { label: "待退款", value: 3, module: "refund", color: "red" },
  { label: "已退款", value: 4, module: "refund", color: "green" },
  { label: "已驳回", value: 5, module: "refund", color: "red" },
  { label: "已取消", value: 6, module: "refund", color: "default" },
  // 退货商品
  { label: "待申请", value: 0, module: "refundGoods", color: "geekblue" },
  { label: "待退货", value: 1, module: "refundGoods", color: "cyan" },
  { label: "待签收", value: 2, module: "refundGoods", color: "gold" },
  { label: "待退款", value: 3, module: "refundGoods", color: "volcano" },
  { label: "已退款", value: 4, module: "refundGoods", color: "green" },

  // ✅ 支付方式配置 - 布尔类型示例
  { label: "关闭", value: true, module: "payment", color: "red" },
  { label: "启用", value: false, module: "payment", color: "green" },

  // ✅ 系统消息状态
  { label: "未读", value: 0, module: "systemMessage", color: "red" },
  { label: "已读", value: 1, module: "systemMessage", color: "green" },

  // ✅ 系统通知类型
  { label: "超时未采购", value: 102, module: "noticeType", color: "orange" },
  { label: "超时未发货(采购)", value: 103, module: "noticeType", color: "red" },
  { label: "超时未收货", value: 104, module: "noticeType", color: "volcano" },
  { label: "超时未上架(入库)", value: 105, module: "noticeType", color: "cyan" },
  { label: "超时未拣货", value: 106, module: "noticeType", color: "blue" },
  { label: "超时未打包", value: 107, module: "noticeType", color: "geekblue" },
  { label: "超时未上架(出库)", value: 108, module: "noticeType", color: "purple" },
  { label: "超时未发货(出库)", value: 109, module: "noticeType", color: "magenta" },
];

// ======================
// ✅ Map 快速查询
// key = `${module}_${value}` 保证唯一
// 注意：布尔值需要特殊处理，因为 false.toString() === "false"
// ======================
export const STATUS_MAP: Record<string, StatusItem> = {};
STATUS_LIST.forEach((item) => {
  // 处理布尔值的key
  let keyValue: string;
  if (typeof item.value === "boolean") {
    keyValue = item.value ? "true" : "false";
  } else {
    keyValue = String(item.value);
  }
  STATUS_MAP[`${item.module}_${keyValue}`] = item;
});

// ======================
// ✅ 渲染 Tag
// module 必须传，避免 value 重复冲突
// 支持布尔类型的value
// ======================
export const renderStatusTag = (
  module: ModuleType,
  value: string | number | boolean
) => {
  // 将value转换为字符串key
  let keyValue: string;
  if (typeof value === "boolean") {
    keyValue = value ? "true" : "false";
  } else {
    keyValue = String(value);
  }

  const status = STATUS_MAP[`${module}_${keyValue}`];
  if (!status) return <Tag>{String(value)}</Tag>;
  return (
    <Tag color={status.color}>
      {status.icon && <span style={{ marginRight: 4 }}>{status.icon}</span>}
      {status.label}
    </Tag>
  );
};

// ======================
// ✅ 生成 Select Options
// 可传 module 过滤，仅显示当前模块的状态
// 可选 values 过滤部分值
// 支持布尔类型的values
// ======================
export const getStatusOptions = (
  module: ModuleType,
  values?: Array<string | number | boolean>
) =>
  STATUS_LIST.filter(
    (item) =>
      item.module === module &&
      (!values ||
        values.some((v) => {
          // 比较时需要处理类型差异
          if (typeof item.value === "boolean" && typeof v === "boolean") {
            return item.value === v;
          }
          return String(item.value) === String(v);
        }))
  ).map((item) => ({
    label: item.label,
    value: item.value,
  }));

// ======================
// ✅ 获取状态信息
// 根据module和value获取完整的状态信息
// ======================
export const getStatusInfo = (
  module: ModuleType,
  value: string | number | boolean
): StatusItem | undefined => {
  let keyValue: string;
  if (typeof value === "boolean") {
    keyValue = value ? "true" : "false";
  } else {
    keyValue = String(value);
  }

  return STATUS_MAP[`${module}_${keyValue}`];
};

// ======================
// ✅ 根据label获取value
// ======================
export const getStatusValueByLabel = (
  module: ModuleType,
  label: string
): string | number | boolean | undefined => {
  const status = STATUS_LIST.find(
    (item) => item.module === module && item.label === label
  );
  return status?.value;
};

// ======================
// ✅ 使用示例
// ======================
/*
// 渲染Tag
renderStatusTag("payment", true)  // 显示"启用"的绿色标签
renderStatusTag("payment", false) // 显示"关闭"的红色标签

// 获取选项
getStatusOptions("payment") // 返回 [{label: "关闭", value: false}, {label: "启用", value: true}]

// 获取状态信息
getStatusInfo("payment", true) // 返回 {label: "启用", value: true, module: "payment", color: "green"}
*/
