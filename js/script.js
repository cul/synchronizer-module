/* Columbia University Library
   Project: Synchronizer Module
   File: script.js
	 Description: Javascript functions providing file upload and display
   Author: Ashley Pressley
   Date: 11/22/2017
*/

// Here is our error handling
function errorHandler(e) {
	$("#errorBar").show();
  document.getElementById('errorBar').innerHTML = '<i id="close" class="fa fa-times-circle-o close"></i><p><i class="fa fa-exclamation-circle"></i> ' + e + '</p><hr />';
	$('html, body').animate({ scrollTop: 0 }, 'fast');

	document.getElementById('close').addEventListener('click', function(){
		$(this).parent('div').fadeOut();
	}, false);
}

// Here we play audio files in the video control player
function renderVideo(file) {
	$("#video").show();
	$("#audio").hide();

	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  		var target = event.target.result;
  		var videoNode = document.querySelector('video');

  		videoNode.src = target;
			$("#media-upload").hide();
  	}
  }
  catch (e) {
		errorHandler(e);
		$("#media-upload").show();
	}

	reader.readAsDataURL(file);
}

// Here we play audio files in the audio control player
function renderAudio(file) {
	$("#audio").show();
	$("#video").hide();

	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  		var target = event.target.result;
  		var audioNode = document.querySelector('audio');

  		audioNode.src = target;
			$("#media-upload").hide();
  	}
  }
  catch (e) {
		errorHandler(e);
		$("#media-upload").show();
	}

	reader.readAsDataURL(file);
}

// Here we display text file data
function renderText(file) {
	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  		var target = event.target.result;
      guessLanguage.name(target, function(languageName) {
      	document.getElementById('language').innerHTML = "Documents provided are in " + languageName + ".";
      });

      document.getElementById('index').value += target;
  	}
  }
  catch (e) { errorHandler(e); }

	reader.readAsText(file);
}

// Here we ensure the extension is usable by the system
function checkExt(ext) {
	var allowed = ["txt",
								 "vtt",
								 "xml",
								 "srt",
								 "mp4",
								 "webm",
								 "ogg",
								 "mp3"];

	if (allowed.indexOf(ext.toLowerCase()) > -1) return true;
	else return false;
}

// Here we determine what kind of file was uploaded
function determineFile(file, ext) {
	// List the information from the files
	console.group("File Name: " + file.name);
	console.log("File Size: " + parseInt(file.size / 1024, 10));
	console.log("File Type: " + file.type);
	console.log("Last Modified Date: " + new Date(file.lastModified));
	console.groupEnd();

	// Depending on the type of file, display its contents in specific players or locations
	if (file.type.match('video.*')) renderVideo(file);
	else if (file.type.match('audio.*')) renderAudio(file);
	else if (file.type.match('text.*')) renderText(file);

	// For legacy SRT files
	else if (ext == "srt" || ext == "SRT") renderText(file);

	// If no file types or extensions are caught, clearly there's something wrong
	else errorHandler(new Error("Bad File - cannot display data."));
}

// Document Ready
(function($){
	// Don't show the video and audio controls
	$("#video").hide();
	$("#audio").hide();
	$("#errorBar").hide();

	// Here we hide items the user no longer wishes to see
	for (var close of document.querySelectorAll('.close')) {
	  close.addEventListener('click', function(){
			$(this).parent('div').fadeOut();
		}, false);
	}

	// For grabbing index and transcript files via upload
	document.getElementById('file-upload').addEventListener('change', function(){
		// Originally allowed multiple concurrent file uploads, removed per original requirements
		for(var i = 0; i < this.files.length; i++){
			var file =  this.files[i];

			// Get file extension
			var name = file.name.split('.');
			var ext = name[name.length - 1];

			if (checkExt(ext)) determineFile(file, ext);
			else errorHandler(new Error("Bad File - cannot load data from " + file.name));
		}
	}, false);

	// For grabbing audio and video files via upload
	document.getElementById('media-file-upload').addEventListener('change', function(){
		// Originally allowed multiple concurrent file uploads, removed per original requirements
		for(var i = 0; i < this.files.length; i++){
			var file =  this.files[i];

			// Get file extension
			var name = file.name.split('.');
			var ext = name[name.length - 1];

			if (checkExt(ext)) determineFile(file, ext);
			else errorHandler(new Error("Bad File - cannot load data from " + file.name));
		}
	}, false);

	// For importing index and transcript files via URL
	document.getElementById('url-submit').addEventListener('click', function(){
		var url = document.getElementById('url-upload').value;

		// Get file extension from url
		var urlArr = url.split('.');
		var ext = urlArr[urlArr.length - 1];

		fetch(url)
			.then(res => res.blob())
			.then(blob => {
				if (checkExt(ext)) determineFile(blob, ext);
				else errorHandler(new Error("Bad File - cannot load data from " + url));
			})
			.catch(function(e) { errorHandler(e); });
	});

	// For importing audio and video files via URL
	document.getElementById('media-url-submit').addEventListener('click', function(){
		var url = document.getElementById('media-url-upload').value;

		// Get file extension from url
		var urlArr = url.split('.');
		var ext = urlArr[urlArr.length - 1];

		fetch(url)
			.then(res => res.blob())
			.then(blob => {
				if (checkExt(ext)) determineFile(blob, ext);
				else errorHandler(new Error("Bad File - cannot load data from " + url));
			})
			.catch(function(e) { errorHandler(e); });
	});
}(jQuery));
