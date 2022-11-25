importClass(android.provider.Settings);
importClass(android.content.Context);
/* --------------------------------------Ԥ���ÿ�ʼ----------------------------------- */
const { serverUrl, companyName, morTime, nightTime, tokenUrl, maxTime, waitTime, pwd, sendImgRules, account, accountPwd, jumpRules, token } = hamibot.env;
var myLog = "";
var myStr = "";
const w = device.width;
const h = device.height;
const maxSwipeNum = 50;
const holidayUrl = "http://timor.tech/api/holiday/year?week=Y";
const holidayCfgName = "HOLIDAY_ARRAY_" + new Date().getFullYear() + "_";
const workdayCfgName = "WORKDAY_" + new Date().getFullYear() + "_";
// Ϣ��ʱ��/2
const loopTime = getLoopTime();
var myCfg = storages.create("DingDing-SayNo");
let open_app = false;

function closeScreen(){
  click(10, 10);
  sleep(50);
  click(10,10);
}

/**
 * ������־���˳��ű�
 */
function exitShell() {
    home();
    if (open_app) {
      kill_app('com.alibaba.android.rimet');
    } else {
      setLog("δ�򿪳��򣬲���Ҫ�ر�");
    }
    if (serverUrl && sendImgRules != "notSend") {
        sendMsg(getDateTime(true) + " �򿨽��", myLog);
    }
    //Power();
    closeScreen();
    exit();
}


/**
 * ��ֹϢ��
 */
threads.start(function () {
    setInterval(() => {
        toast("��ֹ����");
    }, loopTime);
});

if (!morTime) {
    toastLog("�������ϰ��ʱ�䷶Χ");
    exitShell();
}

if (!nightTime) {
    toastLog("�������°��ʱ�䷶Χ");
    exitShell();
}

if (!maxTime) {
    toastLog("�����ô����ʱ��");
    exitShell();
}

if (!waitTime) {
    toastLog("�����õȴ�ʱ��");
    exitShell();
}
//�ϰ��ʱ���
var goToWorkTime = morTime.split(';');

//�°��ʱ���
var afterWorkTime = nightTime.split(';');

// ���õ���Ľڼ���
if (("rule_1" == jumpRules || "rule_3" == jumpRules) && !myCfg.contains(holidayCfgName)) {
    setholiday();
}

// ������Ҫ�������ĩ
if (!myCfg.contains(workdayCfgName)) {
    setWorkday();
}
/* --------------------------------------Ԥ���ý���----------------------------------- */

startProgram();

/**
 * �ű�����
 */
function startProgram() {
    // 1.��鵱ǰ�Ƿ��Ǵ�ʱ���
    myStr = getOptByTime();
    if (-1 === myStr) {
        setLog("��ǰʱ�䲻�����õĿ��ڷ�Χ��!!!");
        exitShell();
    }
    unlockIfNeed();
    sleep(waitTime * 1000);
    // 1.���Ȩ��
    checkMyPermission();
    // 2.����ҳ��
    goToPage();
    open_app = true;
    handleOrgDialog();
    // 3.��ȡ������ִ��
    var randTime = random(10, maxTime);
    toast(randTime + "s��ʼ��");
    setLog(randTime + "s��ʼ��");
    sleep(randTime * 1000);
    punchTheClock();
    // 4.��ȡ���
    getReslt();
    // 5.���ظ��û�
    exitShell();
}

/**
 * �ֻ��Ƿ�����
 */
function isLocked() {
    var km = context.getSystemService(Context.KEYGUARD_SERVICE);
    return km.isKeyguardLocked() && km.isKeyguardSecure();
}

/**
 * ���ݵ�ǰ�Զ�Ϣ��ʱ���ȡѭ��ʱ��
 */
function getLoopTime() {
    let lockTime = Settings.System.getInt(context.getContentResolver(), Settings.System.SCREEN_OFF_TIMEOUT);
    if (null == lockTime || "" == lockTime || "undefined" == lockTime) {
        return 8000;
    }
    return lockTime / 2;
}

/**
 * ��ȡ��������нڼ���
 */
function setholiday() {
    setLog("��ȡ����ڼ�������");
    let res = http.get(holidayUrl, {});
    let jsonObj = JSON.parse(res.body.string());
    if (jsonObj.code == -1) {
        setLog("��ȡ�ڼ�������ʧ��");
        exitShell();
    }

    let holiday = jsonObj.holiday;
    let holidayArray = [];
    if (holiday) {
        for (let key in holiday) {
            if (holiday[key].holiday) {
                holidayArray.push(holiday[key].date);
            }
        }
        myCfg.put(holidayCfgName, holidayArray);
    } else {
        setLog("�ڼ������ݽӿڱ��������ϵ�����ߣ������ýڼ��չ���Ϊ��ѡ���������ĩ");
        exitShell();
    }
}

