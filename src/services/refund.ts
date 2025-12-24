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
// 订单退款
export async function getOrderRefundList(data: any) {
  return request<API.RuleList>("/order-refund/page", {
    method: "POST",
    data,
  });
}
export async function updateRefund(data: any) {
  return request("/order-refund/handleRefund", {
    method: "POST",
    data,
  });
}
// 退货列表
export async function getOrderRefundGoodsList(data: any) {
  return request<API.RuleList>("/return-goods/list", {
    method: "POST",
    data,
  });
}
export async function putOrderRefundGoodsSend(data: any) {
  return request<API.RuleList>("/return-goods/send", {
    method: "put",
    data,
  });
}
export async function putOrderRefundGoodsUpdate(data: any) {
  return request<API.RuleList>("/return-goods/update", {
    method: "put",
    data,
  });
}
export async function getOrderRefundGoodsSign(data: any) {
  return request<API.RuleList>("/return-goods/sign", {
    method: "put",
    data,
  });
}
export async function getOrderRefundGoodsReason(data: any) {
  return request<API.RuleList>("/return-goods/render/reason", {
    method: "post",
    data,
  });
}
