import { request } from "@umijs/max";

/** 获取汇率配置 */
export async function getRateList(currency?: string) {
  const url = currency ? `/rate?currency=${currency}` : "/rate";
  return request(url, {
    method: "GET",
  });
}
export async function putRate(data: any) {
  return request("/rate", {
    method: "put",
    data,
  });
}

/** 获取推广配置 */
export async function getPromotionList(configType: string) {
  // return request("/promotion-config", {
  return request("/promotion-config?configType=" + configType, {
    method: "GET",
  });
}
export async function putPromotion(data: any) {
  return request("/promotion-config", {
    method: "put",
    data,
  });
}
export async function createPromotion(data: any) {
  return request("/promotion-config", {
    method: "post",
    data,
  });
}
export async function delPromotion(id: string | number) {
  return request(`/promotion-config/${id}`, {
    method: "DELETE",
  });
}

/** 获取优惠券配置 */
export async function getCouponList() {
  return request("/coupon", {
    method: "GET",
  });
}
export async function putCoupon(data: any) {
  return request("/coupon", {
    method: "put",
    data,
  });
}
export async function createCoupon(data: any) {
  return request("/coupon", {
    method: "post",
    data,
  });
}
export async function delCoupon(id: string | number) {
  return request(`/coupon/${id}`, {
    method: "DELETE",
  });
}
/** 获取服务商配置 */
export async function getShippingServersList() {
  return request("/shipping-servers/list", {
    method: "GET",
  });
}
export async function putShippingServers(data: any) {
  return request("/shipping-servers", {
    method: "put",
    data,
  });
}
export async function createShippingServers(data: any) {
  return request("/shipping-servers/add", {
    method: "post",
    data,
  });
}
export async function delShippingServers(id: string | number) {
  return request(`/shipping-servers/${id}`, {
    method: "DELETE",
  });
}
/** 获取运输公司配置 */
export async function getShippingCompanyList() {
  return request("/shipping-company/list", {
    method: "GET",
  });
}
export async function putShippingCompany(data: any) {
  return request("/shipping-company", {
    method: "put",
    data,
  });
}
export async function createShippingCompany(data: any) {
  return request("/shipping-company/add", {
    method: "post",
    data,
  });
}
export async function delShippingCompany(id: string | number) {
  return request(`/shipping-company/${id}`, {
    method: "DELETE",
  });
}
/** 获取运输路线配置 */
export async function getShippingLineList() {
  return request("/shipping-line/list", {
    method: "GET",
  });
}
export async function putShippingLine(data: any) {
  return request("/shipping-line", {
    method: "put",
    data,
  });
}
export async function createShippingLine(data: any) {
  return request("/shipping-line/add", {
    method: "post",
    data,
  });
}
export async function delShippingLine(id: string | number) {
  return request(`/shipping-line/${id}`, {
    method: "DELETE",
  });
}
/** 获取国家列表 */
export async function getCountries() {
  return request("/countries/list", {
    method: "GET",
  });
}
/** 获取运费模板配置 */
export async function getShippingLineTemplateList() {
  return request("/shipping-line-template/all", {
    method: "GET",
  });
}
export async function putShippingLineTemplate(data: any) {
  return request("/shipping-line-template", {
    method: "put",
    data,
  });
}
export async function createShippingLineTemplate(data: any) {
  return request("/shipping-line-template/add", {
    method: "post",
    data,
  });
}
export async function delShippingLineTemplate(id: string | number) {
  return request(`/shipping-line-template/${id}`, {
    method: "DELETE",
  });
}
// 上传 Logo
export async function uploadShippingLineLogo(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<{
    url: string;
  }>("/shipping-line-template/logo", {
    method: "POST",
    data: formData,
    requestType: "form", // umi 会自动设置 multipart/form-data
  });
}
export async function putSystemPurchase(auto: any) {
  return request("/system-config/purchase?auto=" + auto, {
    method: "put",
  });
}
export async function getSystemPurchase() {
  return request("/system-config/purchase", {
    method: "get",
  });
}
