## 部署方法

#### 安装 Docker

* CentOS => [https://docs.docker.com/install/linux/docker-ce/centos/](https://docs.docker.com/install/linux/docker-ce/centos/)
* Debian => [https://docs.docker.com/install/linux/docker-ce/debian/](https://docs.docker.com/install/linux/docker-ce/debian/)
* Ubuntu => [https://docs.docker.com/install/linux/docker-ce/ubuntu/](https://docs.docker.com/install/linux/docker-ce/ubuntu/)

> 安装完 Docker 后，不要忘记启动 Docker，并且设置为开机自启动。

#### 启动容器

```
docker run -itd --name idol_server_api -p 8877:8877 --restart always ety001/idol
```

启动成功后，会开启服务器的 `8877` 端口，访问 `http://ip:8877/v2/api/trade_aggregations` 如果有数据，则容器启动成功。
