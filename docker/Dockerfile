# 基础镜像
FROM kcr.kmcloud.kingmed.idc/library/paasnginx:1.21-alpine
# author
LABEL  maintainer="beckham"
# 构建阶段输出node以及npm版本
RUN echo "[Node.js 版本]" && node -v && \
    echo "[npm 版本]" && npm -v
#环境变量(配置对应项目文件) 类似 /webapps/kmlims-ui
ENV WORK_HOME /webapps/projectName-ui
# 挂载目录
VOLUME $WORK_HOME
# 创建目录
RUN mkdir -p $WORK_HOME
# 指定路径
WORKDIR $WORK_HOME
# 复制html文件到路径
COPY ${CI_PROJECT_DIR}/dist $WORK_HOME
# 修改工作目录归属
RUN chown -R 1000:3000 $WORK_HOME && \
    chown -R 1000:3000 /var/cache/nginx && \
    chown -R 1000:3000 /var/log/nginx && \
    chown -R 1000:3000 /etc/nginx/conf.d && \
    chown -R 1000:3000 /run
# 指定运行用户和组
USER 1000:3000
CMD [ "nginx", "-g", "daemon off;"]


