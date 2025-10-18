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
/** 获取收货单列表 */
export async function getDeliveryListByPage(data: any) {
  console.log("data", data);

  return request<API.RuleList>("/inbound-receive/page", {
    method: "POST",
    data,
  });
}
/** 获取到库单列表 POST /orders/page */
export async function getReceiveWarehouseList(data: any) {
  return request<API.RuleList>("/receive-package/page", {
    method: "POST",
    data,
  });
}
export async function purchaseInitiate(data: {
  ids: string[];
  remark?: string;
}) {
  return request<any>("/purchase/initiate", {
    method: "POST",
    data,
  });
}

/** 获取验货单列表  */
export async function getInspectionListByPage(data: any) {
  return request<API.RuleList>("/inbound-inspection/page", {
    method: "POST",
    data,
  });
}
/** 获取验货单（包裹）信息 */
export async function getInspectionScan(logisticsCode: string) {
  return request<API.RuleList>(
    `/inbound-inspection/scan?logisticsCode=${logisticsCode}`,
    {
      method: "GET",
    }
  );
}
/** 提交验货单（包裹）信息 */
export async function InspectionSubmit(data: string[]) {
  return request<API.RuleList>("/inbound-inspection/checked", {
    method: "POST",
    data: {
      checkList: data,
    },
  });
}
/** 获取到库单列表 POST /orders/page */
export async function getPhotoList(data: any) {
  return request("/inbound-service/page", {
    method: "POST",
    data,
  });
}
