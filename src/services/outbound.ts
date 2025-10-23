import { request } from "@umijs/max";

/** 获取出库单列表 POST /orders/page */
export async function getOutboundListByPage(data: any) {
  return request<API.RuleList>("/outbound/page", {
    method: "POST",
    data,
  });
}
/** 获取拣货单列表 POST /orders/page */
export async function getOutboundPickingListByPage(data: any) {
  return request<API.RuleList>("/outbound-picking/page", {
    method: "POST",
    data,
  });
}

/** 获取打包单列表 POST /orders/page */
export async function getOutboundPackListByPage(data: any) {
  return request<API.RuleList>("/outbound-packing/page", {
    method: "POST",
    data,
  });
}

/** 获取打包单信息 */
export async function getPackScan(code: string) {
  return request<API.RuleList>(`/outbound-packing/scan?code=${code}`, {
    method: "GET",
  });
}
/** 提交打包信息 */
export async function PackSubmit(data: any) {
  return request<API.RuleList>("/outbound-packing/finish", {
    method: "POST",
    data,
  });
}

/** 获取出库上架列表 POST /orders/page */
export async function getOutboundPutawayListByPage(data: any) {
  return request<API.RuleList>("/outbound-putaway/page", {
    method: "POST",
    data,
  });
}
/** 获取发货列表 POST /orders/page */
export async function getOutboundSendListByPage(data: any) {
  return request<API.RuleList>("/outbound-send/page", {
    method: "POST",
    data,
    // serverId: params.serverId,
    // templateId: params.templateId,
  });
}

/** 查询全部承运商 */
export async function getShippingServers() {
  return request<API.RuleList>(`/shipping-servers/list`, {
    method: "GET",
  });
}
/** 根据承运商查询路线 */
export async function getShippingFeeTemplate(id: string) {
  return request<API.RuleList>(`/shipping-line/server?serverId=${id}`, {
    method: "GET",
  });
}

export async function getOutboundSend(data: any) {
  return request("/outbound-send/export", {
    method: "POST",
    data,
  });
}

export async function uploadOutboundSend(file: File) {
  const formData = new FormData();
  formData.append("file", file); // 后端的接收字段名是 file，需和后端一致

  return request("/outbound-shipping/upload", {
    method: "POST",
    data: formData,
    requestType: "form", // umi request 会自动处理 multipart/form-data
  });
}

export async function rebuildOutboundPacking(data: any) {
  return request("/outbound-packing/rebuild", {
    method: "POST",
    data,
  });
}
