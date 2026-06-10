# ─────────────────────────────────────────────
# Stage 1: 의존성 설치
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
# node:20-alpine: Node.js 20 + Alpine Linux (경량 이미지)
# AS builder: 멀티 스테이지 이름 지정

WORKDIR /app
# 컨테이너 안 작업 디렉토리 설정

COPY package*.json ./
# package.json + package-lock.json 먼저 복사
# 소스코드 변경 시 이 레이어 캐시 재사용 → 빌드 속도 향상

RUN npm ci --only=production
# package-lock.json 기준 정확한 버전 설치
# --only=production: nodemon 등 devDependencies 제외


# ─────────────────────────────────────────────
# Stage 2: 실행
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# 보안: root 대신 전용 유저로 실행
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# root로 실행하면 컨테이너 탈출 시 호스트까지 위험
# 시스템 계정(-S)은 로그인 불가 → 보안 강화

COPY --from=builder /app/node_modules ./node_modules
# builder 스테이지의 node_modules만 가져오기
# 빌드 캐시, 불필요한 파일 제외 → 이미지 크기 최소화

COPY src ./src
COPY package.json ./

# logs 디렉토리 생성 + 권한 설정
RUN mkdir -p logs && chown -R appuser:appgroup /app
# appuser가 logs 폴더에 파일 쓸 수 있도록 권한 부여

USER appuser
# 이후 모든 명령은 appuser 권한으로 실행

EXPOSE 3000
# 80 포트 사용 명시

CMD ["node", "src/app.js"]
# 프로덕션 환경: nodemon 대신 node 직접 실행