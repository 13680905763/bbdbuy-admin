import { request } from "@umijs/max";

export const messageApi = {
    listSystemMessage: (params: any): Promise<any[]> => request("/system-notice/page", {
        method: "POST",
        data: params,
    }),
    readSystemMessage: (id: string): Promise<any> => request(`/system-notice/${id}`, {
        method: "PUT",
    }),
}