/**
 * ��ȡ��������нڼ���
 */
function setWorkday() {
    setLog("��ȡ������������ĩ����");
    let res = http.get(holidayUrl, {});
    let jsonObj = JSON.parse(res.body.string());
    if (jsonObj.code == -1) {
        setLog("��ȡ����ʧ��");
        exitShell();
    }

    let holiday = jsonObj.holiday;
    let workdayArray = [];
    if (holiday) {
        for (let key in holiday) {
            if (holiday[key].holiday == false) {
                workdayArray.push(holiday[key].date);
            }
        }
        myCfg.put(workdayCfgName, workdayArray);
    } else {
        setLog("�ڼ������ݽӿڱ��������ϵ�����ߣ������ýڼ��չ���Ϊ��ѡ���������ĩ");
        exitShell();
    }
}

/**
 * ������Ļ
 */
function unlockIfNeed() {
    device.wakeUpIfNeeded();
    if (!isLocked()) {
        setLog("�������");
        swipeUp();
        return;
    }
    swipeUp();
    sleep(1000);
    if (pwd) {
        enterPwd();
    } else {
        setLog("�������ֻ���������");
        exitShell();
    }
    setLog("�������");
}



/**
 * �ϻ��������������
 */
function swipeUp() {
    if (myCfg.contains("CFG_SWIPE_TIME_")) {
        const CFG_SWIPE_TIME_ = myCfg.get("CFG_SWIPE_TIME_");
        gesture(CFG_SWIPE_TIME_, [w / 2, h * 0.9], [w / 2, h * 0.1]);
        sleep(1000);
        if (swipeUpSuc()) {
            return;
        }
    }
    if (swipeUpMethodOne()) {
        log("��ʽһ�ϻ��ɹ�");
    } else if (swipeUpMethodTwo()) {
        log("��ʽ���ϻ��ɹ�");
    } else {
        setLog("��ǰ�����޷��ϻ�������������������");
        exitShell();
    }
}

/**
 * �ϻ���ʽһ
 */
function swipeUpMethodOne() {
    var xyArr = [220];
    var x0 = w / 2;
    var y0 = h / 4 * 3;
    var angle = 0;
    var x = 0;
    var y = 0;
    for (let i = 0; i < 30; i++) {
        y = x * tan(angle);
        if ((y0 - y) < 0) {
            break;
        }
        var xy = [x0 + x, y0 - y];
        xyArr.push(xy);
        x += 5;
        angle += 3;
    }
    gesture.apply(null, xyArr);
    function tan(angle) {
        return Math.tan(angle * Math.PI / 180);
    }
    return swipeUpSuc();
}

/**
 * �ϻ���ʽ��
 */
function swipeUpMethodTwo() {
    let swipeTime = 0;
    let addTime = 20;
    for (let i = 0; i < maxSwipeNum; i++) {
        swipeTime += addTime;
        gesture(swipeTime, [w / 2, h * 0.9], [w / 2, h * 0.1]);
        sleep(1000);
        if (swipeUpSuc()) {
            myCfg.put("CFG_SWIPE_TIME_", swipeTime);
            return true;
        }
    }
    return false;
}

/**
 * �ж��ϻ����
 */
function swipeUpSuc() {
    let km = context.getSystemService(Context.KEYGUARD_SERVICE);
    // �ж��Ƿ�����������
    if (!km.inKeyguardRestrictedInputMode()) {
        return true;
    }
    for (let i = 0; i < 10; i++) {
        if (!text(i).clickable(true).exists() && !desc(i).clickable(true).exists()) {
            return false;
        }
    }
    return true;
}

/**
 * �����ֻ���������
 */
function enterPwd() {
    //���
    if (text(0).clickable(true).exists()) {
        for (var i = 0; i < pwd.length; i++) {
            a = pwd.charAt(i)
            sleep(200);
            text(a).clickable(true).findOne().click()
        }
    } else {
        for (var i = 0; i < pwd.length; i++) {
            a = pwd.charAt(i)
            sleep(200);
            desc(a).clickable(true).findOne().click()
        }
    }
  KeyCode(66);
}

/**
 * �Ƿ���Ҫ��¼
 */
