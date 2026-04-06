import type { RequestOptions } from "@@/plugin-request/request";
import type { RequestConfig } from "@umijs/max";
import { history } from "@umijs/max";
import { message } from "antd";
/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  baseURL: (process.env.UMI_APP_BASE_API || "").replace(/^["']|["']$/g, ""),
  // 错误处理： umi@3 的错误处理方案。
  errorConfig: {
    errorThrower: (res) => {
      if (!res?.success) message.error(res?.msg);
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      if (error.response) {
        // Axios 的错误
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        const status = error.response.status;
        if (status === 401) {
          message.warning("登录失效，请重新登录");
          setTimeout(() => {
            history.replace("/login");
          }, 1500); // 延迟 1.5 秒跳转，足够展示提示
          return Promise.reject(error);
        }
        message.error(`Response status:${error.response.status}`);
      } else if (error.request) {
        message.error("None response! Please retry.");
      } else {
        message.error("Request error, please retry.");
      }
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // 拦截请求配置，进行个性化处理。
      config.headers = config.headers ?? {};
      config.headers["X-Language"] = "zh";
      config.headers["X-Currency"] = "CNY";
      config.headers["X-Timezone"] = "Asia/Shanghai";
      return { ...config };
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      return response;
    },
  ],
};
