import { AvatarDropdown, AvatarName, Footer } from "@/components";
import type { Settings as LayoutSettings } from "@ant-design/pro-components";
import { SettingDrawer } from "@ant-design/pro-components";
import "@ant-design/v5-patch-for-react-19";
import type { RequestConfig, RunTimeLayoutConfig } from "@umijs/max";
import { history } from "@umijs/max";
import { useEffect } from "react";
import defaultSettings from "../config/defaultSettings";
import { errorConfig } from "./requestErrorConfig";
import { getUserInfo } from "./services";
import { closeWS, connectWS } from "./utils/ws";
const isDev = process.env.NODE_ENV === "development";
const loginPath = "/login";

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: any;
  loading?: boolean;
  fetchUserInfo?: () => Promise<any>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await getUserInfo();
      return msg.data;
    } catch (_error) {
      history.push(loginPath);
    }
    return undefined;
  };
  const currentUser = await fetchUserInfo();


  // ✅ 如果已经登录但仍在登录页，跳转首页
  if (location.pathname === loginPath && currentUser) {
    history.replace("/");
  }

  // ✅ 如果不是登录页 且未登录，跳转登录页
  if (location.pathname !== loginPath && !currentUser) {
    history.replace(loginPath);
  }

  return {
    fetchUserInfo,
    currentUser,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  // console.log("initialState", initialState);

  useEffect(() => {
    if (initialState?.currentUser?.id) {
      // 建立 WebSocket 连接
      connectWS();
    } else {
      // 未登录时，关闭 WebSocket
      closeWS();
    }

    return () => {
      // 页面卸载时关闭
      closeWS();
    };
  }, [initialState?.currentUser?.id]);
  return {
    // actionsRender: () => [<Question key="doc" />],
    avatarProps: {
      src: initialState?.currentUser?.avatarFilePath,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    // waterMarkProps: {
    //   content: initialState?.currentUser?.nickName,
    // },
    footerRender: () => {
      console.log("location.pathname", location.pathname);

      if (location.pathname === "/message/list") {
        return null; // 消息页面不显示 footer
      }
      return <Footer />; // 其它页面显示
    },

    menuHeaderRender: false,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },

    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
console.log('process.env.UMI_APP_BASE_API', process.env.UMI_APP_BASE_API);

export const request: RequestConfig = {
  baseURL: process.env.UMI_APP_BASE_API,
  withCredentials: true,
  timeout: 500000,
  ...errorConfig,
};
