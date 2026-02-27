import { request } from "@umijs/max";


export async function getMemberList(data: any) {
    return request<API.RuleList>("/member/page", {
        method: "POST",
        data,
    });
}

/** 模拟登录 GET /member/disguise/{id} */
export async function disguiseMember(id: string) {
    return request<any>(`/member/disguise/${id}`, {
        method: "GET",
    });
}

/** 充值/扣款 POST /member/top-up */
export async function topUpMember(data: { customerId: number; currencyCode: string; amount: number; remark: string }) {
    return request<any>("/member/top-up", {
        method: "POST",
        data,
    });
}

/** 发放优惠券 POST /member/distributionCoupons */
export async function distributionCoupons(data: any) {
    return request<any>("/member/distributionCoupons", {
        method: "POST",
        data,
    });
}
