const username = ''; // netid
const password = ''; // 密码
const { cgyy_url, sport } = { cgyy_url: 'http://202.117.17.144/product/show.html?id=103', sport: 'badminton' }; // 2号巨构羽毛球场
// const { cgyy_url, sport } = { cgyy_url: 'http://202.117.17.144/product/show.html?id=102', sport: 'pingpong' }; //创新港一号巨构乒乓球台
const target_court = '-1'; // '-1'表示从0..max_court随机选择，'1','2',...表示选择指定场地
const target_time = '21:01-22:00'; // 指定时间段
const max_court = 6; // 场地数目

let court_num = target_court;
if (target_court === '-1') {
    const random_court = Math.floor(Math.random() * max_court) + 1;
    court_num = random_court.toString();
}
const court_selector = 'span#seat_' + court_num + '.cell.' + sport;
const login_url = 'http://202.117.17.144/order/myorders.html';

const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('http');

let now = new Date();
let twoDaysLater = new Date(now.setDate(now.getDate() + 2));

const formattedDate0 = twoDaysLater.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).replace(/\//g, ',');
const [month, day, year] = formattedDate0.split(",");
const formattedDate = `${year},${parseInt(month)},${parseInt(day)}`;
console.log(formattedDate);

async function login(page) {
    await page.waitForSelector("input.username");
    console.log("username input found");
    const usernameInputEle = await page.$("input.username");
    await usernameInputEle.type(username);

    await page.waitForSelector("input.pwd");
    console.log("password input found");
    const pwdInputEle = await page.$("input.pwd");
    await pwdInputEle.type(password);

    await page.waitForSelector("div#account_login.login_btn.account_login");
    console.log("submit btn found");
    const submitBtnEle = await page.$("div#account_login.login_btn.account_login");
    await submitBtnEle.click();
    await delay(2000);
    console.log("submit btn click");
    await page.waitForSelector("div#passTip_know.passTip_btn");
    const changePwdBtn = await page.$("div#passTip_know.passTip_btn");
    if (changePwdBtn) {
        await changePwdBtn.click();
    }
}


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

// async function wait_time(time) {
//     let now = new Date();
//     let d = time - now;
//     while (new Date() < time) {
//         await delay(100);
//     }
// }


async function select_court(page) {
    // select date
    await page.waitForSelector('a.textbox-icon.combo-arrow');
    console.log("date select found");
    const selectEle0 = await page.$$('a.textbox-icon.combo-arrow');
    for (const ele of selectEle0) {
        const offsetWidth = await page.evaluate(e => { return e.offsetWidth }, ele);
        if (offsetWidth == 36) {
            await ele.click();
            console.log("click date select");
            break;
        }
    }


    await page.waitForSelector('td.calendar-day');
    console.log("date input found");
    const daysEle = await page.$$('td.calendar-day');
    for (const day of daysEle) {
        const text = await page.evaluate(e => { return e.abbr }, day);
        if (text == formattedDate) {
            const box = await day.boundingBox();
            if (box !== null) {
                day.click();
                console.log("click date");
                break;
            }
        }
    }

    // select time
    await page.waitForSelector('a.textbox-icon.combo-arrow');
    console.log("time select found");
    const selectEle = await page.$$('a.textbox-icon.combo-arrow');
    for (const ele of selectEle) {
        const offsetWidth = await page.evaluate(e => { return e.offsetWidth }, ele);
        if (offsetWidth == 18) {
            await ele.click();
            console.log("click time select");
            break;
        }
    }

    await page.waitForSelector('.combobox-item');
    console.log("time input found");
    const timeInputEle = await page.$$('.combobox-item');
    for (const ele of timeInputEle) {
        const text = await page.evaluate(e => { return e.innerText }, ele);
        const offsetHeight = await page.evaluate(e => { return e.offsetHeight }, ele);
        if (text == target_time && offsetHeight != 0) {
            await ele.click();
            console.log("click time");
            break;
        }
    }

    // court select
    await page.waitForSelector(court_selector);
    console.log("court0 found");
    const courtEle0 = await page.$(court_selector);
    console.log("court is ", courtEle0);
    await courtEle0.click();

    // click 确认预定
    await page.waitForSelector('button#reserve.normal-button-mid.button-danger');
    console.log("confirm btn found");
    const confirmBtnEle = await page.$('button#reserve.normal-button-mid.button-danger');
    console.log("confirm btn is ", confirmBtnEle);
    await confirmBtnEle.click();
}

async function identify() {
    const { execSync } = require('child_process');

    const result = execSync('python captcha.py', { encoding: 'utf-8' });

    return parseInt(result);
}

async function book(browser) {
    const page = await browser.newPage();
    await page.goto(cgyy_url);

    await select_court(page);

    await page.waitForSelector('button#reserve.button-large.button-info');
    console.log("confirm btn found");
    const confirmBtnEle = await page.$('button#reserve.button-large.button-info');
    await confirmBtnEle.click();

    await delay(500);
    await page.waitForSelector('#captcha-iframe');
    console.log("captcha-iframe found");
    const iframe = await page.$('#captcha-iframe');
    const frame = await iframe.contentFrame();
    await frame.waitForSelector('img#bg-img');
    console.log("bg-img found");
    const bg_img = await frame.$('img#bg-img');
    const img_str = await frame.evaluate(img => img.src, bg_img);
    // console.log("img_str is ", img_str);
    const base64Data = img_str.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFileSync('bg.png', buffer);

    const bg_box = await bg_img.boundingBox();
    const scale_factor = bg_box.width / 590;
    console.log("scale_factor is ", scale_factor);

    const slider_img = await frame.$('img#slider-img');
    const img_str2 = await frame.evaluate(img => img.src, slider_img);
    const base64Data2 = img_str2.replace(/^data:image\/\w+;base64,/, '');
    const buffer2 = Buffer.from(base64Data2, 'base64');
    await fs.writeFileSync('slider.png', buffer2);

    const slider_box = await slider_img.boundingBox();

    await delay(1000);
    const distance = await identify() * scale_factor - slider_box.width / 2;
    console.log("distance is ", distance);

    const slider = await frame.$('div#slider-move-btn.slider-move-btn');
    const box = await slider.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 0; i < distance; i += 10) {
        await page.mouse.move(x + i, y);
        await delay(1);
    }
    await page.mouse.move(x + distance, y);
    await delay(10);
    await page.mouse.up();

    await page.screenshot({ path: 'res.png' });
}

