// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";
type Order = {
  orderCode: string;
  customerName: string;
  status: string;
  [key: string]: any;
  products: Product[];
};

type Product = {
  id: string;
  productTitle: string;
  quantity: number;
  price: number;
  [key: string]: any;
};

type FlatRow = Product & {
  orderCode: string;
  customerName: string;
  status: string;
  orderRowSpan?: number;
};
/** 获取当前的用户 GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>("/api/currentUser", {
    method: "GET",
    ...(options || {}),
  });
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>("/api/login/outLogin", {
    method: "POST",
    ...(options || {}),
  });
}

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

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>("/api/notices", {
    method: "GET",
    ...(options || {}),
  });
}
function transformOrderListForTable(orderList: Order[]): FlatRow[] {
  const result: FlatRow[] = [];

  for (const order of orderList) {
    const { products, ...orderInfo } = order;
    const rowSpan = products.length;

    products.forEach((product, index) => {
      result.push({
        ...product,
        ...orderInfo,
        orderRowSpan: index === 0 ? rowSpan : 0, // 只有第一行加 rowSpan
      });
    });
  }

  return result;
}
/** 获取规则列表 GET /api/rule */
export async function rule(params: {
  // query
  /** 当前的页码 */
  current?: number;
  /** 页面的容量 */
  pageSize?: number;
}) {
  return request<API.RuleList>("/orders/page", {
    method: "POST",
    data: {
      current: params.current,
      /** 页面的容量 */
      size: params.pageSize,
    },
  }).then((res: any) => {
    console.log(
      "transformOrderListForTable(res?.data?.records)",
      transformOrderListForTable(res?.data?.records)
    );

    return {
      data: transformOrderListForTable(res?.data?.records),
      total: res?.data?.total,
      success: true,
    };
  });
}

/** 更新规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>("/api/rule", {
    method: "POST",
    data: {
      method: "update",
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>("/api/rule", {
    method: "POST",
    data: {
      method: "post",
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>("/api/rule", {
    method: "POST",
    data: {
      method: "delete",
      ...(options || {}),
    },
  });
}
