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