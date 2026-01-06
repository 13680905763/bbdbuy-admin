import { request } from "@umijs/max";

/** 下载 APK */
export async function downloadApk() {
  return request("/download/apk", {
    method: "GET",
    responseType: "blob",
    getResponse: true,
  });
}

/** 下载插件 */
export async function downloadPlugin() {
  return request("/download/plugin", {
    method: "GET",
    responseType: "blob",
    getResponse: true,
  });
}
