import { request } from "@umijs/max";


/** 获取消费列表 POST /orders/page */
export async function getConsumeList(data: any) {
  return request<API.RuleList>("/finance/consume/page", {
    method: "POST",
    data,
  });
}
/** 获取充值列表 POST /orders/page */
export async function getRechargeList(data: any) {
  return request<API.RuleList>("finance/recharge/page", {
    method: "POST",
    data,
  });
}
export async function getWithdrawalList(data: any) {
  return request<any>("/finance/withdrawal/page", {
    method: "POST",
    data,
  });
}

/** 审核提现 POST /finance/withdrawal/audit */
export async function auditWithdrawal(data: any) {
  return request<any>("/finance/withdrawal/audit", {
    method: "POST",
    data,
  });
}