import { request } from '@umijs/max';

/** 获取控制台数据 */
export async function getConsoleData() {
  return request('/console', {
    method: 'GET',
  });
}
