import { request } from "@umijs/max";


/** 获取消费列表 POST  */
export async function getConsumeList(data: any) {
  return request<any>("/finance/consume/page", {
    method: "POST",
    data,
  });
}
/** 获取充值列表 POST  */
export async function getRechargeList(data: any) {
  return request<any>("finance/recharge/page", {
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

/** 审核提现 POST  */
export async function auditWithdrawal(data: any) {
  return request<any>("/finance/withdrawal/audit", {
    method: "POST",
    data,
  });
}