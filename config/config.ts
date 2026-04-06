// https://umijs.org/config/

import { defineConfig } from "@umijs/max";
import { join } from "node:path";
import defaultSettings from "./defaultSettings";
import proxy from "./proxy";
import routes from "./routes";
const { REACT_APP_ENV = "dev" } = process.env;

/**
 * @name 使用公共路径
 * @description 部署时的路径，如果部署在非根目录下，需要配置这个变量
 * @doc https://umijs.org/docs/api/config#publicpath
 */
const PUBLIC_PATH: string = "/";

export default defineConfig({
  /**
   * @name 开启 hash 模式
   * @description 让 build 之后的产物包含 hash 后缀。通常用于增量发布和避免浏览器加载缓存。
   * @doc https://umijs.org/docs/api/config#hash
   */
  base: PUBLIC_PATH,
  hash: true,
  publicPath: PUBLIC_PATH,

  /**
   * @name 路由的配置，不在路由中引入的文件不会编译
   * @description 只支持 path，component，routes，redirect，wrappers，title 的配置
   * @doc https://umijs.org/docs/guides/routes
   */
  routes,

  /**
   * @name 主题的配置
   * @description 虽然叫主题，但是其实只是 less 的变量设置
   * @doc antd的主题设置 https://ant.design/docs/react/customize-theme-cn
   * @doc umi 的 theme 配置 https://umijs.org/docs/api/config#theme
   */
  theme: { '@primary-color': '#f0700c' },

  /**
   * @name moment 的国际化配置
   * @description 如果对国际化没有要求，打开之后能减少js的包大小
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: true,

  /**
   * @name 代理配置
   * @description 可以让你的本地服务器代理到你的服务器上，这样你就可以访问服务器的数据了
   * @see 要注意以下 代理只能在本地开发时使用，build 之后就无法使用了。
   * @doc 代理介绍 https://umijs.org/docs/guides/proxy
   * @doc 代理配置 https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],

  /**
   * @name 快速热更新配置
   * @description 一个不错的热更新组件，更新时可以保留 state
   */
  fastRefresh: true,

  //============== 以下都是max的插件配置 ===============
  model: {},
  initialState: {},
  title: "Ant Design Pro",
  layout: {
    locale: true,
    ...defaultSettings,
  },
  moment2dayjs: {
    preset: "antd",
    plugins: ["duration"],
  },
  antd: {
    appConfig: {},
    configProvider: {
      theme: {
        cssVar: true,
        token: {
          fontFamily: "AlibabaSans, sans-serif",
        },
      },
    },
  },
  request: {},
  access: {},
  headScripts: [
    {
      src: join(PUBLIC_PATH, "scripts/loading.js"),
      async: true,
    },
  ],

  //================ pro 插件配置 =================
  presets: ["umi-presets-pro"],
  openAPI: [
    {
      requestLibPath: "import { request } from '@umijs/max'",
      schemaPath: join(__dirname, "oneapi.json"),
      mock: false,
    },
    {
      requestLibPath: "import { request } from '@umijs/max'",
      schemaPath: "https://gw.alipayobjects.com/os/antfincdn/CA1dOm%2631B/openapi.json",
      projectName: "swagger",
    },
  ],
  mock: {
    include: ["mock/**/*", "src/pages/**/_mock.ts"],
  },
  mako: {},
  esbuildMinifyIIFE: true,
  requestRecord: {},
  exportStatic: {},

  define: {
    'process.env.UMI_APP_BASE_API': JSON.stringify(process.env.UMI_APP_BASE_API || '/admin-api'),
    'process.env.UMI_APP_WS_URL': JSON.stringify(process.env.UMI_APP_WS_URL),
  },
});
