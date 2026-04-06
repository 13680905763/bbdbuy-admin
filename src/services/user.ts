import { request } from "@umijs/max";

/** 登录接口 POST /users/login */
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

/** 获取后端公钥 GET /users/public-key */
export async function getPublicKey(options?: { [key: string]: any }) {
  return request<{
    data: string;
    success: boolean;
  }>("/users/public-key", {
    method: "GET",
    ...(options || {}),
  });
}

export async function outLogin() {
  return request("/users/logout", {
    method: "GET",
  });
}
export async function getUserInfo() {
  return request<any>("/users/detail", {
    method: "GET",
  });
}
/** 获取订单列表 POST /orders/page */
export async function CommonSearch(key: any) {
  return request<any>(`/search?key=${key}`, {
    method: "GET",
  });
}
/** 下载app */
export async function downloadApk() {
  return request(`/download/apk`, {
    method: "GET",
    responseType: "blob",
    getResponse: true,
  });
}
/** 下载插件 */
export async function downloadPlugin() {
  return request(`/download/plugin`, {
    method: "GET",
    responseType: "blob",
    getResponse: true,
  });
}
