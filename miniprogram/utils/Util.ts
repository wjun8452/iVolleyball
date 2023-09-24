/** 
 * new Date() ---> 转化为 年 月 日 时 分 秒
 * let date = new Date();
 * date: 传入参数日期 Date
*/
export function formatTime(date:Date) {
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()

    let hour = date.getHours()
    let minute = date.getMinutes()
    let second = date.getSeconds()


    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n:number) : string{
    let m = n.toString()
    return m[1] ? m : '0' + m
}


/** 
 * 时间戳转化为年 月 日
 * number: 传入时间戳 
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致 
*/
export function parseDate(date:Date, format?:string) : string {
  let format2 = format ? format : "Y/M/D"
  let formateArr = ['Y', 'M', 'D'];
  let returnArr:string[] = [];

  returnArr.push(date.getFullYear().toString());
  returnArr.push(formatNumber(date.getMonth() + 1));
  returnArr.push(formatNumber(date.getDate()));

  for (let i in returnArr) {
      format2 = format2.replace(formateArr[i], returnArr[i]);
  }
  return format2;
}

/** 
 * 时间戳转化为年 月 日 时 分 秒 
 * number: 传入时间戳 
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致 
*/
export function parseTime(date:Date, format?:string) : string {
    let format2 = format ? format : "Y/M/D h:m:s"
    let formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
    let returnArr:string[] = [];

    returnArr.push(date.getFullYear().toString());
    returnArr.push(formatNumber(date.getMonth() + 1));
    returnArr.push(formatNumber(date.getDate()));

    returnArr.push(formatNumber(date.getHours()));
    returnArr.push(formatNumber(date.getMinutes()));
    returnArr.push(formatNumber(date.getSeconds()));

    for (let i in returnArr) {
        format2 = format2.replace(formateArr[i], returnArr[i]);
    }
    return format2;
}

export function friendlyDate(date: Date) {
    let timestamp = date.getTime();
    let formats: any = {
        year: '%n% 年前',
        month: '%n% 月前',
        day: '%n% 天前',
        hour: '%n% 小时前',
        minute: '%n% 分钟前',
        second: '%n% 秒前',
    }

    let now = Date.now();
    let seconds = Math.floor((now - timestamp) / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    let months = Math.floor(days / 30);
    let years = Math.floor(months / 12);

    let diffType = '';
    let diffValue = 0;
    if (years > 0) {
        diffType = 'year';
        diffValue = years;
    } else {
        if (months > 0) {
            diffType = 'month';
            diffValue = months;
        } else {
            if (days > 0) {
                diffType = 'day';
                diffValue = days;
            } else {
                if (hours > 0) {
                    diffType = 'hour';
                    diffValue = hours;
                } else {
                    if (minutes > 0) {
                        diffType = 'minute';
                        diffValue = minutes;
                    } else {
                        diffType = 'second';
                        diffValue = seconds === 0 ? (seconds = 1) : seconds;
                    }
                }
            }
        }
    }
    return formats[diffType].replace('%n%', diffValue);
}

export function getUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}