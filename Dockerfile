FROM node:18-bookworm-slim

# Cài đặt các gói phụ thuộc C++ cho canvas và sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    git \
    openssh-client \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*



WORKDIR /app

# Copy toàn bộ mã nguồn vào container
COPY . .

# Cài đặt dependencies (bỏ qua audit để tránh lỗi)
RUN npm install --legacy-peer-deps

# Khởi chạy bot
CMD ["npm", "start"]
