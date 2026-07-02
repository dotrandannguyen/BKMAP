FROM node:20-alpine

WORKDIR /app

# copy package first để cache npm install
COPY package*.json ./

RUN npm install

# copy toàn bộ source
COPY . .

# Prisma generate (chỉ chạy build image)
RUN npx prisma generate

EXPOSE 3000

# Production: chạy node trực tiếp (không dùng nodemon)
CMD ["npm", "run", "start"]