function loginIfNeed() {
    if (text("�����¼").clickable(true).exists()) {
        text("�����¼").clickable(true).findOne().click();
    } else if (desc("�����¼").clickable(true).exists()) {
        desc("�����¼").clickable(true).findOne().click();
    }

    if (text("��������").clickable(true).exists() || desc("��������").clickable(true).exists()) {
        if (!account || !accountPwd) {
            setLog("��ǰδ��¼�������붤����¼�˺ż�����");
            exitShell();
        }

        if (id("et_phone_input").exists() && id("et_pwd_login").exists()) {
            id("et_phone_input").findOne().setText(account);
            sleep(1000);
            id("et_pwd_login").findOne().setText(accountPwd);
            // log("ʹ��IDѡ������");
            setLog("ʹ��IDѡ������");
        } else {
            setText(0, account);
            sleep(1000);
            setText(1, accountPwd);
            // log("ʹ��setText����");
            setLog("ʹ��setText����");
        }
        if (id("cb_privacy").clickable(true).exists()) {
            sleep(500);
            id("cb_privacy").clickable(true).findOne().click();
        }
        // Android�汾����7.0
        if (device.sdkInt < 24) {
            let pageUIObj = [];
            if (id("btn_next").clickable(true).exists()) {
                id("btn_next").clickable(true).findOne().click();
            } else {
                if (text("��������").exists()) {
                    pageUIObj = text("��������").findOne().parent().parent().children();
                } else {
                    pageUIObj = desc("��������").findOne().parent().parent().children();
                }
                if (pageUIObj.length == 5) {
                    let loginBtn = pageUIObj[3].children()[0];
                    loginBtn.click();
                } else {
                    setLog("�Ҳ�����¼��ť������ϵ�ű�����!");
                }
            }

        } else {
            //��ȡ��¼��ť����
            /**
            if (text("��������").clickable(true).exists()) {
                var loginBtnY = text("��������").clickable(true).findOne().bounds().top - 10;
            } else {
                var loginBtnY = desc("��������").clickable(true).findOne().bounds().top - 10;
            }
            click(w / 2, loginBtnY);
            */
            if (id("btn_next").clickable(true).exists()) {
                id("btn_next").clickable(true).findOne().click();
            } else {
                if (text("��������").clickable(true).exists()) {
                    var loginBtnY = text("��������").clickable(true).findOne().bounds().top - 10;
                } else {
                    var loginBtnY = desc("��������").clickable(true).findOne().bounds().top - 10;
                }
                click(w / 2, loginBtnY);
            }
        }

        setLog("��¼�ɹ�");
    } else {
        setLog("�ѵ�¼");
    }
}

/**
 * �ϴ���ͼ��SMMS
 */
function uploadImg() {
    toastLog("�ϴ��򿨽�ͼ...");
    const url = "https://sm.ms/api/v2/upload";
    const fileName = "/sdcard/" + new Date().getTime() + ".png";
    captureScreen(fileName);

    let res = http.postMultipart(url, {
        smfile: open(fileName)
    }, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
            'Authorization': token
        }
    });

    let jsonObj = JSON.parse(res.body.string());
    let isSuc = jsonObj.success;
    let imgUrl = jsonObj.data.url;
    let delUrl = jsonObj.data.delete;
    if (isSuc) {
        setLog("�ֻ���ͼɾ�������" + ((files.remove(fileName) ? "�ɹ�" : "ʧ��")));
        setLog("ͼ��ͼƬɾ�����ӣ�");
        setLog(delUrl);
        setLog("�򿨽����ͼ");
        myLog += '![logo](' + imgUrl + ')';
    } else {
        setLog("ͼƬ�ϴ�ʧ��~");
    }
}

/**
 * ��ȡ�򿨽��
 */
function getReslt() {
    toastLog("�ȴ�10s��ȷ���򿨲������");
    sleep(10000);
    toastLog("ʶ��򿨽��");

    try {
        if (textContains("�򿨳ɹ�").exists() || descContains("�򿨳ɹ�").exists()) {
            setLog("��ͨʶ������" + myStr + "�ɹ�!");
        } else {
            setLog("��ͨʶ������" + myStr + "ʧ��!������Ѿ����~");
        }
        if (tokenUrl) {
            let str = getContentByOcr();
            if (str.indexOf("�򿨳ɹ�") !== -1) {
                setLog("OCRʶ������" + myStr + "�ɹ�!");
            } else {
                setLog("OCRʶ������" + myStr + "ʧ��!������Ѿ����~");
            }
        }
        if (sendImgRules != "notSend") {
            uploadImg();
        }
    } catch (error) {
        setLog("ʶ��򿨽������" + '\n\n' + error.message);
    }
    back();
    back();
}

/**
 * ���ðٶ�����ʶ��ocr�õ���ǰ�ֻ���������
 */
