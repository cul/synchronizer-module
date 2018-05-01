/* Columbia University Library
   Project: Synchronizer Module
   File: script.js
	 Description: Javascript functions providing file upload and display
   Author: Ashley Pressley
   Date: 04/30/2018
	 Version: 0.6.0
*/

/** Global variables **/
// Here we embed the empty YouTube video player
// This must be presented before any function that can utilize it
var ytplayer;
function onYouTubeIframeAPIReady() {}

// Looping is used to notify various functions if Transcript looping is currently active
var looping = -1;

/** Import Functions **/

// Here we accept locally uploaded files
function uploadFile(sender) {
	// Grab the files from the user's selection
	var input = document.getElementById(sender);
	for (var i = 0; i < input.files.length; i++) {
		var file = input.files[i];

		// Get file extension
		var name = file.name.split('.');
		var ext = name[name.length - 1].toLowerCase();

		if (checkExt(ext) > -1) determineFile(file, ext, sender);
		else errorHandler(new Error("Bad File - cannot load data from " + file.name));
	}
}

// Here we accept URL-based files
// This function is no longer utilized for non-AV files
function uploadURLFile(sender) {
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

	if (ext == "m3u8") renderWowza(url);
	// HTTP is only allowed for Wowza URLs
	else if (!https) {
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
					if (checkExt(ext) > -1) determineFile(blob, ext, sender);
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

// Here we ensure the extension is usable by the system
function checkExt(ext) {
	var allowed = ["txt",
								 "vtt",
								 "xml",
								 "srt",
								 "mp4",
								 "webm",
								 "m3u8",
								 "ogg",
								 "mp3"];

	 return allowed.indexOf(ext);
}

// Here we post success messages for uploaded files
function uploadSuccess(file) {
	var success = "";
	success += '<div class="col-md-6"><i class="fa fa-times-circle-o close"></i><p class="success-bar"><strong>Upload Successful</strong><br />File Name: ' + file.name + "<br />File Size: " + parseInt(file.size / 1024, 10) + "<br />File Type: " + file.type + "<br />Last Modified Date: " + new Date(file.lastModified) + "</div>";
	$("#messagesBar").append(success);
	closeButtons();
}

/** Rendering Functions **/

// Here we load Wowza server playlists
function renderWowza(url) {
  var player = document.querySelector('video');
  var hls = new Hls();
  hls.loadSource(url);
  hls.attachMedia(player);
  hls.on(Hls.Events.MANIFEST_PARSED,function() {
    video.play();
  });
	$("#media-upload").hide();
	$("#video").show();
	$("#audio").hide();
	$("#tag-segment-btn").show();
	$("#finish-area").show();
	if (document.getElementById('transcript').innerHTML != '') { $("#sync-controls").show(); }
	var success = "";
	success += '<div class="col-md-6"><i class="fa fa-times-circle-o close"></i><p class="success-bar"><strong>Upload Successful</strong><br />The Wowza URL ' + url + " was successfully ingested.</div>";
	$("#messagesBar").append(success);
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
			$("#finish-area").show();
			if (document.getElementById('transcript').innerHTML != '') { $("#sync-controls").show(); }
			uploadSuccess(file);
  	}
  }
  catch (e) {
		errorHandler(e);
		$("#media-upload").show();
		$("#video").hide();
		$("#audio").hide();
		$("#tag-segment-btn").hide();
		$("#sync-controls").hide();
	}

	reader.readAsDataURL(file);
	var player = document.getElementById('video-player');
	player.addEventListener('durationchange', function() {
		var time = player.duration;
		var minutes = Math.floor(time / 60);
		var hours = Math.floor(minutes / 60);
		time = time - minutes * 60;
		var seconds = time;
		if (seconds % 60 == 0) seconds = 0.000;
		if (minutes === 60) minutes = 0;
		document.getElementById('endTime').innerHTML = Number(hours).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(minutes).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(seconds).toLocaleString(undefined, {minimumIntegerDigits: 2});
	});
}

