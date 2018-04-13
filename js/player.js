function $(i){return document.getElementById(i)};
var banners=[],bannerIndex=0,bannerTimer,playerTimer,albums={},updates,lastVisible,currentSong,currentAlbum,loopType=0,pageStartTime=new Date();
function playlistCallback(data){
	updates=[];
	document.title=data.playerName;
	$("cover").innerHTML=data.coverHTML;
	var tr=$("topAlbumList");
	for(var i=0;i<data.album.length;i++){
		var album = data.album[i];
		albums[album.name]=album;
		//专辑入口
		if(i<5){
			banners.push({cover:album.cover,"album":album.name,title:album.list[0].name})
			var td=tr.insertCell();
			td.innerHTML="<img src='"+album.avatar+"' class=circle-avatar onclick=showAlbum('"+escape(album.name)+"')><div>"+album.name+"</div>";
		}
		var newestItem = album.list[0];
		for(var j=0;j<album.list.length;j++){
			var t=album.list[j];
			t.albumName=album.name;
			t.url = album.path+t.file;
			updates.push(t);	//更新数据
			if(t.update>newestItem.update){
				newestItem=t;
			}
		}
		//专题列表
		var td=$("allAlbumList").insertRow().insertCell();
		td.innerHTML='<span onclick=showAlbum("'+escape(album.name)+'")>&nbsp; <img src='+album.avatar+' class=avatar><span style="width:65vw;height:25vw;position:absolute"><h2>'+album.name+'</h2><span class="articleList"> &nbsp; '+newestItem.name+'</span><br><h3 class=timeStamp> &nbsp; '+(new Date(newestItem.update)).toLocaleDateString()+' &nbsp; </h3></span></span>';
	}
	//最新更新
	updates.sort(function(a,b){return b.update-a.update})
	var maxUpdate=Math.min(5,updates.length),tAlbum={};//显示最新更新数量
	for(var i=0;i<maxUpdate;i++){
		var item=updates[i];
		var found=false;
		for(var j in tAlbum){
			if(j == item.albumName){
				tAlbum[item.albumName].push(item);
				found=true;
			}
		}
		if(!found){
			tAlbum[item.albumName]=[item];
		}
	
	}
	for(var i in tAlbum){
		var td=$("newUpdates").insertRow().insertCell();
		var a=['<br><h2> &nbsp; '+i+'<span style="float: right;color:gray;" onclick=showAlbum("'+escape(i)+'")>查看全部</span></h2>'];
		for(var j=0;j<tAlbum[i].length;j++){
			a.push('<div class=articleList onclick=playSong("'+escape(tAlbum[i][j].name)+'")> &nbsp; &nbsp; ▶ '+tAlbum[i][j].name+'</div>');
		}
		td.innerHTML=a.join("<br>");				
	}
	setTimeout(hideCover,300);
	setTimeout("	changeLoopType(0)",100);
}
function checkHash(){
	if(/#song=/.test(location.hash)){
		var songName=location.hash.substr(location.hash.indexOf("song=")+5);
		playSong(songName);
	}else if(/#album=/.test(location.hash)){
		var albumName=location.hash.substr(location.hash.indexOf("album=")+6);
		showAlbum(albumName);
		//audio.pause();
	}else{
		switchMode("subjectList");	
	}
}
function hideCover(){
	hideCover=function(){}
	fadeIn("subjectList");
	fadeOut("cover");
	bannerIndex=-1;
	fadeOutBanner();
	if(location.hash!=""){
		var s=location.hash;
		location.hash="";
	//	window.onhashchange=checkHash;
		location.hash=s;
//		setTimeout("location.hash=unescape('"+escape(s)+"')",0)
	}
	setTimeout(function(){$("cover").parentNode.removeChild($("cover"));},300);
	clearInterval(bannerTimer);
	bannerTimer=setInterval(fadeOutBanner,5000);
}
function fadeOutBanner(){
	fadeOut("slides");
	setTimeout(fadeInBanner,300);
}
function fadeInBanner(){
	bannerIndex=(++bannerIndex) % banners.length;
	$("slides").style.backgroundImage="url("+banners[bannerIndex].cover+")";
	$("slides").title=banners[bannerIndex].title;
	$("slides").firstChild.innerHTML=banners[bannerIndex].album+"<br> —— "+banners[bannerIndex].title;
	
	fadeIn("slides")
}

