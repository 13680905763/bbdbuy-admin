import { request } from "@umijs/max";

/** 获取订单列表 POST /orders/page */
export async function getOrderListByPage(params: {
  /** 当前的页码 */
  page?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/orders/page", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
    },
  });
}
/** 获取采购单列表 POST /orders/page */
export async function getPurchaseListByPage(params: {
  /** 当前的页码 */
  page?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/purchase/page", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
    },
  });
}
