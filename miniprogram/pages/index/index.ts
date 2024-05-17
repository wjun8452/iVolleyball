let app = getApp();

Page({
  data: {
    iciba: "", //每日一句名言
    globalData: app.globalData,
  },

  onShareAppMessage: function (e) { },

  onLoad: function (options) {
    var that = this

    //获取每日一句正能量名言
    wx.cloud.callFunction({
      name: 'iciba',
      data: {},
      success: res => {
        var obj = JSON.parse(res.result as string)
        that.data.iciba = obj.note
        console.log('[wx.cloud.iciba]', obj)
        that.setData(that.data)
      },
      fail: err => {
        console.error('[wx.cloud.iciba] failed!', err)
      }
    })
    this.setData(this.data)
  },

  //绘制顶部的canvas动画
  drawCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#myCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        // Canvas 对象
        const canvas = res[0].node
        // 渲染上下文
        const ctx = canvas.getContext('2d')

        // Canvas 画布的实际绘制宽高
        const width = res[0].width
        const height = res[0].height

        // 初始化画布大小
        const dpr = wx.getWindowInfo().pixelRatio
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        //变换坐标原点
        ctx.translate(width / 2, height);
        ctx.scale(1, -1);

        console.log("canvas width=", width, ",height=", height)

        //加载图片
        const image = canvas.createImage()
        // 图片加载完成回调
        image.onload = () => {
        }
        // 设置图片src
        image.src = 'https://696c-ilovevolleyball-d1813b-1253572757.tcb.qcloud.la/image/volleyball.png?sign=2c150d5cd43c6c20d40b4ee58e15a878&t=1703842908'

        //天气变量
        const weather: number = 0; //0 sunny, 1 cloudy, 2 cloudy sun, 3 rainy, 4 snow, 5 fog
        //存储随机数，这样每一帧的树形就固定不变啦
        const randomStack = new Array();
        for (let t = 0 ; t < 100; t ++) {
          randomStack.push(Math.random());
        }
        console.log(randomStack)

        const sunSpeed = 0;
        let sunAngle = 0;

        const updateFrame = function () {
          //
          let ranmdomIndex = 0;

          // 清空画布
          ctx.fillStyle = '';
          ctx.clearRect(0, 0, width, height)

          // 画排球图片
          const drawVolleyball = function () {
            ctx.drawImage(image, 0, 0, 32, 32)
          }
          drawVolleyball();

          //画一个云朵
          const drawCloud = function (x, y, radius) {
            ctx.moveTo(x, y)
            ctx.arc(x - radius * 1.5, y - radius * 0.5, radius, 0, Math.PI * 2);
            ctx.arc(x, y - radius * 0.8, radius, 0, Math.PI * 2);
            ctx.arc(x + radius * 1.5, y - radius * 0.5, radius, 0, Math.PI * 2);
            ctx.arc(x + radius * 2.5, y, radius, 0, Math.PI * 2);
            ctx.arc(x + radius * 1.5, y, radius * 1.8, 0, Math.PI * 2);
            ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#d3d3d3'; // Gray color for the cloud
            ctx.fill();
          }


          //画一颗随机的树
          const drawTree = function (v0, length, thick, dir) {
            if (dir > 180 || dir < 0) {
              return;
            }

            if (thick < 4 && randomStack[ranmdomIndex++] < 0.1) {
              return;
            }

            if (thick < 5 && (dir > 120 || dir < 60) && randomStack[ranmdomIndex++] < 0.1) {
              return;
            }

            if (thick < 2) {
              //画一朵花
              ctx.beginPath();
              ctx.arc(v0[0], v0[1], 4, 0, 2 * Math.PI);
              ctx.fillStyle = "#FF4500";
              //ctx.shadowBlur = 5;
              //ctx.shadowColor = "#FF4500";
              ctx.fill();
              return;
            }

            ctx.beginPath();
            ctx.moveTo(v0[0], v0[1]);
            const v1 = [
              v0[0] + length * Math.cos((dir * Math.PI) / 180),
              v0[1] + length * Math.sign((dir * Math.PI) / 180)
            ];
            ctx.lineTo(v1[0], v1[1]);
            ctx.lineWidth = thick;
            ctx.fillStyle = "#696969";
            ctx.lineCap = "round";
            ctx.stroke();

            drawTree(v1, length * 0.7 + length * 0.2 * randomStack[ranmdomIndex++], thick * 0.7, dir + 20 + randomStack[ranmdomIndex++] * 15);

            drawTree(v1, length * 0.7 + length * 0.2 * randomStack[ranmdomIndex++], thick * 0.7, dir - 20 - randomStack[ranmdomIndex++] * 15);
          }

          const dist = 100;
          for (let a = -1; a <= -1; a++) {
            drawTree([a * dist + 60, 0], 25, 10, 90);
          }

          //画一个太阳
          const drawSun = function (angle) {
            const centerX = 100;
            const centerY = 100;
            const radius = 20;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#f28d00';
            ctx.closePath();
            ctx.fill();

            // Draw the rays of the sun
            const rayLength = radius * 1.8;
            const rayCount = 8;
            const rayAngle = (2 * Math.PI) / rayCount;

            for (let i = 0; i < rayCount; i++) {
              const rayStartX = centerX + Math.cos(angle + i * rayAngle) * radius;
              const rayStartY = centerY + Math.sin(angle + i * rayAngle) * radius;
              const rayEndX = centerX + Math.cos(angle + i * rayAngle) * rayLength;
              const rayEndY = centerY + Math.sin(angle + i * rayAngle) * rayLength;

              ctx.beginPath();
              ctx.moveTo(rayStartX, rayStartY);
              ctx.lineTo(rayEndX, rayEndY);
              ctx.strokeStyle = '#f28d00';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }

          sunAngle += sunSpeed;
          if (sunAngle >= 2 * Math.PI) {
            sunAngle -= 2 * Math.PI;
          }

          if (weather == 0) {
            drawSun(sunAngle);
          } else if (weather == 1) {
            drawCloud(100, 100, 10);
          } else {

          }

          // Request the next animation frame
          canvas.requestAnimationFrame(updateFrame);

        }
        updateFrame();
      })

  },

  onShow: function () {
    console.log("onShow", this.data.globalData)
    this.drawCanvas();
  },

  stopPageScroll: function () {
    return
  },

  onUnload: function () {
  },

  onMenu: function (res: any) {
    console.log("[onMenu]", res);
    wx.navigateTo({
      url: res.target.dataset.url,
    })
  }
})