function getContentByOcr() {
    let img = captureScreen();
    access_token = http.get(tokenUrl).body.json().access_token;
    let url = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic" + "?access_token=" + access_token;
    let imag64 = images.toBase64(img);
    let res = http.post(url, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, image: imag64, image_type: "BASE64" });
    str = JSON.parse(res.body.string()).words_result.map(val => val.words).join();
    return str;
}

/**
 * ��
 */
function punchTheClock() {
    setLog("��ǰ������" + myStr);
    waitBtnShow();
    if (text(myStr).clickable(true).exists()) {
        text(myStr).clickable(true).findOne().click();
    }
    if (desc(myStr).clickable(true).exists()) {
        desc(myStr).clickable(true).findOne().click();
    }
}

/**
 * �ȴ����붤����¼�������������
 */
function waitStart() {
    let sTime = new Date().getTime();
    let delay = 30000;

    while ((new Date().getTime() - sTime) < delay) {
        if (text("��������").exists() || desc("��������").exists() ||
            text("����̨").exists() || desc("����̨").exists() ||
            text("�����¼").exists() || desc("�����¼").exists()) {
            break;
        }
        sleep(1000);
    }
}

/**
 * �ȴ��򿨰�ť����
 */
function waitBtnShow() {
    let sTime = new Date().getTime();
    let delay = 60000;

    while ((new Date().getTime() - sTime) < delay) {
        if (textContains("�ѽ���").exists() || descContains("�ѽ���").exists()) {
            break;
        }
        sleep(1000);
    }
}

/**
 * ��ȡ��ǰʱ�䣬��ʽ:2019/11/26 15:32:27
 */
function getDateTime(e) {
    var date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    if (e) {
        return year + '��' + month + '��' + day + '��' + hour + ':' + minute + ':' + second;
    }
    return year + '-' + month + '-' + day;
}

/**
 * ������־���˳��ű�
 */
//function exitShell() {
    //home();
    //if (open_app) {
      //kill_app('com.alibaba.android.rimet');
    //} else {
      //setLog("δ�򿪳��򣬲���Ҫ�ر�");
    //}
    //if (serverUrl && sendImgRules != "notSend") {
        //sendMsg(getDateTime(true) + " �򿨽��", myLog);
    //}
    //Power();
    //exit();
//}

/**
 * ͨ��server��������Ϣ
 * @param {*} title ����
 * @param {*} msg ����
 */
function sendMsg(title, msg) {
    let url = "https://" + sendImgRules + ".ftqq.com/" + serverUrl + ".send";
    var res = http.post(url, {
        "text": title,
        "desp": msg
    });
}

/**
 * ������־
 * @param {*} msg 
 */
function setLog(msg) {
    log(msg);
    msg += '\n\n';
    myLog += msg;
}

/**
 * ���ݵ�ǰʱ�䷵�����ϰ�򿨣������°��
 */
function getOptByTime() {
    let now = new Date();
    let yearStr = (now.getFullYear()) + "/" + (now.getMonth() + 1) + "/" + (now.getDate()) + ' ';

    for (i = 0; i < goToWorkTime.length; i++) {
        let e = goToWorkTime[i];
        let morStartTime = e.split('-')[0];
        let morEndTime = e.split('-')[1];
        //�ϰ��ʱ���->ʱ������
        let morStart = new Date(yearStr + morStartTime);
        let morEnd = new Date(yearStr + morEndTime);
        //�жϵ�ǰʱ���Ƿ���Խ����ϰ��
        if (now > morStart && now < morEnd) {
            return "�ϰ��";
        }
    }

    for (j = 0; j < afterWorkTime.length; j++) {
        let e = afterWorkTime[j];
        let nightStartTime = e.split('-')[0];
        let nightEndTime = e.split('-')[1];
        //�°��ʱ���->ʱ������
        let nightStart = new Date(yearStr + nightStartTime);
        let nightEnd = new Date(yearStr + nightEndTime);
        //�жϵ�ǰʱ���Ƿ���Խ����°��
        if (now > nightStart && now < nightEnd) {
            return "�°��";
        }
    }

    return -1;
}

/**
 * �������ܼ����˶����˾��ͨ����ͼ�����ҳ�����ʾѡ��
 */
