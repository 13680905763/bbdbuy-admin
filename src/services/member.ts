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

/** 修改会员信息 POST /member/updateMember */
export async function updateMember(data: { customerId: number; vipLv?: number; points?: number }) {
    return request<any>("/member/updateMember", {
        method: "POST",
        data,
    });
}

/** 会员禁闭/解禁 POST /member/confinement */
export async function toggleMemberConfinement(params: { id: string | number; confinement: boolean }) {
    return request<any>("/member/confinement", {
        method: "POST",
        params,
    });
}

/** 切换是否无推广奖励 POST /member/noPromotionReward */
export async function toggleNoPromotionReward(params: { id: string | number; noPromotionReward: string | boolean }) {
    return request<any>("/member/noPromotionReward", {
        method: "POST",
        params,
    });
}