function loadYouTube(id) {
	if (document.getElementById('transcript').innerHTML != '') { $("#sync-controls").show(); }
	$("#finish-area").show();
	$("#tag-segment-btn").show();
	$("#media-upload").hide();

	// Create the iFrame for the YouTube player with the requested video
	var iframe = document.createElement("iframe");
	iframe.setAttribute("id", "ytvideo");
	iframe.setAttribute("frameborder", "0");
	iframe.setAttribute("allowfullscreen", "0");
	iframe.setAttribute("src", "https://www.youtube.com/embed/" + id + "?rel=0&enablejsapi=1&autoplay=1");
	iframe.setAttribute("width", "100%");
	iframe.setAttribute("height", "400px");

	$('#ytplayer').html(iframe);
	ytplayer = new YT.Player('ytvideo', {
		events: {
			'onReady': initializeYTControls
		}
	});

	transcriptYTTimestamp();

	// We need to make a second call in order to get video information.
	// CUL's Google API Key will need to go here
	// var apiKey = 'culAPIkey';
	// var url = 'https://www.googleapis.com/youtube/v3/videos?id=' + id + '&key=' + apiKey + '&part=snippet';
	//
	// $.ajax({
  //   url: url,
  //   dataType: "jsonp",
  //   success: function(data){
	// 		var success = "";
	// 		success += '<div class="col-md-6"><i class="fa fa-times-circle-o close"></i><p class="success-bar"><strong>Upload Successful</strong><br />Title: ' + data.items[0].snippet.title + "<br />Publish Date: " + new Date(data.items[0].snippet.publishedAt) + "</div>";
	// 		$("#successBar").append(success);
	// 		closeButtons();
  //   },
  //   error: function(jqXHR, textStatus, errorThrown) {
	// 		console.log(textStatus, + ' | ' + errorThrown);
  //   }
  // });
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
			$("#finish-area").show();
			if (document.getElementById('transcript').innerHTML != '') { $("#sync-controls").show(); }
			uploadSuccess(file);
  	}
  }
  catch (e) {
		errorHandler(e);
		$("#media-upload").show();
		$("#video").hide();
		$("#audio").hide();
		$("#tag-segment-btn").hide();
		$("#sync-controls").hide();
	}

	reader.readAsDataURL(file);
	var player = document.getElementById('audio-player');
	player.addEventListener('durationchange', function() {
		var time = player.duration;
		var minutes = Math.floor(time / 60);
		var hours = Math.floor(minutes / 60);
		time = time - minutes * 60;
		var seconds = time;
		if (seconds >= 60 && seconds % 60 == 0) seconds = 0.000;
		if (minutes === 60) minutes = 0;
		document.getElementById('endTime').innerHTML = Number(hours).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(minutes).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(seconds).toLocaleString(undefined, {minimumIntegerDigits: 2});
	});
}

