import {
  CloseOutlined,
  LeftOutlined,
  PlayCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";

export type MediaItem = {
  id: string | number;
  fileUrl: string;
};

type MediaPreviewGroupProps = {
  fileList?: MediaItem[];
  thumbnailSize?: number; // 缩略图大小
};

const MediaPreviewGroup: React.FC<MediaPreviewGroupProps> = ({
  fileList = [],
  thumbnailSize = 40,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!fileList || fileList.length === 0) return null;

  const isVideo = (url?: string) =>
    url?.match(/\.(mp4|mov|avi|mkv)$/i) !== null;

  const openPreview = (index: number) => {
    if (index < 0 || index >= fileList.length) return;
    setCurrentIndex(index);
    setPreviewVisible(true);
  };

  const prev = () =>
    setCurrentIndex((i) => (i - 1 + fileList.length) % fileList.length);
  const next = () => setCurrentIndex((i) => (i + 1) % fileList.length);

  const currentItem = fileList[currentIndex];

  const renderContent = () => {
    if (!currentItem || !currentItem.fileUrl) return null;

    if (isVideo(currentItem.fileUrl)) {
      return (
        <video
          autoPlay
          controls
          muted
          style={{ maxWidth: "90vw", maxHeight: "80vh" }}
          src={currentItem.fileUrl}
        />
      );
    }

    return (
      <img
        alt="preview"
        src={currentItem.fileUrl}
        style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain" }}
      />
    );
  };

  return (
    <div>
      {/* 缩略图列表 */}
      <div style={{ display: "flex", gap: 8 }}>
        {fileList.map((item, idx) => {
          const video = isVideo(item.fileUrl);
          return (
            <div
              key={item?.id ?? idx}
              style={{
                width: thumbnailSize,
                height: thumbnailSize,
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
                backgroundColor: "#f0f0f0",
                borderRadius: 4,
              }}
              onClick={() => openPreview(idx)}
            >
              {video ? (
                <PlayCircleOutlined
                  style={{
                    position: "absolute",
                    fontSize: 20,
                    color: "#fff",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ) : (
                <img
                  alt="thumbnail"
                  src={item.fileUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 弹窗 */}
      {previewVisible && currentItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <CloseOutlined
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              fontSize: 24,
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={() => setPreviewVisible(false)}
          />

          <LeftOutlined
            style={{
              position: "absolute",
              left: 16,
              fontSize: 32,
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={prev}
          />
          <RightOutlined
            style={{
              position: "absolute",
              right: 16,
              fontSize: 32,
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={next}
          />

          <div>{renderContent()}</div>
        </div>
      )}
    </div>
  );
};

export default MediaPreviewGroup;
