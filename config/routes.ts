export default [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    routes: [{ name: "登录", path: "/login", component: "./login" }],
    layout: false,
  },
  {
    path: "/dashboard",
    name: "控制台",
    icon: "dashboard",
    component: "./Dashboard",
  },
  // {
  //   path: "/admin",
  //   name: "管理页",
  //   icon: "crown",
  //   access: "canAdmin",
  //   routes: [
  //     { path: "/admin", redirect: "/admin/sub-page" },
  //     { path: "/admin/sub-page", name: "二级管理页", component: "./Admin" },
  //   ],
  // },
  // {
  //   path: "/order-management",
  //   name: "订单列表",
  //   icon: "table",
  //   access: "canAdmin",
  //   routes: [
  //     { path: "/order-management", redirect: "/order-management/order-list" },
  //     {
  //       path: "/order-management/order-list",
  //       name: "订单列表",
  //       component: "./order-management/order-list",
  //     },
  //     {
  //       path: "/order-management/purchase-list",
  //       name: "采购单列表",
  //       component: "./order-management/purchase-list",
  //     },
  //   ],
  // },
  {
    path: "/order-list",
    name: "订单列表",
    icon: "ShoppingCartOutlined",
    component: "./order-list",
  },
  {
    path: "/purchase-list",
    name: "采购列表",
    icon: "table",
    component: "./purchase-list",
  },
  {
    path: "/warehouse-management",
    name: "入库管理",
    icon: "BankOutlined",
    access: "canAdmin",
    routes: [
      {
        path: "/warehouse-management",
        redirect: "/warehouse-management/receive-warehouse-list",
      },
      {
        path: "/warehouse-management/receive-warehouse-list",
        name: "到库列表",
        component: "./warehouse-management/receive-warehouse-list",
      },
      {
        path: "/warehouse-management/delivery-list",
        name: "收货列表",
        component: "./warehouse-management/delivery-list",
      },
      {
        path: "/warehouse-management/inspection-management",
        name: "验货管理",
        routes: [
          {
            name: "验货列表",
            path: "/warehouse-management/inspection-management/inspection-list",
            component:
              "./warehouse-management/inspection-management/inspection-list",
          },
          {
            name: "验货",
            path: "/warehouse-management/inspection-management/inspection-scan",
            component:
              "./warehouse-management/inspection-management/inspection-scan",
          },
        ],
      },
      {
        path: "/warehouse-management/photo-list",
        name: "拍照列表",
        component: "./warehouse-management/photo-list",
      },
      {
        path: "/warehouse-management/putaway-list",
        name: "上架列表",
        component: "./warehouse-management/putaway-list",
      },
      // {
      //   path: "/warehouse-management/d",
      //   name: "上架单",
      //   component: "./developing",
      // },
    ],
  },

  {
    path: "/outbound-management",
    name: "出库管理",
    icon: "table",
    access: "canAdmin",
    routes: [
      {
        path: "/outbound-management",
        redirect: "/outbound-management/outbound-list",
      },
      {
        path: "/outbound-management/outbound-list",
        name: "出库列表",
        component: "./outbound-management/outbound-list",
      },
      {
        path: "/outbound-management/outbound-picking-list",
        name: "拣货列表",
        component: "./outbound-management/outbound-picking-list",
      },
      {
        path: "/outbound-management/pack-management",
        name: "打包管理",
        routes: [
          {
            name: "打包列表",
            path: "/outbound-management/pack-management/pack-list",
            component: "./outbound-management/pack-management/pack-list",
          },
          {
            name: "打包",
            path: "/outbound-management/pack-management/pack",
            component: "./outbound-management/pack-management/pack",
          },
        ],
      },
      {
        path: "/outbound-management/putaway-list",
        name: "上架列表",
        component: "./outbound-management/putaway-list",
      },
      {
        path: "/outbound-management/send-list",
        name: "发货列表",
        component: "./outbound-management/send-list",
      },
    ],
  },
  {
    path: "/config",
    name: "配置管理",
    icon: "BankOutlined",
    access: "canAdmin",
    routes: [
      {
        path: "/config",
        redirect: "/config/rate",
      },
      {
        path: "/config/rate",
        name: "汇率配置",
        component: "./config/rate",
      },
      {
        path: "/config/promotion",
        name: "推广配置",
        component: "./config/promotion",
      },
      {
        path: "/config/coupon",
        name: "优惠券配置",
        component: "./config/coupon",
      },
      {
        path: "/config/shipping",
        name: "路线配置",
        routes: [
          {
            name: "服务商配置",
            path: "/config/shipping/servers",
            component: "./config/shipping/servers",
          },
          {
            name: "运输公司配置",
            path: "/config/shipping/company",
            component: "./config/shipping/company",
          },
          {
            name: "路线配置",
            path: "/config/shipping/line",
            component: "./config/shipping/line",
          },
          {
            name: "运费模板配置",
            path: "/config/shipping/lineTemplate",
            component: "./config/shipping/lineTemplate",
          },
        ],
      },
      {
        path: "/config/servers",
        name: "附加服务配置",
        component: "./config/servers",
      },
      {
        path: "/config/goodsType",
        name: "货物类别配置",
        component: "./config/goodsType",
      },
      {
        path: "/config/sys",
        name: "系统配置",
        component: "./config/sys",
      },
    ],
  },
  {
    path: "/message",
    name: "消息管理",
    icon: "BankOutlined",
    access: "canAdmin",
    routes: [
      {
        path: "/message",
        redirect: "/message/list",
      },
      {
        path: "/message/list",
        name: "消息",
        component: "./message/list",
      },
      // {
      //   path: "/message/management",
      //   name: "消息管理",
      //   component: "./message/management",
      // },
    ],
  },
  {
    path: "/refund",
    name: "退款管理",
    icon: "BankOutlined",
    access: "canAdmin",
    routes: [
      {
        path: "/refund",
        redirect: "/refund/orderList",
      },
      {
        path: "/refund/orderList",
        name: "订单退款",
        component: "./refund/orderList",
      },
      // {
      //   path: "/refund/waybillList",
      //   name: "运单退款",
      //   component: "./refund/waybillList",
      // },
    ],
  },
  {
    path: "/mock-list",
    name: "测试数据模拟",
    icon: "ShoppingCartOutlined",
    component: "./mock-list",
  },

  { path: "/", redirect: "/dashboard" },
  { path: "*", layout: false, component: "./404" },
];
