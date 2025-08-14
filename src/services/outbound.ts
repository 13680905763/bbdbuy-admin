import { request } from "@umijs/max";

/** 获取出库单列表 POST /orders/page */
export async function getOutboundListByPage(params: {
  /** 当前的页码 */
  page?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/outbound/page", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
    },
  });
}
/** 获取拣货单列表 POST /orders/page */
export async function getOutboundPickingListByPage(params: {
  /** 当前的页码 */
  page?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/outbound-picking/page", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
    },
  });
}

/** 获取打包单列表 POST /orders/page */
export async function getOutboundPackListByPage(params: {
  /** 当前的页码 */
  page?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/outbound-packing/page", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
    },
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

/** 获取打包单列表 POST /orders/page */
export async function getOutboundPutawayListByPage(params: {
  /** 当前的页码 */
  page?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/outbound-putaway/page", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
    },
  });
}
/** 获取发货列表 POST /orders/page */
export async function getOutboundSendListByPage(params: any) {
  console.log("paramsdata", params);

  return request<API.RuleList>("/outbound-send/page", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
      serverId: params.serverId,
      templateId: params.templateId,
    },
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
  return request<API.RuleList>(`/shipping-fee-template/server?id=${id}`, {
    method: "GET",
  });
}

export async function getOutboundSend(data: any) {
  console.log("paramsdata", data);

  // 返回 Blob 类型
  const res = await request("/outbound-send/export", {
    method: "POST",
    data,
    responseType: "blob", // 关键
  });

  // 创建下载链接
  const blob = new Blob([res], { type: "application/vnd.ms-excel" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // 可以指定下载文件名
  // a.download = `出库单_${new Date().toISOString()}.xlsx`;
  a.click();

  // 释放 URL
  window.URL.revokeObjectURL(url);
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
