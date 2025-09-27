import { request } from "@umijs/max";

// 获取大厅未接待用户列表
export async function fetchHallUsers() {
  return request("/api/hall-users"); // 返回 [{id,name,email,avatarUrl}]
}

// 获取聊天历史
export async function fetchChatHistory(
  customerId: number | string,
  current: number
) {
  return request(
    `/service-chat/chatRecord?customerId=${customerId}&current=${current}`
  ); // 返回最近 20 条消息
}

// 接待大厅用户
export async function acceptUser(customerId: number | string) {
  return request(`/service-chat/receiveCustomer?customerId=${customerId}`, {
    method: "get",
  });
}
// 完成当前聊天工单
export async function finishWorkOrder(user: any) {
  return request(`/service-chat/finishWorkOrder`, {
    method: "post",
    data: user,
  });
}
