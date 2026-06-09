FROM nginx:alpine
# nginx:alpine: 경량 웹서버
# index.html 정적 파일 서빙 + API 프록시 역할

COPY index.html /usr/share/nginx/html/index.html
# nginx 기본 서빙 경로에 복사

COPY nginx.conf /etc/nginx/conf.d/default.conf
# 커스텀 nginx 설정 적용

EXPOSE 80