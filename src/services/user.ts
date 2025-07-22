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

export async function outLogin() {
  return request("/users/logout", {
    method: "GET",
  });
}
export async function getUserInfo() {
  return request<API1.ApiResponse<API1.CurrentUser>>("/users/detail", {
    method: "GET",
  });
}
