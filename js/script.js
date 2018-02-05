/* Columbia University Library
   Project: Synchronizer Module
   File: script.js
	 Description: Javascript functions providing file upload and display
   Author: Ashley Pressley
   Date: 02/05/2018
	 Version: 0.4.0
*/

// Here is our error handling
function errorHandler(e) {
	$("#errorBar").show();
  $('#errorBar').html('<i id="close" class="fa fa-times-circle-o close"></i><p class="error-bar"><i class="fa fa-exclamation-circle"></i> ' + e + '</p>');
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

		  var fileType = $("#file-type").val();
			if (fileType == 'index') {
				$("#index").show();
				// if (target.indexOf("WebAnno") > -1) document.getElementById('index').value += target;
				document.getElementById('index').innerHTML += target;
			}
			else if (fileType == 'transcript') {
				$("#transcript").show();

				// VTT Parsing
				if (ext === 'vtt') {
					// We'll break up the file line by line
					var text = target.split(/\r\n/);

					// We implement a Web Worker because larger transcript files will freeze the browser
					if (window.Worker) {
						var textWorker = new Worker("js/text.js");
						textWorker.postMessage(text);
						textWorker.onmessage = function(e) { document.getElementById('transcript').innerHTML += e.data;	}
					}
				}
				else if (ext == "txt" || ext == "srt" || "xml") document.getElementById('transcript').innerHTML = target;
				else errorHandler(new Error("Not a valid file extension."));
			}
			else {
				errorHandler(new Error("No example file for parsing index and transcript data together available."));
				$("#index").show();
				$("#transcript").show();
				document.getElementById('transcript').innerHTML += target;
			}
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
	// console.group("File Name: " + file.name);
	// console.log("File Size: " + parseInt(file.size / 1024, 10));
	// console.log("File Type: " + file.type);
	// console.log("Last Modified Date: " + new Date(file.lastModified));
	// console.log("ext: " + ext);
	// console.log("sender: " + sender);
	// console.groupEnd();

	// We can't depend upon the file.type (Chrome, IE, and Safari break)
	// Based upon the extension of the file, display its contents in specific locations
	if (sender === "media-file-upload" || sender === "media-url-upload") {
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
	else if (sender === "input-text") {
		if ($("#file-type").val() == 'none') errorHandler(new Error("Please select the type of file you are uploading from the dropdown list provided."));
		else renderText(file, ext);
	}
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

// Here we embed the empty YouTube video player
var ytplayer;
function onYouTubeIframeAPIReady() {}

// Here we set up segment controls for the YouTube playback
function initializeYTControls(event) {
  var playButton = document.getElementById("control-beginning-yt");
  playButton.addEventListener("click", function() {
    ytplayer.seekTo(0);
  });

  var pauseButton = document.getElementById("control-backward-yt");
  pauseButton.addEventListener("click", function() {
		var now = ytplayer.getCurrentTime();
		ytplayer.seekTo(now - 15);
  });

  var playButton = document.getElementById("control-play-yt");
  playButton.addEventListener("click", function() {
    ytplayer.playVideo();
  });

  var pauseButton = document.getElementById("control-stop-yt");
  pauseButton.addEventListener("click", function() {
    ytplayer.pauseVideo();
  });

  var playButton = document.getElementById("control-forward-yt");
  playButton.addEventListener("click", function() {
		var now = ytplayer.getCurrentTime();
		ytplayer.seekTo(now + 15);
  });

  var pauseButton = document.getElementById("control-update-time-yt");
  pauseButton.addEventListener("click", function() {
    updateTimestampYT();
  });
}

function loadYouTube(id) {
	// Create the iFrame for the YouTube player with the requested video
	$("#tag-segment-btn").show();
	$("#media-upload").hide();

	var iframe = document.createElement("iframe");
	iframe.setAttribute("id", "ytvideo");
	iframe.setAttribute("frameborder", "0");
	iframe.setAttribute("allowfullscreen", "0");
	iframe.setAttribute("src", "https://www.youtube.com/embed/" + id + "?rel=0&enablejsapi=1");
	iframe.setAttribute("width", "100%");
	iframe.setAttribute("height", "400px");

	$('#ytplayer').html(iframe);
	ytplayer = new YT.Player('ytvideo', {
		events: {
			'onReady': initializeYTControls
		}
	});
}

// Here we accept URL-based files
// This function is no longer utilized for non-AV files
function uploadURLFile(sender) {
	// Clear error
	$("#errorBar").fadeOut();

	// Continue onward, grab the URL value
	var input = document.getElementById(sender);
	var url = input.value;
	var id = '';

	// Get file extension from url
	var urlArr = url.toLowerCase().split('.');
	var ext = urlArr[urlArr.length - 1];

	// Find https protocol
	var https = false;
	if (url.toLowerCase().indexOf("https") > -1) https = true;

	// Find YouTube information, if present
	if (url.toLowerCase().indexOf("youtube") > -1) {
		// Full YouTube URL
		var urlArr2 = url.split('=');
		id = urlArr2[urlArr2.length - 1];
	}
	else if (url.toLowerCase().indexOf("youtu.be") > -1) {
		// Short YouTube URL
		var urlArr2 = url.split('/');
		id = urlArr2[urlArr2.length - 1];
	}

	// HTTP will throw errors
	if (!https) {
		var error = new Error("This field only accepts HTTPS URLs.");
		errorHandler(error);
	}
	else if (id !== '') loadYouTube(id);
	else {
		// We only allow URL uploads of media files, not any text files
		if (ext == "mp3" || ext == "ogg" || ext == "mp4" || ext == "webm") {
			fetch(url)
				.then(res => res.blob())
				.then(blob => {
					if (checkExt(ext)) determineFile(blob, ext, sender);
					else errorHandler(new Error("Bad File - cannot load data from " + url));
				})
				.catch(function(e) { errorHandler(e);	});
		}
		else {
			var error = new Error("This field only accepts audio and video file URLs.");
			errorHandler(error);
		}
	}
}

// Here we hide items the user no longer wishes to see
// Includes Segment Tags
function closeButtons() {
	for (var close of document.querySelectorAll('.close')) {
	  close.addEventListener('click', function(){
			$(this).parent('div').fadeOut();
		}, false);
	}

	for (var close of document.querySelectorAll('.tag-delete')) {
	  close.addEventListener('click', function(){
				var panel = $(this).parents('div').get(2);
				panel.remove();
		}, false);
	}
}

// Here we handle the Tag Segment player controls, only for AblePlayer
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

// Here we update the timestamp for the Tag Segment function for AblePlayer
function updateTimestamp() {
	var player = "";

	if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
	else if ($("#video").is(':visible')) player = document.getElementById("video-player");

	var time = player.currentTime;
	var minutes = Math.floor(time / 60);
	time = time - minutes * 60;
	var seconds = time.toFixed(3);

	if (minutes === 0) $("#tag-timestamp").val(seconds);
	else $("#tag-timestamp").val(minutes + ":" + seconds);
};

// Here we update the timestamp for the Tag Segment function for YouTube
function updateTimestampYT() {
	var player = "";

	var time = ytplayer.getCurrentTime();
	var minutes = Math.floor(time / 60);
	time = time - minutes * 60;
	var seconds = time.toFixed(3);

	if (minutes === 0) $("#tag-timestamp").val(seconds);
	else $("#tag-timestamp").val(minutes + ":" + seconds);
};

// Here we save the contents of the Tag Segment modal
function tagSave() {
	var timestamp = $("#tag-timestamp").val();
	var title = $("#tag-segment-title").val();
	var transcript = $("#tag-partial-transcript").val();
	var keywords = $("#tag-keywords").val();
	var subjects = $("#tag-subjects").val();
	var synopsis = $("#tag-segment-synopsis").val();

	// If we're editing a panel, we need to remove the existing panel from the accordion
	var edit = document.getElementById("editVar").innerHTML;
	if (edit !== "-1") {
		var editPanel = document.getElementById(edit);
		editPanel.remove();
	}

	// Get an array of jQuery objects for each accordion panel
	var accordion = $("#indexAccordion");
  var panelIDs = $.map(accordion.children("div").get(), function(panel) {
		var id = $(panel).attr('id');
    return id;
  });

	if (title === "" || title === null) alert("You must enter a title.");
	else if ($.inArray(timestamp, panelIDs) > -1) alert("A segment for this timestamp already exists.");
	else {
		var panel = '<div id="' + timestamp + '" class="segment-panel">';
		panel += '<h3>' + timestamp + "-" + title + '</h3>';
		panel += '<div>';
		panel += '<div class="col-md-2 pull-right"><button class="btn btn-xs btn-secondary tag-edit">Edit</button> ';
		panel += '<button class="btn btn-xs btn-primary tag-delete">Delete</button></div>';
		panel += '<p>Synopsis: <span class="tag-segment-synopsis">' + synopsis + "</span></p>";
		panel += '<p>Keywords: <span class="tag-keywords">' + keywords + "</span></p>";
		panel += '<p>Subjects: <span class="tag-subjects">' + subjects + "</span></p>";
		panel += '<p>Partial Transcript: <span class="tag-partial-transcript">' + transcript + "</span></p>";
		panel += '</div></div>';

		$("#indexAccordion").append(panel);
		sortAccordion();
		$("#indexAccordion").accordion("refresh");
		tagEdit();
		tagCancel();
		closeButtons();
	}
}

// Here we enable the edit buttons for segments
function tagEdit() {
	for (var edit of document.querySelectorAll('.tag-edit')) {
		edit.addEventListener('click', function(){
			// Pop up the modal
			$('#index-tag').modal('show');

			// Get our data for editing
			var id = $(this).parent().parent().parent();
			var timestamp = id.attr('id');
			var title = id.find("h3").text();
			var synopsis = id.find("span.tag-segment-synopsis").text();
			var keywords = id.find("span.tag-keywords").text();
			var subjects = id.find("span.tag-subjects").text();
			var transcript = id.find("span.tag-partial-transcript").text();

			// Set the fields to the appropriate values
			$("#tag-timestamp").val(timestamp);
			$("#tag-segment-title").val(title.split(/-(.+)/)[1]);
			$("#tag-segment-synopsis").val(synopsis);
			$("#tag-keywords").val(keywords);
			$("#tag-subjects").val(subjects);
			$("#tag-partial-transcript").val(transcript);

			// Show appropriate player controls and jump to the appropriate time
			if (($("#audio").is(':visible')) || ($("#video").is(':visible')))	{
				$("#tag-controls-yt").hide();
				$("#tag-controls-ap").show();
			  var player = "";

				if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
				else if ($("#video").is(':visible')) player = document.getElementById("video-player");
				player.currentTime = timestamp;
			}
			else {
				$("#tag-controls-ap").hide();
				$("#tag-controls-yt").show();
				ytplayer.seekTo(timestamp);
			}

			// Tell the global variable we're editing
			document.getElementById("editVar").innerHTML = timestamp;
		}, false);
	}
}

// Here we clear and back out of the Tag Segment modal
function tagCancel() {
	$("#tag-segment-title").val("");
	$("#tag-partial-transcript").val("");
	$("#tag-keywords").val("");
	$("#tag-subjects").val("");
	$("#tag-segment-synopsis").val("");
	$("#index-tag").modal('hide');
	document.getElementById("editVar").innerHTML = "-1";
}

// Here we sort the accordion according to the timestamp to keep the parts in proper time order
function sortAccordion() {
	var accordion = $("#indexAccordion");

  // Get an array of jQuery objects for each accordion panel
  var entries = $.map(accordion.children("div").get(), function(entry) {
    var $entry = $(entry);
    return $entry;
  });

  // Sort the array by the div's id
  entries.sort(function(a, b) {
    return a.attr('id') - b.attr('id');
  });

  // Put them in the right order in the accordion
  $.each(entries, function() {
    this.detach().appendTo(accordion);
  });
}

// Document Ready
(function($){
	// Don't show the A/V controls, errorBar, or Tag button
	$("#video").hide();
	$("#audio").hide();
	$("#errorBar").hide();
	$("#tag-segment-btn").hide();
	$("#tag-controls-ap").hide();
	$("#tag-controls-yt").hide();
	$("#index").hide();
	$("#transcript").hide();

	// Initialize close buttons, tabs, and accordion
	closeButtons();

  $("#text-tabs").tabs({
		active: 0
	});

	$("#indexAccordion").accordion({
    header: "> div > h3",
    autoHeight: false,
    collapsible: true,
    active: false
  });

	// Update the Tag Segment timestamp when the modal opens from Add Segment
	$('#tag-segment-btn').click(function () {
		if (($("#audio").is(':visible')) || ($("#video").is(':visible')))	{
			$("#tag-controls-yt").hide();
			$("#tag-controls-ap").show();
			updateTimestamp();
		}
		else {
			$("#tag-controls-ap").hide();
			$("#tag-controls-yt").show();
			updateTimestampYT();
		}
	});

	// Load YouTube API
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}(jQuery));