function handleOrgDialog() {
    if ("" == companyName || null == companyName) {
        return;
    }
    let delay = 30000;
    const flagStr = "��ѡ����Ҫ����Ŀ�����֯";
    let sTime = new Date().getTime();
    while ((new Date().getTime() - sTime) < delay) {
        if (text(flagStr).exists() || desc(flagStr).exists()) {
            if (textContains(companyName).clickable(true).exists()) {
                textContains(companyName).findOne().click();
                setLog("ѡ��˾��" + companyName);
                return;
            }
            if (descContains(companyName).clickable(true).exists()) {
                descContains(companyName).findOne().click();
                setLog("ѡ��˾��" + companyName);
                return;
            }
        } else {
            sleep(1000);
        }
    }
}

/**
 * �򿪴�ҳ��
 */
function goToPage() {
    toastLog("�򿪶�����...");
    launch("com.alibaba.android.rimet");
    waitStart();
    log("�������");
    loginIfNeed();
    sleep(waitTime * 1000);
    setLog("�����ҳ��");
    var a = app.intent({
        action: "VIEW",
        data: "dingtalk://dingtalkclient/page/link?url=https://attend.dingtalk.com/attend/index.html"
    });
    app.startActivity(a);
}

/**
 * ���Ȩ��
 */
function checkMyPermission() {
    // 1.��鵱ǰ�Ƿ��Ǵ�ʱ���
    myStr = getOptByTime();
    if (-1 === myStr) {
        setLog("��ǰʱ�䲻�����õĿ��ڷ�Χ��!!!");
        exitShell();
    }

    // 2.�������������ڼ��ջ���ĩ
    if ("rule_1" == jumpRules) {
        let holidayArray = myCfg.get(holidayCfgName);
        if (holidayArray.indexOf(getDateTime(false)) != -1) {
            setLog("�����ǽڼ���, �����Ŷ~");
            exitShell();
        }
    } else if ("rule_2" == jumpRules) {
        let week = new Date().getDay();
        if (week == 6 || week == 0) {
            setLog("��������ĩ, �����Ŷ~");
            exitShell();
        }
    } else if ("rule_3" == jumpRules) {
        let week = new Date().getDay();
        let holidayArray = myCfg.get(holidayCfgName);
        let workdayArray = myCfg.get(workdayCfgName);
        if (holidayArray.indexOf(getDateTime(false)) != -1 || week == 6 || week == 0) {
            if (workdayArray != null && workdayArray.indexOf(getDateTime(false)) != -1) {
                setLog("����Ҫ����Ŷ, ������Ŷ~");
            } else {
                setLog("�����ǽڼ���, �����Ŷ~");
                exitShell();
            }
        }
    }

    // 3.������ϰ�Ȩ��
    if (auto.service == null) {
        setLog("������ϰ�����,�ű��˳�������");
        sleep(3000);
        app.startActivity({ action: "android.settings.ACCESSIBILITY_SETTINGS" });
        exitShell();
    }

    // 4.�����ͼȨ��
    if (tokenUrl || sendImgRules != "rule_0") {
        // �Զ���������ͼȨ��ʱ�İ�ť
        threads.start(function () {
            let timer = setInterval(function () {
                if (text("������ʼ").clickable(true).exists()) {
                    text("������ʼ").clickable(true).findOne().click();
                    clearInterval(timer);
                } else if (desc("������ʼ").clickable(true).exists()) {
                    desc("������ʼ").clickable(true).findOne().click();
                    clearInterval(timer);
                }
            }, 500);
        });

        if (!requestScreenCapture()) {
            setLog("�����ͼȨ��ʧ��");
            exitShell();
        }
    }

    //ȡ����������
    threads.start(function () {
        let stopUpdate = setInterval(function () {
          if (text("�ݲ�����").clickable(true).exists()) {
            text("�ݲ�����").clickable(true).findOne().click();
            clearInterval(stopUpdate);
          }
        }, 500);
     });

    toastLog("Ȩ�޼�����");
}

/**
 * ��ֹ����
 */
function kill_app(packageName) {
    var name = getPackageName(packageName);
    if (!name) {
        if (getAppName(packageName)) {
            name = packageName;
        } else {
            return false;
        }
    }
    app.openAppSetting(name);
    text(app.getAppName(name)).waitFor();
    let is_sure = textMatches(/(.*ǿ.*|.*ͣ.*|.*��.*|.*��.*)/).findOne();
    if (is_sure.enabled()) {
        textMatches(/(.*ǿ.*|.*ͣ.*|.*��.*|.*��.*)/).findOne().click();
        textMatches(/(.*ȷ.*|.*��.*)/).findOne().click();
        setLog(app.getAppName(name) + "Ӧ���ѱ��ر�");
        sleep(1000);
        back();
    } else {
        setLog(app.getAppName(name) + "Ӧ�ò��ܱ������رջ��ں�̨����");
        back();
    }
}