// Here we display index or transcript file data
function renderText(file, ext) {
	var reader = new FileReader();
	try {
		reader.onload = function(event) {
			var target = event.target.result;

		  var fileType = $("#file-type").val();
			if (fileType == 'index') {
				// VTT Parsing
				if (ext === 'vtt') {
					$("#finish-area").show();

					if (target.indexOf("WEBVTT") !== 0) errorHandler(new Error("Not a valid VTT index file."));
					else {
						// Having interview-level metadata is required
						if (/(Title:)+/.test(target) && /(Date:)+/.test(target) && /(Identifier:)+/.test(target)) {
							uploadSuccess(file);

							// We'll break up the file line by line
							var text = target.split(/\r?\n|\r/);

							var k = 0;
							for (k; k < text.length; k++) {
								if (/(([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]\s-->\s[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]))+/.test(text[k])) { break; }

								// First we pull out the interview-level metadata
								if (/(Title:)+/.test(text[k])) {
									// Save the interview title
									$('#tag-interview-title').val(text[k].slice(7));

									// Then add the rest of the information to the metadata section
									while (text[k] !== '' && k < text.length) {
										document.getElementById('interview-metadata').innerHTML += text[k] + '<br />';
										k++;
									}
								}
							}

							// And we can remove the lines we've already seen to make segment parsing easier
							for (var j = k - 1; j >= 0; j--) {
								text.shift();
							}

							// Now we build segment panels
							var accordion = $("#indexAccordion");
							var panel = '';
							var timestamp = '';
							var title = '';
							var transcript = '';
							var synopsis = '';
							var keywords = '';
							var subjects = '';

							for (var i = 0; i < text.length; i++) {
								// We are only concerned with timestamped segments at this point of the parsing
								if (/(([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]\s-->\s[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]))+/.test(text[i])) {
									timestamp = text[i].substring(0, 12);
									// document.getElementById('endTime').innerHTML = text[i].substring(17);

									while (text[i] !== "}" && i < text.length) {
										if (/("title":)+/.test(text[i])) {
											title = text[i].substring(text[i].indexOf('"title":') + 9).replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											while (!/("partial_transcript":)+/.test(text[i + 1]) &&  i < text.length) {
												i++;
												title += text[i].replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											}
										}

										if (/("partial_transcript":)+/.test(text[i])) {
											transcript = text[i].substring(text[i].indexOf('"partial_transcript":') + 22).replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											while (!/("description":)+/.test(text[i + 1]) &&  i < text.length) {
												i++;
												transcript += text[i].replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											}
										}

										if (/("description":)+/.test(text[i])) {
											synopsis = text[i].substring(text[i].indexOf('"description":') + 15).replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											while (!/("keywords":)+/.test(text[i + 1]) &&  i < text.length) {
												i++;
												synopsis += text[i].replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											}
										}

										if (/("keywords":)+/.test(text[i])) {
											keywords = text[i].substring(text[i].indexOf('"keywords":') + 12).replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											while (!/("subjects":)+/.test(text[i + 1]) &&  i < text.length) {
												i++;
												keywords += text[i].replace(/(\\")/g,'"').replace(/(",)$/,'').replace(/^"/,'');
											}
										}

										if (/("subjects":)+/.test(text[i])) {
											subjects = text[i].substring(text[i].indexOf('"subjects":') + 12).replace(/(\\")/g,'"').replace(/(")$/,'').replace(/^"/,'');
											while (text[i + 1] !== "}" &&  i < text.length) {
												i++;
												subjects += text[i].replace(/(\\")/g,'"').replace(/(")$/,'').replace(/^"/,'');
											}
										}

										i++;
									}

									// Now that we've gathered all the data for the variables, we build a panel
									panel = '<div id="' + timestamp + '" class="segment-panel">';
									panel += '<h3>' + timestamp + "-" + title + '</h3>';
									panel += '<div>';
									panel += '<div class="col-md-2 pull-right"><button class="btn btn-xs btn-secondary tag-edit">Edit</button> ';
									panel += '<button class="btn btn-xs btn-primary tag-delete">Delete</button></div>';
									panel += '<p>Synopsis: <span class="tag-segment-synopsis">' + synopsis + "</span></p>";
									panel += '<p>Keywords: <span class="tag-keywords">' + keywords + "</span></p>";
									panel += '<p>Subjects: <span class="tag-subjects">' + subjects + "</span></p>";
									panel += '<p>Partial Transcript: <span class="tag-partial-transcript">' + transcript + "</span></p>";
									panel += '</div></div>';
								}
								accordion.append(panel);
								panel = '';
							}

							sortAccordion();
							accordion.accordion("refresh");
							tagEdit();
							tagCancel();
							closeButtons();
						}
						else errorHandler(new Error("Not a valid index file - missing interview-level metadata."));
					}
				}
				else errorHandler(new Error("Not a valid file extension."));
			}
			else if (fileType == 'transcript') {
				// If there's no A/V present, there is no transcript Syncing
				if (!($("#audio").is(':visible')) && !($("#video").is(':visible')) && document.getElementById("ytplayer").innerHTML === '') errorHandler(new Error("You must first upload an A/V file in order to sync a transcript."));
				// VTT Parsing
				else {
					if (ext === 'vtt') {
						$("#finish-area").show();

						if (!(/(([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]\s-->\s[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]))+/.test(target)) || target.indexOf("WEBVTT") !== 0) errorHandler(new Error("Not a valid VTT transcript file."));
						else {
							if ($("#audio").is(':visible') || $("#video").is(':visible') || document.getElementById("ytplayer").innerHTML != '') $("#sync-controls").show();
							uploadSuccess(file);

							// We'll break up the file line by line
							var text = target.split(/\r?\n|\r/);

							// We implement a Web Worker because larger transcript files will freeze the browser
							if (window.Worker) {
								var textWorker = new Worker("js/transcript.js");
								textWorker.postMessage(text);
								textWorker.onmessage = function(e) {
									document.getElementById('transcript').innerHTML += e.data;

								  // Enable click functions, addSyncMarker calls all three functions
									addSyncMarker();
								}
							}
						}
					}
					else errorHandler(new Error("Not a valid file extension."));
				}
			}
			else { errorHandler(new Error("No example file for parsing index and transcript data together available.")); }
		}
	}
	catch (e) { errorHandler(e); }

	reader.readAsText(file);
}

/** Player Functions **/

// Here we set up segment controls for the YouTube playback
function initializeYTControls(event) {
	// Capture the end timestamp of the YouTube video
	var time = ytplayer.getDuration();
	var minutes = Math.floor(time / 60);
	var hours = Math.floor(minutes / 60);
	time = time - minutes * 60;
	var seconds = time;
	if (seconds >= 60 && seconds % 60 == 0) seconds = 0;
	if (minutes === 60) minutes = 0;
	document.getElementById('endTime').innerHTML = Number(hours).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(minutes).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(seconds).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ".000";

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

// Here we handle the player controls, only for AblePlayer
function playerControls(button) {
  var player = "";
	var offset = $('#sync-roll').val();

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

		case "seek":
			var minute = parseInt(document.getElementById("sync-minute").innerHTML);
			player.currentTime = minute * 60 - offset;
			break;

		default:
			break;
	}
}

/** Transcript Sync Functions **/

// Here we add a Sync Marker
function addSyncMarker() {
	for (var word of document.getElementsByClassName('transcript-word')) {
		word.addEventListener('click', function(){
			var minute = parseInt(document.getElementById("sync-minute").innerHTML);
			if (minute == 0) minute++;
			var marker = "{" + minute + ":00}";
			var regEx = new RegExp(marker);

			// If a marker already exists for this minute, remove it and remove the word highlighting
			for (var sync of document.getElementsByClassName('transcript-timestamp')) {
				var mark = sync.innerText;
				if (regEx.test(mark)) {
					$(sync).next(".transcript-clicked").removeClass('transcript-clicked');
					sync.remove();
				}
			}

			$(this).addClass('transcript-clicked');
			$('<span class="transcript-timestamp">{' + minute + ':00}&nbsp;</span>').insertBefore($(this));

			// Increase the Sync Current Mark
			document.getElementById("sync-minute").innerHTML = minute + 1;

			updateCurrentMark();
			removeSyncMarker();

			// If we are looping, we automatically jump forward
			if (looping !== -1) {
				document.getElementById("sync-minute").innerHTML = minute;
				syncControl("forward");
			}
		}, false);
	}
}

// Here we update Transcript Sync Current Mark
function updateCurrentMark() {
	for (var sync of document.getElementsByClassName('transcript-timestamp')) {
		sync.addEventListener('click', function(){
			var mark = $(this)[0].innerHTML;
			mark = mark.replace("{", '');
			var num = mark.split(":");
			document.getElementById("sync-minute").innerHTML = num[0];
		}, false);
	}
}

// Here we remove a Transcript Sync Marker
function removeSyncMarker() {
	for (var sync of document.getElementsByClassName('transcript-timestamp')) {
		sync.addEventListener('dblclick', function(){
			$(this).next(".transcript-clicked").removeClass('transcript-clicked');
			$(this).remove();
		}, false);
	}
}

// Here we capture Transcript sync control clicks
function syncControl(type) {
	var youTube = document.getElementById("ytplayer").innerHTML;
	var minute = parseInt(document.getElementById("sync-minute").innerHTML);
	var offset = $('#sync-roll').val();

	switch(type) {
		// Hitting back/forward are offset by the roll interval
		case "back":
			minute -= 1;
			if (minute <= 0) document.getElementById("sync-minute").innerHTML = 0;
			else document.getElementById("sync-minute").innerHTML = minute;

			if (youTube !== "") ytplayer.seekTo(minute * 60 - offset);
			else playerControls("seek");
			break;

		case "forward":
			minute += 1;
			document.getElementById("sync-minute").innerHTML = minute;

			if (youTube !== "") ytplayer.seekTo(minute * 60 - offset);
			else playerControls("seek");
			break;

		case "loop":
			transcriptLoop();
			break;

		default:
			break;
	}
}

// Here we handling looping controls for Transcript syncing
function transcriptLoop() {
	var youTube = document.getElementById("ytplayer").innerHTML;
	var minute = parseInt(document.getElementById("sync-minute").innerHTML);
	var offset = $('#sync-roll').val();

	// We don't loop at the beginning of the A/V
	if (minute === 0) {  }
	// YouTube uses its own player
	else if (youTube) {
		// If looping is active we stop it
		if (looping !== -1) {
			ytplayer.pauseVideo();
			$('#sync-play').addClass('btn-outline-info');
			$('#sync-play').removeClass('btn-info');
			looping = -1;
		}
		// If looping is not active we start it
		else {
			ytplayer.seekTo(minute * 60 - offset);
			ytplayer.playVideo();
			$('#sync-play').removeClass('btn-outline-info');
			$('#sync-play').addClass('btn-info');
			looping = minute;
		}
	}
	// This is handling for the AblePlayer
	else {
		var player = "";
		if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
		else if ($("#video").is(':visible')) player = document.getElementById("video-player");

		// If looping is active
		if (looping !== -1) {
			player.pause();
			$('#sync-play').addClass('btn-outline-info');
			$('#sync-play').removeClass('btn-info');
			looping = -1;
		}
		// If looping is not active
		else {
			player.currentTime = minute * 60 - offset;
			player.play();
			$('#sync-play').removeClass('btn-outline-info');
			$('#sync-play').addClass('btn-info');
			looping = minute;
		}
	}
}

// Here we continually update the timestamp on the sync controls
// Only for AblePlayer
function transcriptTimestamp() {
	var player = "";
	var chime1 = document.getElementById("audio-chime1");
	var chime2 = document.getElementById("audio-chime2");

	if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
	else if ($("#video").is(':visible')) player = document.getElementById("video-player");

	var time = player.currentTime;
	var minutes = Math.floor(time / 60);
	var hours = Math.floor(minutes / 60);
	var offset = $('#sync-roll').val();

	// We only play chimes if we're on the transcript tab, and looping is active
	if (Math.floor(time) % 60 == (60 - offset) && $("#transcript").is(':visible') && looping !== -1) { chime1.play(); }
	if (Math.floor(time) % 60 == 0 && Math.floor(time) != 0 && $("#transcript").is(':visible') && looping !== -1) { chime2.play(); }

	// If looping is active, we will jump back to a specific time should the the time be at the minute + offset
	if ((Math.floor(time) % 60 == offset || time === player.duration ) && $("#transcript").is(':visible') && looping !== -1) {
		document.getElementById("sync-minute").innerHTML = parseInt(document.getElementById("sync-minute").innerHTML) + 1;
		syncControl("back");
		player.play();
	}

	time = time - minutes * 60;
	var seconds = time.toFixed(0);
	if (seconds >= 60 && seconds % 60 == 0) seconds = 0;
	if (minutes === 60) minutes = 0;
	document.getElementById("sync-time").innerHTML = Number(hours).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(minutes).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(seconds).toLocaleString(undefined, {minimumIntegerDigits: 2});
	// If the user is working on an index segment, we need to watch the playhead
	$("#tag-playhead").val(Number(hours).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(minutes).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(seconds).toLocaleString(undefined, {minimumIntegerDigits: 2}));
}

// Here we will monitor the YouTube video time and keep the transcript timestamp updated
window.setInterval(transcriptYTTimestamp, 500);
function transcriptYTTimestamp() {
	if (typeof ytplayer !== 'undefined') {
		// last_time_update = '';
		time_update = (ytplayer.getCurrentTime() * 1000);
		playing = ytplayer.getPlayerState();
			if (playing == 1) {
				if (last_time_update == time_update) current_time_msec += 50;
				if (last_time_update != time_update) current_time_msec = time_update;
			}

		var chime1 = document.getElementById("audio-chime1");
		var chime2 = document.getElementById("audio-chime2");
		var time = ytplayer.getCurrentTime();
		var minutes = Math.floor(time / 60);
		var hours = Math.floor(minutes / 60);
		var offset = $('#sync-roll').val();

		// We only play chimes if on the transcript tab, and looping is active
		if (Math.floor(time) % 60 == (60 - offset) && $("#transcript").is(':visible') && looping !== -1 && playing == 1) { chime1.play(); }
		if (Math.floor(time) % 60 == 0 && Math.floor(time) != 0 && $("#transcript").is(':visible') && looping !== -1 && playing == 1) { chime2.play(); }

		// If looping is active, we will jump back to a specific time should the the time be at the minute + offset
		if ((Math.floor(time) % 60 == offset || time == ytplayer.getDuration()) && $("#transcript").is(':visible') && looping !== -1) {
			document.getElementById("sync-minute").innerHTML = parseInt(document.getElementById("sync-minute").innerHTML) + 1;
			syncControl("back");
			ytplayer.playVideo();
		}

		time = time - minutes * 60;
		var seconds = time.toFixed(0);
		if (seconds >= 60 && seconds % 60 == 0) seconds = 0;
		if (minutes === 60) minutes = 0;
		document.getElementById("sync-time").innerHTML = Number(hours).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(minutes).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(seconds).toLocaleString(undefined, {minimumIntegerDigits: 2});
		// If the user is working on an index segment, we need to watch the playhead
		$("#tag-playhead").val(Number(hours).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(minutes).toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + Number(seconds).toLocaleString(undefined, {minimumIntegerDigits: 2}));
		last_time_update = time_update;
	}
}

/** Index Segment Functions **/

// Here we update the timestamp for the Tag Segment function for AblePlayer
function updateTimestamp() {
	var player = "";

	if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
	else if ($("#video").is(':visible')) player = document.getElementById("video-player");

	var time = player.currentTime;
	var minutes = Math.floor(time / 60);
	var hours = Math.floor(minutes / 60);
	time = time - minutes * 60;
	var seconds = time.toFixed(3);

	if (hours < 10) hours = '0' + hours;
	if (minutes < 10) minutes = '0' + minutes;
	if (seconds < 10) seconds = '0' + seconds;

	$("#tag-timestamp").val(hours + ":" + minutes + ":" + seconds);
};

// Here we update the timestamp for the Tag Segment function for YouTube
function updateTimestampYT() {
	var player = "";

	var time = ytplayer.getCurrentTime();
	var minutes = Math.floor(time / 60);
	var hours = Math.floor(minutes / 60);
	time = time - minutes * 60;
	var seconds = time.toFixed(3);

	if (hours < 10) hours = '0' + hours;
	if (minutes < 10) minutes = '0' + minutes;
	if (seconds < 10) seconds = '0' + seconds;

	$("#tag-timestamp").val(hours + ":" + minutes + ":" + seconds);
};

// Here we save the contents of the Tag Segment modal
function tagSave() {
	var edit = document.getElementById("editVar").innerHTML;
	var timestamp = $("#tag-timestamp").val();
	var title = $("#tag-segment-title").val();
	var transcript = $("#tag-partial-transcript").val();
	var keywords = $("#tag-keywords").val();
	var subjects = $("#tag-subjects").val();
	var synopsis = $("#tag-segment-synopsis").val();

	// Get an array of jQuery objects for each accordion panel
	var accordion = $("#indexAccordion");
  var panelIDs = $.map(accordion.children("div").get(), function(panel) {
		var id = $(panel).attr('id');
    if (id !== edit) return id;
  });

	if (title === "" || title === null) alert("You must enter a title.");
	else if ($.inArray(timestamp, panelIDs) > -1) alert("A segment for this timestamp already exists.");
	else {
		// If we're editing a panel, we need to remove the existing panel from the accordion
		if (edit !== "-1") {
			var editPanel = document.getElementById(edit);
			editPanel.remove();
		}

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

			// Tell the global variable we're editing
			document.getElementById("editVar").innerHTML = timestamp;

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
			else if (document.getElementById("ytplayer").innerHTML != ''){
				$("#tag-controls-ap").hide();
				$("#tag-controls-yt").show();
				ytplayer.seekTo(timestamp);
			}
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
		var timeA = new Date('1970-01-01T' + a.attr('id') + 'Z');
		var timeB = new Date('1970-01-01T' + b.attr('id') + 'Z');
    return timeA - timeB;
  });

  // Put them in the right order in the accordion
  $.each(entries, function() {
    this.detach().appendTo(accordion);
  });
}

/** Export Functions **/

// Here we prepare transcript data for VTT files
function transcriptVTT() {
	var minute = '';
	var metadata = $('#interview-metadata')[0].innerHTML.replace(/<br>/g, '\n');
	var content = document.getElementById('transcript').innerHTML;

	// Need to find the first minute marker, because the first chunk of transcript is 0 to that minute
	minute = content.substring(content.indexOf("{") + 1, content.indexOf("}"));
	minute = minute.substring(0, minute.indexOf(':'));
	minute = (parseInt(minute) < 10) ? '0' + minute : minute;

	if (minute == '') {
		new errorHandler("You must add at least one sync marker in order to prepare a transcript.");
		return false;
	}
	else {
		// Replace our temporary content with the real data for the export
		content = (metadata != '') ? 'WEBVTT\n\nNOTE\n' + metadata + '\n\n' : 'WEBVTT\n\n';
		content += '\n00:00:00.000 --> 00:' + minute + ':00.000\n';
		content += document.getElementById('transcript').innerHTML.replace(/<\/span>/g, '').replace(/<span class="transcript-word">/g, '').replace(/&nbsp;/g, ' ').replace(/<span class="transcript-word transcript-clicked">/g, '');

		// This will help us find the rest of the minutes, as they are marked appropriately
		while (/([0-9]:00})+/.test(content)) {
			var newMin = '';
			var currMin = '';

			minute = content.substring(content.indexOf("{") + 1, content.indexOf("}"));
			minute = minute.substring(0, minute.indexOf(':'));
			currMin = (parseInt(minute) < 10) ? '0' + minute : minute;
			newMin = (parseInt(currMin) + 1);
			newMin = (parseInt(newMin) < 10) ? '0' + newMin : newMin;

			if (parseInt(currMin) < 60) {
				content = content.replace('<span class="transcript-timestamp">{' + minute + ':00} ', '\n\n00:' + currMin + ':00.000 --> 00:' + newMin + ':00.000\n');
			}
			else {
				var hour = '';
				hour = (parseInt(newMin) % 60);
				currMin -= (parseInt(hour) * 60);
				newMin = (parseInt(currMin) + 1);

				hour = (parseInt(hour) < 10) ? '0' + hour : hour;
				content = content.replace('<span class="transcript-timestamp">{' + minute + ':00} <span class="transcript-word transcript-clicked">', '\n\n' + hour + ':' + currMin + ':00.000 --> ' + hour + ':' + newMin + ':00.000\n');
			}
		}

		return content;
	}
}

// Here we prepare index data for VTT files
function indexVTT() {
	var metadata = $('#interview-metadata')[0].innerHTML.replace(/<br>/g, '\n');
	var content = (metadata != '') ? 'WEBVTT\n\nNOTE\n' + metadata + '\n\n' : 'WEBVTT\n\n';

	// We'll break up the text by segments
	var text = $('#indexAccordion')[0].innerHTML.split(/<\/div><\/div>/);

	for (var i = 0; i < text.length - 1; i++) {
		var currTime = '';
		var currIndex0 = 0;
		var currIndex1 = 0;
		var nextTime = '';
		var title = '';
		var partialTranscript = '';
		var description = '';
		var keywords = '';
		var subjects = '';

		// We will need to know what the current and upcoming time segments are
		currIndex0 = text[i].indexOf('<div id="') + 9;
		currIndex1 = text[i].indexOf('" class="segment-panel">');
		currTime = text[i].substring(currIndex0, currIndex1);

		// If there isn't a nextTime, then it's the end
		nextTime = i < text.length - 2 ? text[i + 1].substring(text[i + 1].indexOf('<div id="') + 9, text[i + 1].indexOf('" class="segment-panel">')) : document.getElementById('endTime').innerHTML;

		// Substring city to get all of the data
		title = text[i].substring(text[i].indexOf('</span>' + currTime + '-') + 20, text[i].indexOf("</h3>"));
		description = text[i].substring(text[i].indexOf("tag-segment-synopsis") + 22, text[i].indexOf("</span>", text[i].indexOf("tag-segment-synopsis")));
		keywords = text[i].substring(text[i].indexOf("tag-keywords") + 14, text[i].indexOf("</span>", text[i].indexOf("tag-keywords")));
		subjects = text[i].substring(text[i].indexOf("tag-subjects") + 14, text[i].indexOf("</span>", text[i].indexOf("tag-subjects")));
		partialTranscript = text[i].substring(text[i].indexOf("tag-partial-transcript") + 24, text[i].indexOf("</span>", text[i].indexOf("tag-partial-transcript")));

		content += currTime + ' --> ' + nextTime + '\n{\n';
		content += '  "title": "' + title.replace(/"/g, '\\"') + '",\n';
		content += '  "partial_transcript": "' + partialTranscript.replace(/"/g, '\\"') + '",\n';
		content += '  "description": "' + description.replace(/"/g, '\\"') + '",\n';
		content += '  "keywords": "' + keywords.replace(/"/g, '\\"') + '",\n';
		content += '  "subjects": "' + subjects.replace(/"/g, '\\"') + '"\n';
		content += '}\n\n\n';
	}

	return content;
}

// Here we use VTT-esque data to preview the end result
function previewWork() {
	var type = $("ul#list-tabs li.ui-tabs-active > a")[0].innerHTML;
	var youTube = document.getElementById("ytplayer").innerHTML;

	// Make sure looping isn't running, we'll stop the A/V media and return the playhead to the beginning
	looping = -1;
	if (youTube !== '') {
		ytplayer.seekTo(0);
		ytplayer.pauseVideo();
	}
	else {
		playerControls("beginning");
		playerControls("stop");
	}

	if ($('#media-upload').visible) errorHandler(new Error("You must first upload media in order to preview."));
	else if (type.toLowerCase() == "transcript" && document.getElementById('transcript').innerHTML != '') {
		// The current open work needs to be hidden to prevent editing while previewing
		$("#transcript").hide();
		$("#sync-controls").hide();
		$("#transcript-preview").show();
		$("#export").addClass('hidden');
		$("#preview").addClass('hidden');
		$("#preview-close").removeClass('hidden');

		var content = transcriptVTT();
		$("#transcript-preview").innerHTML = "<p>";

		// We need to parse the VTT-ified transcript data so that it is "previewable"
		var text = content.split(/\r?\n|\r/);
		var first = false;

	  for (var i = 0; i < text.length; i++) {
			if (/(([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]\s-->\s[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]))+/.test(text[i])) {
	      if (!first) first = true;
	      var timestamp = text[i][3] !== "0" ? (text[i][3] + text[i][4]) : text[i][4];
	      if (timestamp !== "0") { document.getElementById('transcript-preview').innerHTML += '<span class="preview-minute">[' + timestamp + ':00]&nbsp;</span>'; }
	      continue;
			}
	    else if (first) {
				document.getElementById('transcript-preview').innerHTML += text[i];
			}
		}

		document.getElementById('transcript-preview').innerHTML += "</p>";

		addPreviewMinutes();
	}
	else if (type.toLowerCase() == "index" && $('#indexAccordion') != '') {
		// The current open work needs to be hidden to prevent editing while previewing
		$("#tag-segment-btn").hide();
		$("#previewAccordion").show();
		$("#export").addClass('hidden');
		$("#preview").addClass('hidden');
		$("#preview-close").removeClass('hidden');

		$("#indexAccordion").clone().prop({ id: "previewAccordion", name: "indexClone"}).appendTo($('#input-index'));
		$("#indexAccordion").hide();

		// Initialize the new accordion
		$("#previewAccordion").accordion({
	    header: "> div > h3",
	    autoHeight: false,
	    collapsible: true,
			clearStyle: true,
	    active: false
	  });

		$(".tag-edit").each(function() { if ($(this).parents('#previewAccordion').length) { $(this).remove(); } });
		$(".tag-delete").each(function() {
			if ($(this).parents('#previewAccordion').length) {
				$('<button class="btn btn-xs btn-primary preview-segment">Play Segment</button>').insertAfter($(this));
				$(this).remove();
			}
		});

		$("#previewAccordion").accordion("refresh");
		addPreviewSegments();
	}
	else {
		errorHandler(new Error("The selected transcript or index document is empty."));
	}
}

// Here we activate the minute sync markers created for previewing transcript
function addPreviewMinutes() {
	for (var minute of document.getElementsByClassName('preview-minute')) {
		minute.addEventListener('click', function(){
			var timestamp = $(this)[0].innerText.split('[');
			var minute = timestamp[1].split(':');
			var youTube = document.getElementById("ytplayer").innerHTML;

			if (youTube !== '') ytplayer.seekTo(minute[0] * 60);
			else {
				var player = '';
				if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
				else if ($("#video").is(':visible')) player = document.getElementById("video-player");

				player.currentTime = parseInt(minute[0]) * 60;
			}
		});
	}
}

// Here we activate the index segment buttons to for playing index segments during preview
function addPreviewSegments() {
	for (var segment of document.getElementsByClassName('preview-segment')) {
		segment.addEventListener('click', function(){
			var timestamp = $(this).parent().parent().parent().attr("id");
			var hours = timestamp[0] + timestamp[1];
			var minutes = timestamp[3] + timestamp[4];
			var seconds = timestamp[6] + timestamp[7];
			var playhead = (parseInt(hours) * 60 * 60) + (parseInt(minutes) * 60) + parseInt(seconds);

			var youTube = document.getElementById("ytplayer").innerHTML;

			if (youTube !== '') {
				ytplayer.seekTo(playhead);
				ytplayer.playVideo();
			}
			else {
				var player = '';
				if ($("#audio").is(':visible')) player = document.getElementById("audio-player");
				else if ($("#video").is(':visible')) player = document.getElementById("video-player");

				player.currentTime = playhead;
				player.play();
			}
		});
	}
}

// Here we return to editing work once we are finished with previewing the end result
function previewClose() {
	// We'll stop the A/V media and return the playhead to the beginning
	var youTube = document.getElementById("ytplayer").innerHTML;
	if (youTube !== '') {
		ytplayer.seekTo(0);
		ytplayer.pauseVideo();
	}
	else {
		playerControls("beginning");
		playerControls("stop");
	}

	$("#transcript").show();
	$("#sync-controls").show();
	document.getElementById("transcript-preview").innerHTML = '';
	$("#transcript-preview").hide();
	$("#tag-segment-btn").show();
	$("#indexAccordion").show();
	if (document.getElementById("previewAccordion") != null) document.getElementById("previewAccordion").remove();
	$("#export").removeClass('hidden');
	$("#preview").removeClass('hidden');
	$("#preview-close").addClass('hidden');
}

// Here we use prepared data for export to a downloadable file
function exportFile(sender) {
	var type = $("ul#list-tabs li.ui-tabs-active > a")[0].innerHTML;

	if (type.toLowerCase() == "transcript" && document.getElementById('transcript').innerHTML != '') {
		switch (sender) {
			case "vtt":
				var content = transcriptVTT();
				if (!content) break;

				// This will create a temporary link DOM element that we will click for the user to download the generated file
				var element = document.createElement('a');
			  element.setAttribute('href', 'data:text/vtt;charset=utf-8,' + encodeURIComponent(content));
			  element.setAttribute('download', 'transcript.vtt');
			  element.style.display = 'none';
			  document.body.appendChild(element);
			  element.click();
			  document.body.removeChild(element);

				break;

			default:
				errorHandler(new Error("This function is still under development."));
				break;
		}
	}
	else if (type.toLowerCase() == "index" && $('#indexAccordion') != '') {
		switch (sender) {
			case "vtt":
				var content = indexVTT();

				// This will create a temporary link DOM element that we will click for the user to download the generated file
				var element = document.createElement('a');
			  element.setAttribute('href', 'data:text/vtt;charset=utf-8,' + encodeURIComponent(content));
			  element.setAttribute('download', 'index.vtt');
			  element.style.display = 'none';
			  document.body.appendChild(element);
			  element.click();
			  document.body.removeChild(element);
				break;

			default:
				errorHandler(new Error("This function is still under development."));
				break;
		}
	}
	else {
		errorHandler(new Error("The selected transcript or index document is empty."));
	}
}

/** General Functions **/

// Here is our error handling
function errorHandler(e) {
	var error = '';
  error += '<div class="col-md-6"><i id="close" class="fa fa-times-circle-o close"></i><p class="error-bar"><i class="fa fa-exclamation-circle"></i> ' + e + '</p></div>';
	$('#messagesBar').append(error);
	$('html, body').animate({ scrollTop: 0 }, 'fast');

	closeButtons();
}

// Here we reload the page
function clearBoxes() {
	if (confirm("This will clear the work in all areas.") == true) {
		location.reload(true);
	}
}

// Here we remove items the user no longer wishes to see
// Includes deleting Segment Tags
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

// Document Ready
(function($){
	// Don't show the A/V controls, errorBar, or Tag button
	$("#video").hide();
	$("#audio").hide();
	$("#tag-segment-btn").hide();
	$("#tag-controls-ap").hide();
	$("#tag-controls-yt").hide();
	$("#sync-controls").hide();
	$("#finish-area").hide();
	$("#transcript-preview").hide();

	// Initialize close buttons, tabs, and accordion
	closeButtons();

  $("#text-tabs").tabs({
		active: 0
	});

	// If the Index tab is clicked, ensure transcript looping is deactivated
	$('a[href$="tabs-index"]').click(function () {
		looping = -1;
	});

	// Activate our index and preview index accordions
	$("#indexAccordion").accordion({
    header: "> div > h3",
    autoHeight: false,
    collapsible: true,
		clearStyle: true,
    active: false
  });

	// Watch the AblePlayer time status for Transcript Syncing
	document.getElementById("video-player").ontimeupdate = function() { transcriptTimestamp() };
	document.getElementById("audio-player").ontimeupdate = function() { transcriptTimestamp() };

	// Disallow non-numerical values in transcript controls
	// Only allow 0-9, backspace, and delete
	$('#sync-roll').keypress(function (event) {
    if (event.shiftKey == true) { event.preventDefault(); }
    if ((event.charCode >= 48 && event.charCode <= 57) || event.keyCode == 8 || event.keyCode == 46 || event.keyCode == 37 || event.keyCode == 39) { }
		else { event.preventDefault(); }
	});

	// Never let the transcript roll control be empty
	$('#sync-roll').blur(function () {
		if(!$(this).val()) { $(this).val('0'); }
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

	// If the dropdown list is changed, change the active tab to the selected dropdown item
	$("#file-type, #input-text").click(function() {
		var selected = "#tabs-" + $("#file-type").val();
    $('#text-tabs a[href="' + selected + '"]').trigger('click');
  });

	// Load YouTube API
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	// Scroll to top function
	$('#working-area').scroll(function() {
    $('#media-playback').css('top', $(this).scrollTop());
	});
}(jQuery));
