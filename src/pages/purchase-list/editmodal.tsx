import { EditableProTable } from "@ant-design/pro-components";
import {
  AutoComplete,
  Image,
  InputNumber,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const { Text } = Typography;
const LOGISTICS_COMPANIES = [
  "顺丰速运",
  "中通快递",
  "圆通速递",
  "申通快递",
  "韵达快递",
  "京东物流",
  "邮政快递包裹",
  "德邦快递",
  "极兔速递",
  "跨越速运",
  "天天快递",
  "百世快递",
  "宅急送",
  "EMS",
  "全峰快递",
  "优速快递",
  "快捷快递",
  "联邦快递（FedEx国内）",
  "中邮快递",
  "能达速递",
];
// 商品选择器组件
const ProductQuantitySelector = ({ value, onChange, products }: any) => {
  console.log("value", value);

  const list = Array.isArray(value) ? value : [];
  // 生成选项列表
  const selectOptions = (products || []).map((p: any) => {
    // 构造显示名称：图片 + 规格
    const spec = p.propAndValue?.propName_valueName || "";
    return {
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image
            src={p.skuPicUrl || p.picUrl}
            width={24}
            height={24}
            preview={false}
            style={{ borderRadius: 2, flexShrink: 0 }}
          />
          <Text style={{ maxWidth: 300 }} ellipsis={{ tooltip: spec }}>
            {spec}
          </Text>
        </div>
      ),
      value: p.id,
    };
  });

  const handleSelectChange = (newValues: string[]) => {
    const currentKeys = list.map((item: any) => item.value || item.id);

    // 找出被删除的
    const keysToRemove = currentKeys.filter(
      (key: string) => !newValues.includes(key)
    );
    // 找出新增的
    const keysToAdd = newValues.filter(
      (key: string) => !currentKeys.includes(key)
    );

    let newList = [...list];

    if (keysToRemove.length > 0) {
      newList = newList.filter(
        (item: any) => !keysToRemove.includes(item.value || item.id)
      );
    }

    keysToAdd.forEach((key: string) => {
      newList.push({ value: key, quantity: 1 });
    });

    onChange(newList);
  };

  const handleQuantityChange = (val: string, quantity: number | null) => {
    const newList = list.map((item: any) =>
      (item.value || item.id) === val
        ? { ...item, quantity: quantity || 1 }
        : item
    );
    onChange(newList);
  };

  const tagRender = (props: any) => {
    const { value, closable, onClose } = props;
    console.log("tagRender value", value);

    const item = list.find((i: any) => (i.value || i.id) == value);
    const product = products.find((p: any) => p.id == value);

    // 如果找不到 item 或 product，但 value 存在，尝试用 value 直接显示
    // 这种情况可能发生在数据刚初始化，或者 id 类型不匹配时
    if (!item) return <Tag>{value}</Tag>;
    if (!product)
      return (
        <Tag>
          {value} x {item.quantity}
        </Tag>
      );

    const spec = product.propAndValue?.propName_valueName || "";

    return (
      <Tooltip title={spec || product.productTitle} placement="topLeft">
        <Tag
          closable={closable}
          onClose={onClose}
          style={{
            marginRight: 3,
            display: "flex",
            alignItems: "center",
            padding: "2px 8px",
          }}
        >
          <Image
            src={product.skuPicUrl || product.picUrl}
            width={20}
            height={20}
            preview={false}
            style={{ borderRadius: 2, marginRight: 0, flexShrink: 0 }}
          />
          <InputNumber
            size="small"
            min={1}
            value={item.quantity}
            onChange={(v) => handleQuantityChange(item.value || item.id, v)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 50, marginLeft: 6, flexShrink: 0 }}
          />
        </Tag>
      </Tooltip>
    );
  };

  return (
    <Select
      mode="multiple"
      placeholder="请选择商品"
      options={selectOptions}
      value={list.map((item: any) => item.value || item.id)}
      onChange={handleSelectChange}
      tagRender={tagRender}
      style={{ width: "100%", minWidth: 200 }}
      optionLabelProp="children" // 使用 label 作为选项显示内容
      filterOption={(input, option: any) =>
        (option?.searchText || "").toLowerCase().includes(input.toLowerCase())
      }
    />
  );
};

