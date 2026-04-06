#!/bin/bash

# === 配置区 ===
REMOTE_USER="root"

# 测试服务器IP
# REMOTE_HOST="8.211.61.244"
# 如果你的环境变量或 SSH Config 已配置，可以注释掉上面，使用默认值
if [ -z "$REMOTE_HOST" ]; then
    REMOTE_HOST="8.211.61.244"
fi

# 远程部署目录 (Nginx 静态资源目录)
REMOTE_DIR="/usr/share/nginx/html/admin"

# 项目名称 (用于压缩包命名)
PROJECT_NAME="bbdbuy-admin"

# 压缩包名称
ARCHIVE_NAME="${PROJECT_NAME}.zip"

# 远程压缩包存放路径
REMOTE_ARCHIVE_PATH="/tmp/${ARCHIVE_NAME}"

# 本地打包输出目录 (Ant Design Pro 默认是 dist)
BUILD_OUTPUT_DIR="dist"

echo "==> Step 1: Building project locally..."

# 清理旧构建
rm -rf ${BUILD_OUTPUT_DIR}

# 安装依赖 & 构建 (优先使用 tyarn, 其次 pnpm,最后 npm )
if command -v tyarn >/dev/null 2>&1; then
    # tyarn install && tyarn build
    tyarn build
elif command -v pnpm >/dev/null 2>&1; then
    pnpm install && pnpm build
else
    npm install && npm run build
fi

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "==> Step 2: Packaging build artifacts..."
rm -f ${ARCHIVE_NAME}

# 进入 dist 目录压缩，确保压缩包根目录即为静态资源，不包含 dist 文件夹
cd ${BUILD_OUTPUT_DIR}

if command -v 7z >/dev/null 2>&1; then
    7z a -tzip ../${ARCHIVE_NAME} *
elif [ -f "/c/Program Files/7-Zip/7z.exe" ]; then
    "/c/Program Files/7-Zip/7z.exe" a -tzip ../${ARCHIVE_NAME} *
else
    echo "❌ 7z not found. Please install 7-Zip or add it to your PATH."
    exit 1
fi

# 返回项目根目录
cd ..

echo "==> Step 3: Uploading archive to server..."
scp ${ARCHIVE_NAME} "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE_PATH}"

if [ $? -ne 0 ]; then
  echo "❌ Upload failed"
  exit 1
fi

echo "==> Step 4: Deploy remotely..."
ssh ${REMOTE_USER}@${REMOTE_HOST} bash <<EOF
  set -e
  
  echo "Checking remote directory: ${REMOTE_DIR}..."
  if [ ! -d "${REMOTE_DIR}" ]; then
      echo "Creating directory..."
      mkdir -p ${REMOTE_DIR}
  fi
  
  echo "Cleaning up remote directory contents..."
  rm -rf ${REMOTE_DIR}/*

  echo "Extracting archive to ${REMOTE_DIR}..."
  
  # 优先尝试 unzip，如果失败尝试 7z
  if command -v unzip >/dev/null 2>&1; then
      unzip -o ${REMOTE_ARCHIVE_PATH} -d ${REMOTE_DIR}
  elif command -v 7z >/dev/null 2>&1; then
      7z x -y ${REMOTE_ARCHIVE_PATH} -o${REMOTE_DIR}
  else
      echo "❌ Error: Neither 'unzip' nor '7z' found on remote server."
      echo "Please install one of them: apt-get install unzip or apt-get install p7zip-full"
      exit 1
  fi

  # 删除远程压缩包
  rm ${REMOTE_ARCHIVE_PATH}
  
  echo "Verifying deployment..."
  ls -l ${REMOTE_DIR} | head -n 5

  echo "Deployment to ${REMOTE_DIR} finished."
EOF

# 清理本地压缩包
rm -f ${ARCHIVE_NAME}

echo "----------- Deployment completed successfully -------------"
