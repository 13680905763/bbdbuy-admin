import { request } from "@umijs/max";

// 获取大厅未接待用户列表
export async function fetchHallUsers() {
  return request("/api/hall-users"); // 返回 [{id,name,email,avatarUrl}]
}

// 获取聊天历史
export async function fetchChatHistory(
  customerId: number | string,
  current: number,
  bizCode?: string
) {
  let url = `/service-chat/chatRecord?customerId=${customerId}&current=${current}`;
  if (bizCode) {
    url += `&bizCode=${bizCode}`;
  }
  return request(url); // 返回最近 20 条消息
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

// 已读客户消息
export async function readChatMessages(messageIds: string[]) {
  return request(`/service-chat/read`, {
    method: "PUT",
    data: messageIds,
  });
}

/**
 * 上传聊天图片
 * @param file 要上传的文件
 * @returns 上传结果
 */
export async function uploadChatImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await request("/service-chat/upload", {
      method: "POST",
      data: formData,
      requestType: "form", // ✅ umi-request 处理 multipart/form-data
      headers: {
        // 不要手动写 Content-Type，否则会丢失 boundary
      },
    });

    return response;
  } catch (error) {
    console.error("聊天图片上传失败:", error);
    throw error;
  }
}

// 更新设置（置顶、标签等）
export async function receiveSettings(data: Record<string, { top?: boolean; label?: string[] }>) {
  return request(`/service-chat/receiveSettings`, {
    method: "POST",
    data,
  });
}

/**
 * 采购单/订单 联系客户
 * @param customerId 客户ID
 * @param bizCode 业务单号 (订单号)
 */
export async function contactCustomer(params: { customerId: string; bizCode: string }) {
  return request(`/service-chat/contactCustomer`, {
    method: "get",
    params,
  });
}

/**
 * 获取客户的聊天列表项（比如按业务订单隔离的会话）
 */
export async function fetchCustomerChatContextList(customerId: string) {
  return request(`/service-chat-list/${customerId}`, {
    method: "GET",
  });
}

/**
 * 删除特定的聊天列表项
 */
export async function deleteCustomerChatContext(bizCode: string) {
  return request(`/service-chat-list/${bizCode}`, {
    method: "DELETE",
  });
}

