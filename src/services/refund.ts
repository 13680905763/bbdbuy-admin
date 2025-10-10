import { request } from "@umijs/max";

/** 登录接口 POST /api/login/account */
export async function login(
  body: API.LoginParams,
  options?: { [key: string]: any }
) {
  return request<API.LoginResult>("/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function getOrderRefundList(params: {
  /** 当前的页码 */
  page?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/order-refund/list", {
    method: "POST",
    data: {
      current: params.page,
      /** 页面的容量 */
      size: params.pageSize,
    },
  });
}
export async function updateRefund(data: any) {
  return request("/order-refund/handleRefund", {
    method: "POST",
    data,
  });
}
