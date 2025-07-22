export default [
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
    name: "采购单",
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
        redirect: "/warehouse-management/delivery-note",
      },
      {
        path: "/warehouse-management/delivery-note",
        name: "收货单",
        // component: "./warehouse-management/delivery-note",
        component: "./developing",
      },
      {
        path: "/warehouse-management/particular-paper",
        name: "验货单",
        component: "./warehouse-management/particular-paper",
      },
      {
        path: "/warehouse-management/c",
        name: "拍照",
        component: "./warehouse-management/photo-capture",
      },
      {
        path: "/warehouse-management/d",
        name: "上架管理",
        component: "./developing",
      },
    ],
  },
  {
    path: "/waybill-management",
    name: "运单管理",
    icon: "table",
    component: "./developing",
  },
  {
    path: "/outbound-order",
    name: "出库单",
    icon: "table",
    access: "canAdmin",
    routes: [
      {
        path: "/outbound-order",
        redirect: "/developing",
      },
      {
        path: "/outbound-order/a",
        name: "拣货",
        component: "./developing",
      },
      {
        path: "/outbound-order/b",
        name: "打包",
        component: "./developing",
      },
      {
        path: "/outbound-order/c",
        name: "配货",
        component: "./developing",
      },
      {
        path: "/outbound-order/d",
        name: "上架",
        component: "./developing",
      },
      {
        path: "/outbound-order/e",
        name: "发货",
        component: "./developing",
      },
    ],
  },
  { path: "/", redirect: "/dashboard" },
  { path: "*", layout: false, component: "./404" },
];
