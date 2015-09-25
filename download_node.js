var http=require("http");
var fs=require("fs");

var folder="/fiction";

var num=Number(process.argv[2]);
var stopNum=Number(process.argv[3]);
var total=0;
var amtBad=0;
var amtFail=0;
var amtAbort=0;
var stop=false;
function go(){
	if(stopNum&&num>=stopNum){
		console.log("DONE! "+num+" "+stopNum);
		return;
	}
	//process.stdout.write("\u001b[2J\u001b[0;0H");
	//process.stdout.write(num+"\n\nStarting... \n"+stats());
	var options={
		host: "www.fimfiction.net",
		port: 80,
		path: "/download_story.php?story="+num+"&html",
		num:num+0
	}

	var request = http.get(options, function(res){
		total++;
		
		if(res.headers["content-disposition"]){
			var name=res.headers["content-disposition"].replace('attachment; filename="', "").slice(0, -1);;
			name=name.replace(/[\?\/\\:\*\"<>\|]/g, "").replace(".html", "-"+num+".html");
			process.stdout.write("\u001b[2J\u001b[0;0H");
			process.stdout.write(num+"\n"+name+"\nDownloading... \n"+stats());
			var writeStream = fs.createWriteStream(folder+name);
			res.pipe(writeStream);
			
			var timeout=setTimeout(function(){
				res.on('end', function(){});
				fs.appendFile("failed", num+"\n", function(err){
					amtFail++;
					contin("Fail");
					num++;
				});
			}, 10*1000);
			
			res.on('end', function(){
				clearTimeout(timeout);
				writeStream.end();
				contin("Good");
				num++;
			});
		} else{
			amtBad++;
			contin("Bad");
			num++;
		}
	});
}
function toggleStop(){
	stop=true;
}
function contin(code){
	//process.stdout.write("\u001b[2J\u001b[0;0H");
	if(!stop){
		go();
		//process.stdout.write(num+"\n"+code+"\nWaiting...\n"+stats());
	}else{
		process.stdout.write(num+"\n\nStopped!\n"+stats());
	}
}
function stats(){
	return "Bad: "+amtBad+"/"+total+" "+(Math.round((amtBad/total)*100))+"%      Failed: "+amtFail+"/"+total+" "+(Math.round((amtFail/total)*100))+"%      Aborted: "+amtAbort+"/"+total+" "+(Math.round((amtAbort/total)*100))+"%\n";
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