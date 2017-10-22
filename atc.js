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

function targetStartUsing(logLine, target){
    re  = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w{4}:('+target+')の「(.+)」','g');
    return re.exec(logLine);
}

function targetUsing(logLine, target){
    re1 = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w{4}:('+target+')は「(.+)」の構え','g');
    re2 = RegExp('\\[(\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\] \\w\\w:\\w{4}:('+target+')は「(.+)」を唱えた','g');
    
    var ret = re1.exec(logLine);
    ret = ret ? ret : re2.exec(logLine);
    return ret;
}

function generateTimelineFormat(timelineArray){
    var ret = '';
    for (var lineIndex in timelineArray){
        var timestamp = timelineArray[lineIndex][1];
        var actionName = timelineArray[lineIndex][3];
        var currentLineText = timestamp + ' \"' + actionName + '\"' + '\n';
        ret = ret + currentLineText;
    }
    return ret;
}

function main(logString, target){
    var logArray = string2array(logString);
    var timelineString = '';
    var timelineArray = [];
    for(var logLineIndex in logArray){
        if (isLogInGame(logArray[logLineIndex])){
            var targetAction = targetUsing(logArray[logLineIndex], target);
            if (targetAction){
                timelineArray.push(targetAction);
            }
        }
    }
    return generateTimelineFormat(timelineArray);
}
