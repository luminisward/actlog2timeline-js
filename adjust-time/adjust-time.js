function string2array(logString){
    return logString.split('\n');
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

function isActivity(line){
    var re = RegExp('<a.+time=".+?".+\/>','g');
    return re.test(line)
}

function main(logString, seconds){
    var logArray = string2array(logString);
    var timelineString = '';
    var timelineArray = [];
    
    for(var logLineIndex in logArray){

        var line = logArray[logLineIndex]

        // 游戏内Log
        if(isActivity(line)){
            
            var re = RegExp('<a.+time="(.+?)".+\/>','g');
            var time = re.exec(logArray[logLineIndex])[1];

            newTime = parseInt(time) + parseInt(seconds);
            var replacement = 'time="' + newTime + '"';
            var line = logArray[logLineIndex].replace('time="'+time+'"', replacement)
        }
        timelineArray.push(line);
         
    }
    return timelineArray.join('\n');
}
