var http=require("http");
var fs=require("fs");

var folder="/media/FimFictions/";

var num=Number(process.argv[2])-1;
var stopNum=Number(process.argv[3]);
var total=0;
var amtBad=0;
var amtFail=0;
var amtAbort=0;
var stop=false;
var folderExists=[];
function go(currentNum){
	if(stopNum&&currentNum>=stopNum){
		console.log("DONE! "+currentNum+" "+stopNum);
		return;
	}
	if(currentNum<=topNum){
		return;
	}
	topNum=currentNum;
	process.stdout.write("\u001b[2J\u001b[0;0H");
	process.stdout.write(currentNum+"\n\nStarting... \n"+stats());
	var options={
		host: "www.fimfiction.net",
		port: 80,
		path: "/download_story.php?story="+currentNum+"&html",
		num:currentNum+0
	}

	var request = http.get(options, function(res){
		total++;
		
		if(res.headers["content-disposition"]){
			var name=res.headers["content-disposition"].replace('attachment; filename="', "").slice(0, -1);
			name=name.replace(/[\?\/\\:\*\"<>\|]/g, "").replace(".html", "-"+currentNum+".html");
			name=name.replace(/[^a-zA-Z0-9.?!,%'"@#$^&*()\-_=+~`;:{}|\\>< \/]/g, "\?");
			var incFolder=(Math.floor(currentNum/2000)*2000)+"/";
			if(!folderExists[incFolder]){
				if(!fs.existsSync(folder+incFolder)){
					fs.mkdirSync(folder+incFolder);
				}
				folderExists[incFolder]=true;
			}
			process.stdout.write("\u001b[2J\u001b[0;0H");
			process.stdout.write(currentNum+"\n"+name+"\nDownloading... \n"+stats());
			if((folder+incFolder+name).length>220){
				res.on('end', function(){});
				fs.appendFile("failed", currentNum+"\n", function(err){
					amtFail++;
					contin("Fail");
				});
				return;
			} else{
				var writeStream = fs.createWriteStream(folder+incFolder+name);
				res.pipe(writeStream);
				
				var timeout=setTimeout(function(){
					res.on('end', function(){});
					fs.appendFile("failed", currentNum+"\n", function(err){
						amtFail++;
						contin("Fail");
					});
				}, 8*1000);
				
				res.on('end', function(){
					clearTimeout(timeout);
					writeStream.end();
					contin("Good");
				});
			}
		} else{
			amtBad++;
			contin("Bad");
		}
	});
}
function toggleStop(){
	stop=true;
}
var topNum=-1;
function contin(code){
	process.stdout.write("\u001b[2J\u001b[0;0H");
	if(!stop){
		num++;
		go(num);
		//process.stdout.write(num+"\n"+code+"\nWaiting...\n"+stats());
	}else{
		process.stdout.write(num+"\n\nStopped!\n"+stats());
	}
}
function stats(){
	return "Good: "+(total-amtBad)+"/"+total+" "+(Math.round(((total-amtBad)/total)*100))+"%      Bad: "+amtBad+"/"+total+" "+(Math.round((amtBad/total)*100))+"%      Failed: "+amtFail+"/"+total+" "+(Math.round((amtFail/total)*100))+"%      Aborted: "+amtAbort+"/"+total+" "+(Math.round((amtAbort/total)*100))+"%\n";
}

process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
process.stdin.on('data', function(text){
	text=util.inspect(text).replace(/(\\r)|(\\n)|'/g,"");
	switch(text){
		case "go":
			go();
		break;
		default:
			toggleStop();
		break;
	}
});