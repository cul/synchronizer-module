/* Columbia University Library
   Project: Synchronizer Module
   File: script.js
	 Description: Javascript functions providing file upload and display
   Author: Ashley Pressley
   Date: 12/28/2017
	 Version: 0.3.0
*/

// Here is our error handling
function errorHandler(e) {
	$("#errorBar").show();
  $('#errorBar').html('<i id="close" class="fa fa-times-circle-o close"></i><p class="error-bar"><i class="fa fa-exclamation-circle"></i> ' + e + '</p><hr />');
	$('html, body').animate({ scrollTop: 0 }, 'fast');

	document.getElementById('close').addEventListener('click', function() {
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

// Here we display index or transcript file data
function renderTranscript(file, sender) {
	var reader = new FileReader();
	try {
		reader.onload = function(event) {
			var target = event.target.result;

			if (sender === "input-index") document.getElementById('index').value = target;
			else if (sender === "input-transcript") document.getElementById('transcript').value = target;
		}
	}
	catch (e) { errorHandler(e); }

	reader.readAsText(file);
}

// Here we prepare the information for export
function exportFile(sender) {
	var file = null;

	switch(sender) {
		case "xml":
			errorHandler(new Error('I do not yet function'));
			// var content = $('#index').value + $('#transcript').value;
			// var data = new Blob(file, {type: 'text/xml'});
      //
	    // file = window.URL.createObjectURL(data);
      //
	    // return file;
			break;

		case "vtt":
			errorHandler(new Error('I do not yet function'));
			break;

		case "anno":
			errorHandler(new Error('I do not yet function'));
		  break;

		default:
			errorHandler(new Error('I do not yet function'));
			break;
	}
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

	if (allowed.indexOf(ext > -1)) return true;
	else return false;
}

// Here we determine what kind of file was uploaded
function determineFile(file, ex, sender) {
	// List the information from the files
	console.group("File Name: " + file.name);
	console.log("File Size: " + parseInt(file.size / 1024, 10));
	console.log("File Type: " + file.type);
	console.log("Last Modified Date: " + new Date(file.lastModified));
	console.groupEnd();

	// We can't depend upon the file.type (Chrome, IE, and Safari break)
	// Based upon the extension of the file, display its contents in specific locations
	if (sender === "media-file-upload") {
		switch(ext) {
			case "mp4":
			case "webm":
				renderVideo(file);
				break;

			case "ogg":
			case "mp3":
				renderAudio(file);
				break;

			default:
				errorHandler(new Error("Bad File - cannot display data."));
				break;
		}
	}
	else if (sender === "input-index" || sender === "input-transcript") renderText(file, sender);
	else errorHandler(new Error("Bad File - cannot display data."));
}

// Here we empty the text areas
// Not currently in use
function clearBoxes() {
	if (confirm("This will clear the URL, index, and transcript areas.") == true) {
		$("#index").val("");
  	$("#transcript").val("");
		$("#media-url-upload").val("");
		$("#url-upload").val("");
		$("#errorBar").hide();
	}
}

function uploadFile(sender) {
	console.log(sender);
	// Clear error
	$("#errorBar").hide();

	// Grab the files from the user's selection
	var input = document.getElementById(sender);
	for (var i = 0; i < input.files.length; i++) {
		var file = input.files[i];

		// Get file extension
		var name = file.name.split('.');
		var ext = name[name.length - 1].toLowerCase();

		if (checkExt(ext)) determineFile(file, ext, sender);
		else errorHandler(new Error("Bad File - cannot load data from " + file.name));
	}
}

// This function is no longer utilized for non-AV files
function uploadURLFile(sender) {
	// Clear error
	$("#errorBar").hide();

	// Continue onward, grab the URL value
	var input = document.getElementById(sender);
	var url = input.value;

	// Get file extension from url
	var urlArr = url.split('.');
	var ext = urlArr[urlArr.length - 1];

	// We only allow URL uploads of media files, not any text files
	if (ext == "mp3" || ext == "ogg" || ext == "mp4" || ext == "webm") {
		fetch(url)
			.then(res => res.blob())
			.then(blob => {
				if (checkExt(ext)) determineFile(blob, ext);
				else errorHandler(new Error("Bad File - cannot load data from " + url));
			})
			.catch(function(e) { errorHandler(e);	});
	}
	else {
		var error = new Error("This field only accepts audio and video file URLs.");
		errorHandler(error);
	}
}

// Document Ready
(function($){
	// Don't show the video and audio controls
	$("#video").hide();
	$("#audio").hide();
	$("#errorBar").hide();

	// Initiate tabs
  $("#text-tabs").tabs();

	// Here we hide items the user no longer wishes to see
	for (var close of document.querySelectorAll('.close')) {
	  close.addEventListener('click', function(){
			$(this).parent('div').fadeOut();
		}, false);
	}

  // For showing the export options
	$('#export').click(function(){
		$('#exportWrapper').toggleClass('open');
	});
}(jQuery));
