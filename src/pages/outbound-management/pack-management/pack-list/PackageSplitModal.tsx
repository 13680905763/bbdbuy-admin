import { rebuildOutboundPacking } from "@/services";
import { Button, Card, message, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const type = "PACKAGE";

interface PackageItem {
  id: string;
  code: string;
  weight: number;
}

interface TargetBox {
  id: string;
  name: string;
  packages: PackageItem[];
}

interface PackageSplitModalProps {
  open: boolean;
  onClose: () => void;
  initialPackages?: PackageItem[];
  outboundId: string;
}

export const PackageSplitModal: React.FC<PackageSplitModalProps> = ({
  open,
  onClose,
  initialPackages = [],
  outboundId,
}) => {
  const [packagePool, setPackagePool] = useState<PackageItem[]>([]);
  const [targetBoxes, setTargetBoxes] = useState<TargetBox[]>([]);
  const [loading, setLoading] = useState(false);
  // 👉 每次 Modal 打开时重置
  useEffect(() => {
    if (open) {
      setPackagePool(initialPackages || []);
      setTargetBoxes([
        { id: "box-1", name: "包裹1", packages: [] },
        { id: "box-2", name: "包裹2", packages: [] },
      ]);
    }
  }, [open, initialPackages]);

  // ---------------- 拖拽逻辑 ----------------
  const movePackage = (
    pkg: PackageItem,
    fromBoxId: string | null,
    toBoxId: string | null
  ) => {
    if (fromBoxId === toBoxId) return;

    if (fromBoxId) {
      setTargetBoxes((prev) =>
        prev.map((b) =>
          b.id === fromBoxId
            ? { ...b, packages: b.packages.filter((p) => p.id !== pkg.id) }
            : b
        )
      );
    } else {
      setPackagePool((prev) => prev.filter((p) => p.id !== pkg.id));
    }

    if (toBoxId) {
      setTargetBoxes((prev) =>
        prev.map((b) =>
          b.id === toBoxId ? { ...b, packages: [...b.packages, pkg] } : b
        )
      );
    } else {
      setPackagePool((prev) => [...prev, pkg]);
    }
  };

  // ---------------- 包裹 ----------------
  const DraggablePackage: React.FC<{
    pkg: PackageItem;
    fromBoxId?: string;
  }> = ({ pkg, fromBoxId }) => {
    const [{ isDragging }, drag] = useDrag(
      () => ({
        type,
        item: { pkg, fromBoxId },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      }),
      [pkg, fromBoxId]
    );

    return (
      <div
        ref={drag}
        style={{
          opacity: isDragging ? 0.85 : 1,
          transform: isDragging ? "scale(0.97)" : "scale(1)",
          transition: "all 0.2s ease",
          width: 150,
          minHeight: 50,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: isDragging
            ? "0 4px 12px rgba(0,0,0,0.15)"
            : "0 2px 6px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 600,
          color: "#111827",
          cursor: "grab",
          userSelect: "none",
          padding: "6px 10px",
          textAlign: "center",
          wordBreak: "break-all",
          lineHeight: "1.4",
        }}
      >
        {pkg.code}
      </div>
    );
  };

  // ---------------- 箱子 ----------------
  const TargetBoxComponent: React.FC<{ box: TargetBox }> = ({ box }) => {
    const [, drop] = useDrop({
      accept: type,
      drop: (item: any) => {
        movePackage(item.pkg, item.fromBoxId, box.id);
      },
    });

    const removeBox = () => {
      Modal.confirm({
        title: `确认删除 ${box.name}？`,
        onOk: () => {
          setPackagePool((prev) => [...prev, ...box.packages]);
          setTargetBoxes((prev) => prev.filter((b) => b.id !== box.id));
        },
      });
    };

    return (
      <Card
        ref={drop}
        title={`${box.name} (${box.packages.length})`}
        style={{
          width: 220,
          minHeight: 180,
          marginRight: 16,
          padding: 8,
          display: "flex",
          flexDirection: "column",
        }}
        extra={
          <Button size="small" danger onClick={removeBox}>
            删除
          </Button>
        }
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            flexGrow: 1,
            overflowY: "auto",
          }}
        >
          {box.packages.map((pkg) => (
            <DraggablePackage key={pkg.id} pkg={pkg} fromBoxId={box.id} />
          ))}
        </div>
      </Card>
    );
  };

  // ---------------- 包裹池 ----------------
  const Pool: React.FC = () => {
    const [, drop] = useDrop({
      accept: type,
      drop: (item: any) => {
        movePackage(item.pkg, item.fromBoxId, null);
      },
    });

    return (
      <Card
        ref={drop}
        title={`包裹池 (${packagePool.length})`}
        style={{
          width: "100%",
          minHeight: 100,
          maxHeight: 180,
          marginBottom: 16,
          overflowY: "auto",
          padding: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {packagePool.map((pkg) => (
            <DraggablePackage key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </Card>
    );
  };

  const addBox = () => {
    const nextIndex = targetBoxes.length + 1;
    const newBox: TargetBox = {
      id: `box-${Date.now()}`,
      name: `包裹${nextIndex}`,
      packages: [],
    };
    setTargetBoxes((prev) => [...prev, newBox]);
  };

  return (
    <Modal
      title="拆分包裹"
      open={open}
      width={900}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={loading} // 🔹 绑定 loading
          onClick={async () => {
            // 1. 校验包裹池为空
            if (packagePool.length > 0) {
              message.error("请先将所有包裹分配到箱子中");
              return;
            }

            // 2. 校验每个箱子至少有一个包裹
            const emptyBox = targetBoxes.find(
              (box) => box.packages.length === 0
            );
            if (emptyBox) {
              message.error(`箱子 "${emptyBox.name}" 里没有包裹，请先分配`);
              return;
            }

            // 3. 生成二维数组
            const packageItemIdList = targetBoxes.map((box) =>
              box.packages.map((pkg) => pkg.id)
            );

            // 4. 调用接口
            try {
              setLoading(true); // 🔹 开始 loading
              const res = await rebuildOutboundPacking({
                outboundId,
                packageItemIdList,
              });
              if (res.success) {
                message.success("拆分成功");
                onClose(); // 关闭弹窗
              }
            } catch (err) {
              console.error(err);
              message.error("拆分失败，请重试");
            } finally {
              setLoading(false); // 🔹 结束 loading
            }
          }}
        >
          确认拆分
        </Button>,
      ]}
    >
      <DndProvider backend={HTML5Backend}>
        <Pool />
        <div style={{ display: "flex", marginBottom: 16 }}>
          {targetBoxes.map((box) => (
            <TargetBoxComponent key={box.id} box={box} />
          ))}
        </div>
        <Button onClick={addBox} type="dashed">
          新增箱子
        </Button>
      </DndProvider>
    </Modal>
  );
};