async function checkTime() {
    const am840 = new Date();
    am840.setHours(8);
    am840.setMinutes(40);
    am840.setSeconds(1);
    am840.setMilliseconds(0);
    while (true) {
        try {
            const res = await new Promise((resolve, reject) => {
                http.get('http://worldtimeapi.org/api/timezone/Asia/Shanghai', (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        resolve(data);
                    });
                }).on('error', (err) => {
                    reject(err);
                });
            });

            const timeData = JSON.parse(res);
            const datetime = new Date(timeData.datetime);

            // 判断是否到达早上 8:40
            if (datetime < am840) {
                await delay(50);
            } else {
                console.log('已到达早上 8:40');
                break;
            }
        } catch (err) {
            console.log('Error:', err.message);
        }
    }
}

(async () => {
    console.log("cgyy_url is ", cgyy_url);
    console.log("sport is ", sport);
    console.log("court_num is ", court_num);
    const options = {
        headless: false,
        args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            `--window-size=${1920},${1080}`
        ],
        // slowMo: 1,
        defaultViewport: { width: 1920, height: 1080 }
        // devtools: true
    };
    const browser = await puppeteer.launch(options);

    const login_page = await browser.newPage();
    await login_page.goto(login_url);
    await login(login_page);

    await delay(5000);

    await checkTime();

    await book(browser);

    await delay(60000);
    await browser.close();
})();