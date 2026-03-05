import { request } from "@umijs/max";

/** 获取订单列表 POST /orders/page */
export async function getOrderListByPage(data: any) {
  return request<API.RuleList>("/orders/page", {
    method: "POST",
    data,
  });
}
/** 关闭订单 POST /orders/close */
export async function closeOrder(orderId: any, reasonCode: any) {
  return request<API.RuleList>("/orders/close?orderId=" + orderId + "&reasonCode=" + reasonCode, {
    method: "put",
  });
}
/** 批量同步 POST /orders/close */
export async function batchSyncOrder(data: any) {
  return request<API.RuleList>("purchase/sync", {
    method: "post",
    data,
  });
}
/** 获取采购单列表 POST /orders/page */
export async function getPurchaseListByPage(data: any) {
  return request<API.RuleList>("/purchase/page", {
    method: "POST",
    data,
  });
}
/** 修改采购单快递单号 */
export async function putPurchaseLogistics(data: any) {
  return request("/purchase/manual/logistics/code", {
    method: "POST",
    data,
  });
}
/** 回填采购单快递单号 */
export async function createPurchaseLogistics(data: any) {
  return request("/purchase/manual/send", {
    method: "POST",
    data,
  });
}
/** 手动采购 */
export async function PurchaseManual(data: any) {
  return request("/purchase/manual", {
    method: "POST",
    data,
  });
}
/** 修改快递单号 */
export async function updatePurchaseLogistics(data: any) {
  return request("purchase/update", {
    method: "POST",
    data,
  });
}
/** 修改快递单号 */
export async function putPurchaseSync(id: any) {
  return request(`purchase/sync/${id}`, {
    method: "put",
  });
}
/** 获取收货单扫描信息 */
export async function getInboundReceiveScan(logisticsCode: string) {
  return request<API.RuleList>(`/inbound-receive/scan?logisticsCode=${logisticsCode}`, {
    method: "GET",
  });
}
/** 获取收货单列表 */
export async function inboundReceiveSubmit(data: any) {
  return request<API.RuleList>("/receive-package/submit", {
    method: "POST",
    data,
  });
}
/** 获取收货单列表 */
export async function getDeliveryListByPage(data: any) {
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
/** 修改验货单  */
export async function putInspection(data: any) {
  return request<API.RuleList>("/inbound-inspection/update", {
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

/** 验货异常上架 */
export async function putawayInspection(data: {
  id: number;
  locationCode: string;
  remark?: string;
}) {
  return request("/inbound-inspection/putaway", {
    method: "POST",
    data,
  });
}

/** 验货异常退货/不退货 */
export async function returnInspection(data: {
  id: number;
  returnFlag: boolean;
  returnLogisticsCode?: string;
  remark?: string;
}) {
  return request("/inbound-inspection/return", {
    method: "POST",
    data,
  });
}
/** 获取拍照列表 POST /orders/page */
export async function getPhotoList(data: any) {
  return request("/inbound-service/page", {
    method: "POST",
    data,
  });
}
/** 获取入库上架列表 POST /orders/page */
export async function getInboundPutaway(data: any) {
  return request("/inbound-putaway/page", {
    method: "POST",
    data,
  });
}

/** 获取DIY订单详情 GET /order-diy/{orderId} */
export async function getDiyOrderDetail(orderId: any) {
  return request(`/order-diy/${orderId}`, {
    method: "GET",
  });
}
