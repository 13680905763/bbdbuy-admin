import { CameraOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Image, Input, message, Spin } from "antd";
import React, { useRef, useState } from "react";
import styles from "./PhotoCapture.module.less";

const MAX_IMAGES = 8;

const mockProductInfo = {
  code: "1234567890",
  name: "示例商品",
  desc: "这是一个示例商品信息，仅供测试展示。",
};

const PhotoCapture: React.FC = () => {
  const [uploading, setUploading] = useState(false);

  const [scanValue, setScanValue] = useState("");
  const [productInfo, setProductInfo] = useState<any>(null);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = () => {
    if (!scanValue.trim()) return;
    // 假数据填充
    setProductInfo({
      ...mockProductInfo,
      code: scanValue.trim(),
    });
    setScanValue("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!productInfo) {
      message.error("请先扫码获取商品信息");
      return;
    }
    if (files.length === 0) return;

    for (const file of files) {
      if (images.length >= MAX_IMAGES) {
        message.warning(`最多只能上传 ${MAX_IMAGES} 张照片`);
        break;
      }

      const formData = new FormData();
      formData.append("code", productInfo.code);
      formData.append("image", file);

      setUploading(true); // 👈 设置上传中
      try {
        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        setImages((prev) => [...prev, file]);
        message.success("上传成功");
      } catch (err) {
        console.error(err);
        message.error("上传失败");
      } finally {
        setUploading(false); // 👈 上传完成或失败都取消 loading
      }
    }

    e.target.value = "";
  };

  const handleCapture = () => {
    if (images.length >= MAX_IMAGES) {
      message.warning(`最多只能上传 ${MAX_IMAGES} 张照片`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
  };

  const handleDelete = (index: number) => {
    const newList = [...images];
    newList.splice(index, 1);
    setImages(newList);
  };

  const handleUpload = async () => {
    if (!productInfo) {
      message.error("请先扫码获取商品信息");
      return;
    }
    if (images.length === 0) {
      message.warning("请先拍照");
      return;
    }

    const formData = new FormData();
    formData.append("code", productInfo.code);
    images.forEach((file, i) => {
      formData.append(`image_${i}`, file);
    });

    try {
      // 替换为你的后端上传接口
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      message.success("上传成功");
      setImages([]);
    } catch (e) {
      message.error("上传失败");
    }
  };

  return (
    <Card title="扫码拍照入库" className={styles.container}>
      <Input
        placeholder="请输入或扫描条码后回车"
        value={scanValue}
        onChange={(e) => setScanValue(e.target.value)}
        onPressEnter={handleScan}
        style={{ marginBottom: 16, height: 48, fontSize: 18 }}
      />

      {productInfo && (
        <Card type="inner" title="商品信息" style={{ marginBottom: 16 }}>
          <p>商品编码：{productInfo.code}</p>
          <p>商品名称：{productInfo.name}</p>
          <p>{productInfo.desc}</p>
        </Card>
      )}

      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<CameraOutlined />}
          type="primary"
          onClick={handleCapture}
          disabled={images.length >= MAX_IMAGES}
        >
          拍照（剩余 {MAX_IMAGES - images.length} 张）
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.imageList}>
        {images.map((file, index) => (
          <div key={index} className={styles.imageItem}>
            <Image
              src={URL.createObjectURL(file)}
              alt={`photo-${index}`}
              width={100}
              height={100}
              onClick={() => handlePreview(file)}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(index)}
              className={styles.deleteButton}
            />
          </div>
        ))}
      </div>
      {uploading && (
        <div
          style={{
            background: "#fafafa",
            border: "1px dashed #ccc",
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <Spin tip="上传中..." />
        </div>
      )}
    </Card>
  );
};

export default PhotoCapture;
