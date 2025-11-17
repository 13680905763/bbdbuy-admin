"use client";

import { getOutboundPackListByPage } from "@/services";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { Button, message, Pagination, Select } from "antd";
import React, { useEffect, useRef, useState } from "react";

import { getStatusOptions, renderStatusTag } from "@/utils/status-render";
import { PackageSplitModal } from "./PackageSplitModal";

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  // ✅ 状态管理
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<Record<string, any>>({});

  // 弹窗状态
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);

  /** ✅ fetchData 不依赖外部状态，只依赖参数 */
  const fetchData = async (params?: any) => {
    const query = {
      current,
      size,
      ...params,
    };
    console.log("fetchData -> query", query);
    setLoading(true);
    try {
      const res: any = await getOutboundPackListByPage(query);
      setDataSource(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };
  const handleSplitPackage = (record: any) => {
    setCurrentRow(record);
    setSplitModalVisible(true);
  };

  // ✅ 表头配置
  const columns: ProColumns<any>[] = [
    {
      title: "出库单号",
      dataIndex: "outboundCode",
    },
    {
      title: "出库包裹号",
      dataIndex: "packingPackageCode",
    },
    {
      title: "包裹信息",
      dataIndex: "items",
      formItemProps: {
        label: "包裹唯一标识",
      },
      render: (items: any) => {
        return items?.map((item: any) => (
          <p key={item?.packageCode}>{item?.packageCode}</p>
        ));
      },
    },
    {
      title: "状态",
      dataIndex: "packingStatusCode",
      render: (value: any) => renderStatusTag("packing", value),
      renderFormItem: () => {
        return (
          <Select
            placeholder="请选择打包状态"
            allowClear
            options={getStatusOptions("packing")}
          />
        );
      },
    },
    {
      title: "上架状态",
      dataIndex: "putawayStatusCode",
      render: (value: any) => renderStatusTag("shelf", value),
    },
    {
      title: "打包人",
      dataIndex: "updateUserName",
      hideInSearch: true,
    },
    {
      title: "打包时间",
      dataIndex: "updateTime",
      hideInSearch: true,
      render: (_, record: any) => {
        const packingStatusCode = record.packingStatusCode;
        const updateTime = record.updateTime;
        if (packingStatusCode == 2021) return "--";
        return updateTime;
      },
    },
    {
      title: "操作",
      key: "canSplit",
      render: (_: any, record: any) => {
        if (record?.canSplit) {
          return (
            <Button type="primary" onClick={() => handleSplitPackage(record)}>
              拆分包裹
            </Button>
          );
        }
        return "-"; // 没有按钮时必须返回 null，否则 Table 渲染会报错
      },
      hideInSearch: true,
    },
  ];
  /** ✅ 搜索提交 */
  const onSubmitSearch = (values: any) => {
    console.log("values", values);
    // const [startTime, endTime] = values.createTime || [];
    const filterParams = {
      outboundCode: values.outboundCode,
      packingPackageCode: values.packingPackageCode,
      packageCode: values.items,
      packingStatusCode: values.packingStatusCode,
      // createTimeFrom: startTime
      //   ? moment(startTime).format("YYYY-MM-DD HH:mm:ss")
      //   : undefined,
      // createTimeTo: endTime
      //   ? moment(endTime).format("YYYY-MM-DD HH:mm:ss")
      //   : undefined,
    };
    setFilters(filterParams);
    setCurrent(1);
    fetchData({ current: 1, ...filterParams });
  };
  /** ✅ 分页变化 */
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrent(page);
    setSize(pageSize || 10);
    fetchData({ current: page, size: pageSize, ...filters });
  };

  /** ✅ 重置搜索 */
  const handleReset = () => {
    setFilters({});
    setCurrent(1);
    formRef.current?.resetFields();
    fetchData({ current: 1 });
  };

  /** ✅ 初始化加载 */
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <PageContainer>
      <ProTable
        bordered
        rowKey="id"
        columns={columns}
        size="small"
        formRef={formRef}
        dataSource={dataSource}
        loading={loading}
        actionRef={actionRef}
        pagination={false}
        onSubmit={onSubmitSearch}
        onReset={handleReset}
        search={{
          labelWidth: "auto",
          defaultCollapsed: false, // ❗ 默认展开
        }}
        options={{
          reload: false,
          fullScreen: true,
          density: false,
        }}
      />

      <div style={{ padding: 16, textAlign: "right" }}>
        <Pagination
          current={current}
          pageSize={size}
          total={total}
          showSizeChanger
          onChange={handlePageChange}
        />
      </div>

      <PackageSplitModal
        open={splitModalVisible} // 控制弹窗显示
        onClose={() => setSplitModalVisible(false)}
        initialPackages={
          currentRow?.items?.map((item: any) => {
            return {
              id: item.id,
              code: item.packageCode,
              weight: item.weight,
            };
          }) || undefined
        } // 当前行包裹数据
        outboundId={currentRow?.outboundId}
      />
    </PageContainer>
  );
};

export default TableList;
