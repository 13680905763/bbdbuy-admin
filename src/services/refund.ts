import { request } from "@umijs/max";

/** 登录接口 POST /api/login/account */
export async function login(
  body: any,
  options?: { [key: string]: any }
) {
  return request<any>("/users/login", {
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
  return request<any>("/order-refund/page", {
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
  return request<any>("/return-goods/page", {
    method: "POST",
    data,
  });
}
export async function putOrderRefundGoodsSend(data: any) {
  return request<any>("/return-goods/send", {
    method: "put",
    data,
  });
}
export async function putOrderRefundGoodsUpdate(data: any) {
  return request<any>("/return-goods/update", {
    method: "put",
    data,
  });
}
export async function getOrderRefundGoodsSign(data: any) {
  return request<any>("/return-goods/sign", {
    method: "put",
    data,
  });
}
export async function getOrderRefundGoodsReason(data: any) {
  return request<any>("/return-goods/render/reason", {
    method: "post",
    data,
  });
}

/** 申请退货退款预览 */
export async function applyTaobaoRefund(data: any) {
  return request<any>("/return-goods/render/taobao", {
    method: "POST",
    data,
  });
}

/** 1688 申请退货退款 */
export async function apply1688Refund(data: any) {
  return request<any>("/return-goods/render/1688", {
    method: "POST",
    data,
  });
}

/** 1688 申请货物状态预览 */
export async function get1688GoodsStatus(data: any) {
  return request<any>("/return-goods/render/1688/goods-status", {



    method: "POST",
    data,
  });
}

/** 微店 申请退货退款 */
export async function applyWeidianRefund(data: any) {
  return request<any>("/return-goods/render/weidian", {
    method: "POST",
    data,
  });
}

/** 提交申请退货退款 */
export async function submitRefundApply(data: any) {
  return request<any>("/return-goods/apply", {
    method: "post",
    data,
  });
}