export interface EditModalRef {
  validate: () => Promise<boolean>;
}

interface EditModalProps {
  products: any[]; // 外部传入的商品列表数据
  value?: any[]; // 受控模式值
  onChange?: (value: any[]) => void; // 值变更回调
}

const EditModal = forwardRef<EditModalRef, EditModalProps>(
  ({ products = [], value, onChange }, ref) => {
    const [dataSource, setDataSource] = useState<any>([]);
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);

    useImperativeHandle(ref, () => ({
      validate: async () => {
        if (!dataSource || dataSource.length === 0) {
          message.error("请至少添加一条发货记录");
          return false;
        }

        const skuTotals: Record<string, number> = {};

        for (const row of dataSource) {
          if (!row.logisticsCompany) {
            message.error("请填写快递公司");
            return false;
          }
          if (!row.logisticsCode) {
            message.error("请填写快递单号");
            return false;
          }
          if (!row.productList || row.productList.length === 0) {
            message.error("请选择商品");
            return false;
          }

          for (const item of row.productList) {
            const skuId = item.value || item.id;
            const qty = item.quantity;
            skuTotals[skuId] = (skuTotals[skuId] || 0) + qty;
          }
        }

        // 校验数量总和
        for (const [skuId, totalQty] of Object.entries(skuTotals)) {
          const product = products.find((p: any) => p.id === skuId);
          if (product) {
            const maxQty = product.purchaseQuantity || product.quantity || 0;
            if (totalQty > maxQty) {
              message.error(
                `商品 ${product.productTitle} 分配数量(${totalQty}) 超过采购总数(${maxQty})`
              );
              return false;
            }
          }
        }

        return true;
      },
    }));

    // 监听外部 value 变化
    useEffect(() => {
      if (value) {
        console.log("外面有数据 回显", value);

        setDataSource(value);
      }
    }, [value]);

    // 初始化默认一行数据 (仅当非受控或初始无数据时)
    useEffect(() => {
      console.log("初始化");

      if ((!value || value.length === 0) && dataSource.length === 0) {
        console.log("外面没数据 初始化一条");

        const defaultId = Date.now().toString();
        const initialData = [
          {
            id: defaultId,
            productList: [],
          },
        ];
        setDataSource(initialData);
        setEditableRowKeys([defaultId]);
      }
    }, []);

    const handleDataSourceChange = (newData: any[]) => {
      console.log("表格的onchage触发了", newData);

      // 过滤掉 index 字段（如果存在），并移除 id
      const cleanData = newData.map(({ index, ...rest }: any) => {
        // 转换 productList 结构以匹配后端需求
        const productList = rest.productList?.map((item: any) => ({
          id: item.value || item.id, // 兼容处理
          quantity: item.quantity,
        }));

        return {
          ...rest,
          productList,
        };
      });
      console.log("cleanData", cleanData);

      setDataSource(newData); // 内部状态保持完整（包含 id 等，用于编辑表格）
      onChange?.(cleanData); // 向上层传递清洗后的数据
    };

    // 辅助函数：根据ID获取商品显示内容（用于非编辑态）
    const renderProductItem = (id: string, quantity: number) => {
      const product = products.find((p) => p.id == id);
      console.log("id", id, product, products);
      if (!product)
        return (
          <Tag>
            {id} x {quantity}
          </Tag>
        );

      const spec = product.propAndValue?.propName_valueName || "";

      return (
        <Tooltip title={spec || product.productTitle} placement="topLeft">
          <Tag
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 8px",
            }}
          >
            <Image
              src={product.skuPicUrl || product.picUrl}
              width={24}
              height={24}
              preview={false}
              style={{ borderRadius: 2, marginRight: 0, flexShrink: 0 }}
            />

            <span style={{ marginLeft: 4, flexShrink: 0 }}>x {quantity}</span>
          </Tag>
        </Tooltip>
      );
    };

    const columns: any = [
      {
        title: "快递公司",
        dataIndex: "logisticsCompany",
        width: "15%",
        formItemProps: {
          rules: [{ required: true, message: "请输入快递公司" }],
        },
        renderFormItem: () => {
          return (
            <AutoComplete
              options={LOGISTICS_COMPANIES.map((c) => ({ value: c }))}
              placeholder="请输入或选择快递公司"
              filterOption={(inputValue: any, option: any) =>
                option!.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          );
        },
      },
      {
        title: "快递单号",
        width: "15%",
        dataIndex: "logisticsCode",
        formItemProps: {
          rules: [{ required: true, message: "请输入快递单号" }],
        },
      },
      {
        title: "商品信息",
        dataIndex: "productList",
        key: "productList",
        width: "55%",
        formItemProps: {
          rules: [{ required: true, message: "请选择商品" }],
        },
        renderFormItem: () => <ProductQuantitySelector products={products} />,
        render: (_: any, record: any) => {
          const list = record.productList || [];
          if (!Array.isArray(list) || list.length === 0) return "-";
          return (
            <Space size={8} wrap>
              {list.map((item: any) =>
                renderProductItem(item.value || item.id, item.quantity)
              )}
            </Space>
          );
        },
      },
      {
        title: "操作",
        valueType: "option",
        width: "15%",
        render: (text: any, record: any, _: any, action: any) => [
          <a
            key="editable"
            onClick={() => {
              action?.startEditable?.(record.id);
            }}
          >
            编辑
          </a>,
          <a
            key="delete"
            onClick={() => {
              const newData = dataSource.filter(
                (item: any) => item.id !== record.id
              );
              setDataSource(newData);
            }}
          >
            删除
          </a>,
        ],
      },
    ];

    return (
      <EditableProTable
        rowKey="id"
        maxLength={5}
        recordCreatorProps={{
          position: "bottom",
          record: () => ({
            id: Date.now().toString(),
            productList: [],
          }),
          creatorButtonText: "新增快递信息",
        }}
        loading={false}
        columns={columns}
        value={dataSource}
        onChange={handleDataSourceChange}
        editable={{
          type: "multiple",
          editableKeys,
          onSave: async (rowKey, data, row) => {
            console.log("校验一下", data, row);

            // 计算包含当前行在内的所有商品总数
            const skuTotals: Record<string, number> = {};

            // 1. 统计其他行的数量
            const otherRows = dataSource.filter(
              (item: any) => item.id !== rowKey
            );
            for (const r of otherRows) {
              if (r.productList) {
                for (const item of r.productList) {
                  const skuId = item.value || item.id;
                  skuTotals[skuId] = (skuTotals[skuId] || 0) + item.quantity;
                }
              }
            }
            console.log("skuTotals", skuTotals);

            // 2. 统计当前正在保存的行的数量
            if (data.productList) {
              for (const item of data.productList) {
                const skuId = item.value || item.id;
                skuTotals[skuId] = (skuTotals[skuId] || 0) + item.quantity;
              }
            }

            // 3. 校验总数是否超标
            for (const [skuId, totalQty] of Object.entries(skuTotals)) {
              const product = products.find((p: any) => p.id === skuId);
              if (product) {
                const maxQty =
                  product.purchaseQuantity || product.quantity || 0;
                if (totalQty > maxQty) {
                  message.error(
                    ` ${product.propAndValue?.propName_valueName} 分配数量(${totalQty}) 超过采购总数(${maxQty})`
                  );
                  // 抛出错误以阻止保存
                  throw new Error(
                    ` ${product.propAndValue?.propName_valueName} 分配数量超标`
                  );
                }
              }
            }
          },
          onChange: setEditableRowKeys,
        }}
      />
    );
  }
);

export default EditModal;
