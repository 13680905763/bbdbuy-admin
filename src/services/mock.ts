import { request } from "@umijs/max";
export async function mkpurchase(data: any) {
  return request<API.RuleList>("/mock/purchase/initiate", {
    method: "POST",
    data,
  });
}
export async function mktaobaopy(data: any) {
  return request<API.RuleList>("/mock/taobao/callback", {
    method: "POST",
    data,
  });
}
export async function mktaobaosd(data: any) {
  return request<API.RuleList>("/mock/taobao/callback", {
    method: "POST",
    data,
  });
}
