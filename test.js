var http = require('http')
  , fs = require('fs')
  , options
  , params ;
var links = [] ;
//var inquirer = require("inquirer");
var execSync = require('child_process').execSync;
//var chokidar = require('chokidar');
var events = require('events');
//var async = require('async');
var test=0;

//var idbook = process.argv[2];
// https://stackoverflow.com/questions/26874444/limit-number-of-parallel-http-requests-in-node-js
// https://stackoverflow.com/questions/12060869/why-is-node-js-only-processing-six-requests-at-a-time
// https://www.quora.com/How-can-I-convert-SWF-files-to-PDF

idbk();

function idbk (callback) {
if (process.argv[2] !== undefined && process.argv[2].length == 8 ) {
    var idbook = process.argv[2];
    console.log(idbook);
    folder(idbook, callback);
} else {

}
}


function folder (idbook,callback) {
var path = __dirname+'/'+idbook;
var pathpng = path+'/'+idbook+'_PNG';
    if( fs.existsSync(pathpng)) {
        fs.readdirSync(pathpng).forEach(function(file,index){
          var curPath = pathpng + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            folder(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
    fs.rmdirSync(pathpng);
    }
    if( fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            folder(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
    fs.rmdirSync(path);
    }
    fs.mkdir(path,function(e){
        if (e) throw e ;
        console.log('Folder 1 created.');
    });
    fs.mkdir(pathpng,function(e){
        if (e) throw e ;
        console.log('Folder PNG created.');
    });
    getlinks(path, pathpng, idbook,callback);
}

function getlinks (path, pathpng, idbook,callback) {
var nbpage;
    params = {
        host: 'univ-bium.cyberlibris.com'
      , port: 80
      , path: '/reader/flashpages/?MagID='+idbook
      , headers: {'Cookie': 'CYBSIDX39=509sav3kim7csp8l93potm0o63'}
    };
    
    var req = http.get(params, function(res) {
      // save the data
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        var xml = '';
        res.on('data', function(chunk) {
            xml += chunk;
        });

        res.on('end', function(e) {
            var xmltmp1 = (xml.split('src="'));
            var xmltmp2 = xmltmp1.slice(1);
            for(var i = 0; i < xmltmp2.length;i++){ 
                var swfname = path+'/'+i+'.swf';
                var pngname = pathpng+'/'+i+'.png';
                /(.+?)"/.exec(xmltmp2[i]);
                links[i] = RegExp.$1 ;
                links[i] = links[i].replace(/(amp;)/g,'');
                if (links[i].indexOf('sig=') == -1) {
                    console.log('Il manque des signatures, verrifier les cookies : ' + links[i]);
                    nbpage=i;
                    console.log(nbpage);
                    break;
                }
                console.log(links[i]);
                nextlinks(nbpage,swfname,pngname,path, pathpng, idbook, links,i, callback )
            }
        if (e) throw e ;
        });
    });
    
    //next
}


function nextlinks(nbpage,swfname,pngname,path, pathpng, idbook,links,i,callback) {

    //console.log(links);
    options = {
        host: 'univ-bium.cyberlibris.com'
      , port: 80
      , path: links[i]
      , headers: {'Cookie': 'CYBSIDX39=509sav3kim7csp8l93potm0o63'}
    };
    var request = http.get(options, function(res){
        var imagedata = '';
        res.setEncoding('binary');
    
        res.on('data', function(chunk){
            imagedata += chunk;
        });
    
        res.on('end', function(){
            test++;
            console.log(test);
            fs.writeFile(swfname, imagedata, 'binary', function(err){
            if (err) throw err ;
            console.log('File saved.');
            console.log(swfname);
            console.log(links[i]);
            var stats = fs.statSync(swfname);
            var fileSizeInBytes = stats["size"];
            console.log(fileSizeInBytes);
            if (fileSizeInBytes <= 150) {
                fs.unlinkSync(swfname);
                console.log("Le fichier "+swfname+" à été détruit car trop petit");
            } 
            swftool(swfname,pngname,pathpng);
            });
        });
    });
    
}


function swftool(swfname,pngname,pathpng) {
    //var spawn = require('child_process').spawn,
    //swfrender = spawn('swfrender', ['-X 1654','-Y 2339', swfname ,'-o',pngname]);
    //commande:
    //swfrender -X 1654 -Y 2339 /home/ubuntu/workspace/Cyberlibris_JS/88828385/0.swf -o /home/ubuntu/workspace/Cyberlibris_JS/88828385/88828385_PNG/0.png
  
try {
    execSync('swfrender -X 1654 -Y 2339 '+swfname+' -o '+pngname, function (err, stdout, stderr) {
    console.log('Trans '+swfname);
    if (err) throw err;
    console.log(stdout);
    console.log(err);
    console.log(stderr);
});
} catch (e) {}


    //waitfor (i);
    /*var spawn = require('child_process').spawnSync,
    swfrender = spawn('swfrender', ['-X 1654','-Y 2339', swfname ,'-o',pngname]);
    
    
    console.log(swfname);
    console.log(pngname);
    
    swfrender.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
    });
    
    swfrender.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
    });
    
    var donetrans = swfrender.on('close', function (code) {
    console.log(pngname+' child process exited with code ' + code);
    if (code!==0){
        //swftool(swfname,pngname,pathpng);
        console.log('erreur');
    }
    if (code===0){
        console.log('GOOD!');
    }
    });*/
}

