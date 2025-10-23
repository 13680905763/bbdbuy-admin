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
  | "delivery"; // 可根据项目扩展

export interface StatusItem {
  label: string;
  value: number | string;
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

  // 采购单状态
  { label: "待审核", value: 200, module: "purchase", color: "orange" },
  { label: "待采购", value: 201, module: "purchase", color: "blue" },
  { label: "已采购 待付款", value: 202, module: "purchase", color: "cyan" },
  { label: "已采购 已付款", value: 203, module: "purchase", color: "green" },
  { label: "已发货", value: 204, module: "purchase", color: "purple" },
  { label: "已取消", value: 205, module: "purchase", color: "default" },
  { label: "已退款", value: 206, module: "purchase", color: "red" },

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
  // ✅ 上架列表状态
  { label: "待上架", value: 2025, module: "putaway", color: "blue" },
  { label: "已上架", value: 2026, module: "putaway", color: "green" },
  // ✅ 入库上架列表状态
  { label: "待上架", value: 1071, module: "inputaway", color: "blue" },
  { label: "已上架", value: 1072, module: "inputaway", color: "green" },
  // ✅ 发货列表状态
  { label: "待发货", value: 2041, module: "delivery", color: "blue" },
  { label: "已发货", value: 2042, module: "delivery", color: "green" },
];

// ======================
// ✅ Map 快速查询
// key = `${module}_${value}` 保证唯一
// ======================
export const STATUS_MAP: Record<string, StatusItem> = {};
STATUS_LIST.forEach((item) => {
  STATUS_MAP[`${item.module}_${item.value}`] = item;
});

// ======================
// ✅ 渲染 Tag
// module 必须传，避免 value 重复冲突
// ======================
export const renderStatusTag = (module: ModuleType, value: string | number) => {
  const status = STATUS_MAP[`${module}_${value}`];
  if (!status) return <Tag>{value}</Tag>;
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
// ======================
export const getStatusOptions = (
  module: ModuleType,
  values?: Array<string | number>
) =>
  STATUS_LIST.filter(
    (item) => item.module === module && (!values || values.includes(item.value))
  ).map((item) => ({
    label: item.label,
    value: item.value,
  }));

// 显卡 5060魔刃 2314
// cpu 9600x散片 1152
// 主板 b650 ayw 728
// 内存 金百达黑刃 16*2 1003 / d300 16 632
// 电源 玄武650w k 260
// 散热 玄冰500 110
// 固态 1t 【450左右】
// 机箱风扇 【100左右】
// 合计 约 6110 /5739
