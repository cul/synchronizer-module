/* Columbia University Library
   Project: Synchronizer Module
   File: script.js
	 Description: Javascript functions providing file upload and display
   Author: Ashley Pressley
   Date: 12/29/2017
	 Version: 0.3.1
*/

// Here is our error handling
function errorHandler(e) {
	$("#errorBar").show();
  $('#errorBar').html('<i id="close" class="fa fa-times-circle-o close"></i><p class="error-bar"><i class="fa fa-exclamation-circle"></i> ' + e + '</p><hr />');
	$('html, body').animate({ scrollTop: 0 }, 'fast');

	closeButtons();
}

// Here we play audio files in the video control player
function renderVideo(file) {
	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  		var target = event.target.result;
  		var videoNode = document.querySelector('video');

  		videoNode.src = target;
			$("#media-upload").hide();
			$("#video").show();
			$("#audio").hide();
			$("#tag-segment-btn").show();
			uploadSuccess(file);
  	}
  }
  catch (e) {
		errorHandler(e);
		$("#media-upload").show();
		$("#video").hide();
		$("#audio").hide();
		$("#tag-segment-btn").hide();
	}

	reader.readAsDataURL(file);
}

// Here we play audio files in the audio control player
function renderAudio(file) {
	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  		var target = event.target.result;
  		var audioNode = document.querySelector('audio');

  		audioNode.src = target;
			$("#media-upload").hide();
			$("#audio").show();
			$("#video").hide();
			$("#tag-segment-btn").show();
			uploadSuccess(file);
  	}
  }
  catch (e) {
		errorHandler(e);
		$("#media-upload").show();
		$("#video").hide();
		$("#audio").hide();
		$("#tag-segment-btn").hide();
	}

	reader.readAsDataURL(file);
}

// Here we display index or transcript file data
function renderText(file, ext) {
	var reader = new FileReader();
	try {
		reader.onload = function(event) {
			var target = event.target.result;
			uploadSuccess(file);

			if (target.indexOf("WebVTT") > -1 || ext == "vtt") {
				if (target.indexOf("Kind:") > -1) {
					var breaks = target.split(/(00:00:0)/);
					for (var i = 0; i < breaks.length; i++) {
						// The end bits are the index segments
						if (i >= breaks.length - 2) document.getElementById('index').value += breaks[i];
						// Metadata information is at the beginning
						else $('#metadata').append(breaks[i]);
					}
				}
				else if (target.indexOf("WebAnno") > -1) document.getElementById('index').value += target;
				// Either cannot discern metadata from transcript, or there isn't any
				else $('#transcript').append(target);
			}
			else if (ext == "txt" || ext == "srt") $('#transcript').append(target);
			else if (target.indexOf("</metadata>") > -1) document.getElementById('index').value += target;
			else if (ext == "xml") {
				// Index information from Root to Transcript
				document.getElementById('index').value += target.slice(0, target.indexOf("<transcript>"));
				// Then there is Transcript
				$('transcript').append(target.slice(target.indexOf("<transcript>"), target.indexOf("<transcript_alt>")));
				// Then more index information
				document.getElementById('index').value += target.slice(target.indexOf("<transcript_alt>"));
			}
			else errorHandler(new Error("Cannot determine as interview metadata, index, or transcript."));
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

// Here we post success messages for uploaded files
function uploadSuccess(file) {
	var success = "";
	success += '<div class="col-md-6"><i class="fa fa-times-circle-o close"></i><p class="success-bar"><strong>Upload Successful</strong><br />File Name: ' + file.name + "<br />File Size: " + parseInt(file.size / 1024, 10) + "<br />File Type: " + file.type + "<br />Last Modified Date: " + new Date(file.lastModified) + "</div>";
	$("#successBar").append(success);
	closeButtons();
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
function determineFile(file, ext, sender) {
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
	else if (sender === "input-text") renderText(file, ext);
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

// Here we accept locally uploaded files
function uploadFile(sender) {
	console.log(sender);
	// Clear error
	$("#errorBar").fadeOut();

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

// Here we accept URL-based files
// This function is no longer utilized for non-AV files
function uploadURLFile(sender) {
	// Clear error
	$("#errorBar").fadeOut();

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

// Here we hide items the user no longer wishes to see
function closeButtons() {
	for (var close of document.querySelectorAll('.close')) {
	  close.addEventListener('click', function(){
			$(this).parent('div').fadeOut();
		}, false);
	}
}

// Here we handle the Tag Segment player controls
function playerControls(button) {
  var player = "";
	if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
	else if ($("#video").is(':visible')) player = document.getElementById("video-player");

	switch(button) {
		case "beginning":
			player.currentTime = 0;
			break;

		case "backward":
			player.currentTime -= 15;
			break;

		case "play":
			player.play();
			break;

		case "stop":
			player.pause();
			break;

		case "forward":
			player.currentTime += 15;
			break;

		case "update":
			updateTimestamp();
			break;

		default:
			break;
	}
}

// Here we update the timestamp for the Tag Segment function
function updateTimestamp() {
	var player = "";
	if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
	else if ($("#video").is(':visible')) player = document.getElementById("video-player");

	var time = player.currentTime;
	var minutes = Math.floor(time / 60);
	time = time - minutes * 60;
	var seconds = time.toFixed(3);

	$("#tag-timestamp").val(minutes + ":" + seconds);
};

// Here we save the contents of the Tag Segment modal
// TODO: write this
function tagSave() {
	$("#index-tag").modal('hide');
}

// Document Ready
(function($){
	// Don't show the A/V controls, errorBar, or Tag button
	$("#video").hide();
	$("#audio").hide();
	$("#errorBar").hide();
	$("#tag-segment-btn").hide();

	// Initiate close buttons
	closeButtons();

	// Initiate tabs
  $("#text-tabs").tabs({
		active: 0
	});

	// Update the Tag Segment timestamp when the modal opens
	$('#index-tag').on('shown.bs.modal', function () { updateTimestamp(); });
}(jQuery));
