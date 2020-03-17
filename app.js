
//input referrer id
//Copy User ID From: Setting/More Setting/Diagnostic/ID
const referrer = "0f20e228-f634-478c-ae62-d40a456a19d6";
const timeToLoop = 5000;
const retryTimes = 5;
// time sleep, currently rate limit might be apply to per min per ip
const sleepSeconds = 60;

const https = require("https");
const zlib = require("zlib");
const express = require("express");
const app = express();

function genString(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    return new Promise(resolve => {

        const install_id = genString(11);
        //console.log(install_id);

        const post_data = JSON.stringify({
            key: `${genString(43)}=`,
            install_id: install_id,
            fcm_token: `${install_id}:APA91b${genString(134)}`,
            referrer: referrer,
            warp_enabled: false,
            tos: new Date().toISOString().replace("Z", "+07:00"),
            type: "Android",
            locale: "en_US"
        });

        const options = {
            hostname: "api.cloudflareclient.com",
            port: 443,
            path: "/v0a745/reg",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Host: "api.cloudflareclient.com",
                Connection: "Keep-Alive",
                "Accept-Encoding": "gzip",
                "User-Agent": "okhttp/3.12.1",
                "Content-Length": post_data.length
            }
        };

        const request = https.request(options, result => {
            if (result.statusCode == 429) {
                //too many request
                resolve(false);
            }
            const gzip = zlib.createGunzip();
            result.pipe(gzip);
            gzip.on("data", function () {
            }).on("end", function () {
                resolve(true);
            }).on("error", function () {
                resolve(false);
            });
        });

        request.on("error", error => {
            resolve(false);
        });

        request.write(post_data);
        request.end();
    })
}
let success = 0, error = 0, retry = 0;
// const job = new cron.CronJob({
//     cronTime: '*/10 * * * * *', // Chạy Jobs vào 23h30 hằng đêm
//     onTick: async function () {
//         if (await run()) {
//             success++;
//             console.log("thanh cong ");

//         }
//         else {

//             job.stop();
//             console.log("Xuat hien loi");
//             error++;
//             let timeSleep = sleepSeconds * 1000;
//             console.log(`Se ngu trong ${timeSleep}`);
//             setTimeout(() => {
//                 job.addCallback(), timeSleep
//             });
//         }



//     },
//     start: true,
//     timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng 
// });

//job.start();
async function init() {
    for (let index = 0; index < timeToLoop; index++) {
        if (await run()) {
            success++
            console.log(index + 1, "Success");
        } else {
            console.log(index + 1, `Error, will sleep for ${sleepSeconds}s`);
            error++
            for (let r_index = 0; r_index < retryTimes; r_index++) {
                await sleep(sleepSeconds * 1000);
                if (await run()) {
                    console.log(index + 1, "Retry #" + (r_index + 1), "success");
                    retry++
                    break;
                } else {
                    console.log(index + 1, "Retry #" + (r_index + 1), `Error, will sleep for ${sleepSeconds}s`);
                    if (r_index == retryTimes - 1) {
                        return;
                    }
                }
            }
        }
    }
}

init();
app.get("/", function (req, res) {
    let data = {
        'success': success,
        'error': error,
        'retry': retry,
    }
    res.send(data);
});
app.listen(process.env.PORT, function () {
    console.log("Ung Dung Da Chay");
});
// app.listen(3000, function () {
//     console.log("Runninggggggggggggggg");
// });

