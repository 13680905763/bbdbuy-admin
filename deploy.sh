#!/bin/bash

# ==============================================================================
# 项目部署脚本 (Deployment Script)
# 功能: 自动完成本地构建、打包、上传、远程解压及清理
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. 配置参数区
# ------------------------------------------------------------------------------

# 远程服务器信息
REMOTE_USER="root"
REMOTE_HOST="8.211.61.244"

# 远程部署路径 (Nginx 静态资源分发目录)
REMOTE_DIR="/usr/share/nginx/html/admin"

# 项目信息
PROJECT_NAME="bbdbuy-admin"
ARCHIVE_NAME="${PROJECT_NAME}.zip"
BUILD_OUTPUT_DIR="dist"

# 临时中转路径
REMOTE_ARCHIVE_PATH="/tmp/${ARCHIVE_NAME}"

# 控制台颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}  开始部署任务: ${PROJECT_NAME}${RED}"
echo -e "${GREEN}==============================================================================${NC}"


# ------------------------------------------------------------------------------
# 2. 本地构建步骤
# ------------------------------------------------------------------------------

echo -e "\n${GREEN}>>> [步骤 1/4] 清理并执行本地构建...${NC}"

# 删除旧的产物目录
if [ -d "${BUILD_OUTPUT_DIR}" ]; then
    echo "正在清理旧的 ${BUILD_OUTPUT_DIR} 目录..."
    rm -rf "${BUILD_OUTPUT_DIR}"
fi

# 执行构建命令 (使用 dev 配置)
if pnpm install && pnpm build:dev; then
    echo -e "${GREEN}✅ 本地构建成功完成！${NC}"
else
    echo -e "${RED}❌ 构建出错，请检查日志后重试。${NC}"
    exit 1
fi


# ------------------------------------------------------------------------------
# 3. 压缩打包步骤
# ------------------------------------------------------------------------------

echo -e "\n${GREEN}>>> [步骤 2/4] 打包构建产物...${NC}"

# 清理旧的压缩包
rm -f "${ARCHIVE_NAME}"

# 进入 dist 目录进行压缩 (确保解压后直接是文件，不包含 dist 层级)
cd "${BUILD_OUTPUT_DIR}" || exit

if command -v 7z >/dev/null 2>&1; then
    7z a -tzip "../${ARCHIVE_NAME}" * > /dev/null
elif [ -f "/c/Program Files/7-Zip/7z.exe" ]; then
    "/c/Program Files/7-Zip/7z.exe" a -tzip "../${ARCHIVE_NAME}" * > /dev/null
else
    echo -e "${RED}❌ 未找到 7z 命令，请安装 7-Zip 并确保其在环境变量中。${NC}"
    exit 1
fi

# 返回项目根目录
cd ..
echo -e "${GREEN}✅ 打包成功: ${ARCHIVE_NAME}${NC}"


# ------------------------------------------------------------------------------
# 4. 上传资源步骤
# ------------------------------------------------------------------------------

echo -e "\n${GREEN}>>> [步骤 3/4] 上传资源到测试服务器...${NC}"

if scp "${ARCHIVE_NAME}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE_PATH}"; then
    echo -e "${GREEN}✅ 资源已成功上传至远程临时目录。${NC}"
else
    echo -e "${RED}❌ 上传失败，请检查 SSH 连接或权限。${NC}"
    exit 1
fi


# ------------------------------------------------------------------------------
# 5. 远程解压与环境部署步骤
# ------------------------------------------------------------------------------

echo -e "\n${GREEN}>>> [步骤 4/4] 执行远程服务器部署...${NC}"

ssh "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
    set -e
    
    # 确保目标部署目录存在
    if [ ! -d "${REMOTE_DIR}" ]; then
        echo "远程目录不存在，正在创建: ${REMOTE_DIR}"
        mkdir -p "${REMOTE_DIR}"
    fi

    # 清理旧的静态资源
    echo "清理旧的静态文件..."
    rm -rf "${REMOTE_DIR:?}"/*

    # 解压新包
    echo "解压缩资源包到部署目录..."
    if command -v unzip >/dev/null 2>&1; then
        unzip -o "${REMOTE_ARCHIVE_PATH}" -d "${REMOTE_DIR}" > /dev/null
    elif command -v 7z >/dev/null 2>&1; then
        7z x -y "${REMOTE_ARCHIVE_PATH}" -o"${REMOTE_DIR}" > /dev/null
    else
        echo "❌ 远程服务器缺失 unzip 或 7z 命令！"
        exit 1
    fi

    # 清理服务器上的临时包
    rm -f "${REMOTE_ARCHIVE_PATH}"
    
    echo "验证部署结果 (目录文件预览):"
    ls -F "${REMOTE_DIR}" | head -n 5
EOF

# ------------------------------------------------------------------------------
# 6. 后续清理与完成提示
# ------------------------------------------------------------------------------

# 清理本地打包好的 zip 包
rm -f "${ARCHIVE_NAME}"

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}  🎉 所有部署步骤已成功完成！${NC}"
echo -e "${GREEN}  访问路径: http://${REMOTE_HOST}/admin/ (或对应域名)${NC}"
echo -e "${GREEN}==============================================================================${NC}"