var audio=$("audio");
function fadeIn(e) {
	$(e).className = "bg fadein";
};

function fadeOut(e) {
	$(e).className = "bg";
};

function setPlay(){
	$("btnPlay").innerHTML='⏸';
	$("songName").firstChild.style.display="none";
	$("songName").lastChild.style.display="";
	$("songName").lastChild.start();
	playerTimer=setInterval(function(){getSongCurrent()},1000);
}
function setPaused(){
	$("btnPlay").innerHTML='⏯';
	$("songName").firstChild.style.display="";
	$("songName").lastChild.style.display="none";
	$("songName").lastChild.stop();
	//clearInterval(playerTimer);
}
function setStart(){
	dragTo(0)
	setPaused();
}

function getSongInfo(){
	audio=document.getElementsByTagName("audio")[0];
	var m = Math.floor(audio.duration / 60);
	var s = Math.round(audio.duration % 60);
	m=(m<10?"0":"")+m;
	s=(s<10?"0":"")+s;
	$("songLength").innerHTML = m+":"+s;
}
function getSongCurrent(){
	var m = Math.floor(audio.currentTime / 60);
	var s = Math.floor(audio.currentTime % 60);
	m=(m<10?"0":"")+m;
	s=(s<10?"0":"")+s;
	$("songCurrent").innerHTML=m+":"+s;
	var p=$("progressBar");
	p.value=p.max*audio.currentTime/audio.duration;
	$("songCurrentBar").style.width=(100-audio.currentTime/audio.duration*100)+"%"
}
function dragTo(v){
	audio.currentTime=Math.floor(audio.duration*v/$("progressBar").max);
	getSongCurrent();
}
function switchBack(){
	switchMode(lastVisible)
}
function switchMode(mode){
	var modes=["subjectList","subjectDetail","player","QRCODE"];
	for(var i in modes){
		var m=modes[i];
		if($(m).style.display!="none"){
			lastVisible=m;
		}
		$(m).style.display=(mode==m)?"block":"none";
	}
	if(mode=="subjectList"){
		clearInterval(bannerTimer);
		bannerTimer=setInterval(fadeOutBanner,5000);
	}else{
		clearInterval(bannerTimer);
	}
	if(mode =="player"){
		$("floatPlayer").style.display="none";
	}else{
		setPaused();
		if(currentSong) $("floatPlayer").style.display="block"
	}
	$("containor").scrollTo(0,0)
}
function showAlbum(s){
	if(!s) s=currentSong.albumName;
	s = unescape(s);
	var a=albums[s];
	if(!s || !a) {switchMode("subjectList");return;}
	currentAlbum = a;
	switchMode('subjectDetail');
	location.hash="album="+escape(s);
	$("subjectTitle").innerHTML=a.name
	$("subjectBanner").style.backgroundImage="url("+a.cover+")";
	$("albumAbstract").innerHTML=a.abstract;
	$("albumSongs").firstChild.innerHTML=""
	for(var i=0;i<a.list.length;i++){
		var tr=$("albumSongs").insertRow();
		tr.insertCell().innerHTML= " <span onclick=playSong(\""+escape(a.list[i].name)+"\")> ▶ "+a.list[i].name+"</span><span style='float:right' onclick=qrCode('"+escape(a.list[i].name)+"','song')>⎋ </span><hr>";
	}
}
function playSong(s){
	switchMode('player');
	if(!s) s=escape(currentSong.name);
	if(location.hash != "#song="+s){
		if(/#song=/.test(location.hash)){
			location.replace(location.href.replace(/#song=.*/,"#song="+s));
		}else{
			location.hash="song="+s;
			return;
		}
	}
	s=unescape(s);
	var a,arr=[];
	for(var i=0;i<updates.length;i++){
		if(s==updates[i].name){
			currentSong=updates[i];
			a=albums[currentSong.albumName];
			break;
		}
	}
	$("floatSongName").innerHTML=
	$("songName").firstChild.innerHTML=
	$("songName").lastChild.innerHTML=currentSong.name;
	$("playerBackground").src=a.cover;
	$("songCover").src=a.cover;	
	$("floatAlbumName").innerHTML=
	$("albumName").innerHTML=a.name;
	$("albumAvatar").src=$("floatAvatar").src=a.avatar;
	$("singer").innerHTML=currentSong.singer;
	if($("mp3Source").src!=currentSong.url){
		$("mp3Source").src=currentSong.url;
		audio.load();
	}
	$("albumInfo").innerHTML="<br>专辑 "+a.name+" 共"+a.list.length+"条音频"
	for(var i=0;i<a.list.length;i++){
		if(a.list[i].name==currentSong.name){
			arr.push("<p><b> ▶ "+a.list[i].name+"</b></p>")	;
			if(i>0){
				$("btnPreviousSong").songName=a.list[i-1].name
			}else{
				$("btnPreviousSong").songName="";
			}
			if(i<a.list.length-1){
				$("btnNextSong").songName=a.list[i+1].name
			}else{
				$("btnNextSong").songName="";	
			}
		}else{
			arr.push("<p onclick='playSong(\""+escape(a.list[i].name)+"\")'> &nbsp; "+a.list[i].name+"</p>")
		}
	}
	$("albumDetail").innerHTML="<h2>"+arr.join("")+"</h2>";
}
function changeLoopType(p){
	/*
	 0:单曲  ⟼  
	 1:单曲循环  ⤽⮐⥂
	 2:循环播放 ⟲ ⟳ ↺  ↻ 
	 3:列表播放
	 * */
	p=p?p:0;
	if(p) loopType = (loopType+p) % 4;
	//audio.removeEventListener('ended',playNext,false);
	//audio.removeEventListener('ended', setStart, false);
	audio.loop = false;
	if(loopType==0){//单曲
		$("btnLoopType").innerHTML="<tt>⟼</tt>单曲播放";
		//audio.addEventListener('ended', setStart, false);
		audio.onended=setStart;
	}else if(loopType==1){//单曲循环
		audio.loop = true;
		$("btnLoopType").innerHTML="<tt>⥂</tt>单曲循环";		
	}else if(loopType==2){//循环播放
		$("btnLoopType").innerHTML="<tt>⟳</tt>列表循环";
		//audio.addEventListener('ended', playNext, false);
		audio.onended=playNext;
	}else if(loopType==3){//列表播放
		$("btnLoopType").innerHTML="<tt>⇣</tt>列表播放";
		//audio.addEventListener('ended', playNext, false);
		audio.onended=playNext;
	}
}
function playNext(plus){
	if(isNaN(plus))plus=1;
	var list = albums[currentSong.albumName].list;
	for(var i=0;i<list.length;i++){
		if(list[i] ==currentSong ){
			i+=plus;
			if(loopType==2){
				if(i<0) i=list.length-1;//前越界到队列末
				if(i >=list.length) i=0; //后越界到队列头
			}else if(loopType==3){
				if(i >=list.length) i=0; //后越界到队列头
				if(i<0) i=list.length-1;//前越界到队列末
				//audio.removeEventListener('ended',playNext,false);
				if(i<list.length-1){
					//audio.addEventListener('ended', playNext, false);
					audio.onended=playNext;
				}else{
					audio.onended=setStart;
				}
			}else if (loopType<=1){
				if(i<0) i=0;
				if(i >=list.length){i=list.length-1};	
			}
			playSong(escape(list[i].name));
			return;
		}
	}
}
function qrCode(title,type){
	if(type=="song" | type=="album"){
		switchMode("QRCODE");
		location.hash="#"+type+"="+title;
		var url=location.href;
//			$("QRCODE").innerHTML="<br><br><center><img width=80% src=http://b.bshare.cn/barCode?site=weixin&url="+url.replace("#","%23")+"><br><a href="+url+"><p>长按保存或者扫描二维码分享 "+title+" </p></a><center>";	
//			$("QRCODE").innerHTML="<br><br><center><img width=80% src=http://www.kuaizhan.com/common/encode-png?large=true&data="+url.replace("#","%23")+"><br><a href="+url+"><p>长按保存或者扫描二维码分享 "+title+" </p></a><center>";	
		$("QRCODE").innerHTML="<br><br><center><img width=80% src=http://pan.baidu.com/share/qrcode?w=150&h=150&url="+url.replace("#","%23")+"><br><a href="+url+"><p>长按保存或者扫描二维码分享 "+unescape(title)+" </p></a><center>";	
		//$("QRCODE").innerHTML="<br><br><center><img width=80% src=http://s.jiathis.com/qrcode.php?url="+url+"><br><a href="+url.replace("#","%23")+"><p>长按保存或者扫描二维码分享 "+title+" </p></a><center>";	
	}
}