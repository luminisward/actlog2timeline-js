function string2array(logString){
    return logString.split('\n');
}

function isLogInGame(logLine){
    if(logLine.indexOf(" 00:") == -1){
        return false;
    }else{
        return true;
    }
}

function isJSON(str) {
    if (typeof str == 'string') {
        try {
            JSON.parse(str);
            return true;
        } catch(e) {
            console.log(e);
            return false;
        }
    }
    console.log('It is not a string!')    
}


function calcTimeDifference(currentTime, startTime){
    var day = '1970-1-1 ';
    var difference = Date.parse(day + currentTime) - Date.parse(day + startTime);
    if(isNaN(difference)){
        console.log('Time format incorrect: ' + day + currentTime + ' ' + day + startTime)
        return false;
    }
    // 跨越0点时补上一天的秒数
    if(difference < 0){
        difference = difference + 86400000
    }
    return (difference / 1000).toFixed(1);
}

function isTarget(targetString, logLineObj){
    if(targetString.indexOf(logLineObj.user) != -1){
        return true;
    }else{
        return false;
    }
}

function isExcludeAction(actionString, logLineObj){
    if(actionString.indexOf(logLineObj.action) != -1){
        return true;
    }else{
        return false;
    }
}

function parseInGameLog(logLine){
    var re1 = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w{4}:(.+)は「(.+)」の構え','g');
    var re2 = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w{4}:(.+)は「(.+)」を唱えた','g');
    var re3 = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w{4}:(.+)の「(.+)」$','g');
    var re4 = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w+:(.+) starts using (.+) on ','g');
    var re5 = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w+:(.+?):\\w+:(.+?):\\w+:','g');
    var logLineArray = new Array();
    var logLineObj = new Object();

    if(logLineArray = re1.exec(logLine)){
        logLineArray.push('構え');
    }else if(logLineArray = re2.exec(logLine)){
        logLineArray.push('唱えた');
    }else if(logLineArray = re3.exec(logLine)){
        logLineArray.push('の');
    }else if(logLineArray = re4.exec(logLine)){
        logLineArray.push('start using');
    }else if(logLineArray = re5.exec(logLine)){
        logLineArray.push('used');
    }else{
        return false;
    }
    logLineObj.time = logLineArray[1];
    logLineObj.user = logLineArray[2];
    logLineObj.action = logLineArray[3];
    logLineObj.status = logLineArray[4];
    return logLineObj;
}

// 合并读条
function combineStartsUsing(logArray){
    var obj = {};
    var ret = [];
    var duration;
    var currentTime;
    var lastTime;
    for(var logLineIndex in logArray){
        var user = logArray[logLineIndex].user;
        var time = logArray[logLineIndex].time;
        var action = logArray[logLineIndex].action;
        var status = logArray[logLineIndex].status;
        var timestamp = logArray[logLineIndex].timestamp;
        if(!obj[user]){
            obj[user] = new Map();
        }
        obj[user][time] = {'action': action, 'status': status, 'timestamp': timestamp};
    }
    for(var user in obj){
        for(var time in obj[user]){
            // 读条中状态
            if(['構え','唱えた','start using'].indexOf(obj[user][time]['status']) != -1){
                lastTime = time;
            }
            // 发动时
            if(lastTime && ['の','used'].indexOf(obj[user][time]['status']) != -1){
                duration = calcTimeDifference(time,lastTime);
                obj[user][lastTime]['duration'] = duration;
                obj[user][time]['duration'] = 'remove';
                lastTime = undefined;
            }
        }
    }
    for(var user in obj){
        for(var time in obj[user]){
            var line = {
                'user': user,
                'time': time,
                'timestamp': obj[user][time]['timestamp'],
                'status': obj[user][time]['status'], 
                'action': obj[user][time]['action'], 
                'duration': obj[user][time]['duration']
            };
            ret.push(line);
        }
    }
    return ret;
}

function removeRepeatLogline(logArray){
    var ret = [];
    var obj = {};
    for(var logLineIndex in logArray){
        var key = JSON.stringify(logArray[logLineIndex]);
        if(!obj[key]){
            ret.push(logArray[logLineIndex]);
            obj[key] = 1;
        }
    }
    return ret;
}

function translateAction(timelineArray, actionTranslateJson){
    if(isJSON(actionTranslateJson)){
        var actionMap = JSON.parse(actionTranslateJson);
        for(var timelineIndex in timelineArray){
            var action = timelineArray[timelineIndex].action;
            timelineArray[timelineIndex].action = actionMap[action] ? actionMap[action] :action ;
        }
        
    }
    return timelineArray;
}

function generateTimelineFormat(timelineArray){
    var ret = '';
    for (var lineIndex in timelineArray){
        var timestamp = timelineArray[lineIndex]['timestamp'];
        var user = timelineArray[lineIndex]['user'];
        var actionName = timelineArray[lineIndex]['action'];
        var duration = timelineArray[lineIndex]['duration'];
        var currentLineText = timestamp + ' \"' + actionName + '\"\n';
        ret = ret + currentLineText;
    }
    return ret;
}

function outputArray(timelineArray){
    var ret = '';
    for (var lineIndex in timelineArray){
        var timestamp = timelineArray[lineIndex]['timestamp'];
        var user = timelineArray[lineIndex]['user'];
        var actionName = timelineArray[lineIndex]['action'];
        var status = timelineArray[lineIndex]['status'];
        var duration = timelineArray[lineIndex]['duration'];
        var currentLineText = timestamp + ' ' + user + ' ' + status + ' \"' + actionName + '\" ' + '\n';
        ret = ret + currentLineText;
    }
    return ret;
}




function main(logString, targetString, startTime, isAutoCombine, actionTranslateJson, excludeActionString){
    var logArray = string2array(logString);
    var timelineString = '';
    var timelineArray = [];
    

    
    for(var logLineIndex in logArray){

        // 游戏内Log
        var logLineObj = parseInGameLog(logArray[logLineIndex]);
        if(logLineObj){
            if(!isTarget(targetString,logLineObj)){
                continue;
            }
            if(isExcludeAction(excludeActionString,logLineObj)){
                continue;
            }
            logLineObj.timestamp = startTime ? calcTimeDifference(logLineObj.time, startTime) : logLineObj.time;
            timelineArray.push(logLineObj);
        }
         
    }
    timelineArray = removeRepeatLogline(timelineArray);
    timelineArray = isAutoCombine ? combineStartsUsing(timelineArray) : timelineArray;
    timelineArray = translateAction(timelineArray, actionTranslateJson);
    
    return generateTimelineFormat(timelineArray);
}

function inGame(logString, target, startTime){
    var logArray = string2array(logString);
    var timelineString = '';
    var timelineArray = [];
    
    for(var logLineIndex in logArray){
        if (!isLogInGame(logArray[logLineIndex])){
            timelineString = timelineString + logArray[logLineIndex] + '\n';
        }
    }
    return timelineString;
}