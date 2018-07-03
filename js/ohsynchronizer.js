/* Columbia University Library
	Project: Synchronizer Module
	File: script.js
	Description: Javascript functions providing file upload and display
	Authors: Ashley Pressley, Benjamin Armintor
	Date: 05/23/2018
	Version: 1.0
*/

/** Global variables **/
// Here we embed the empty YouTube video player
// This must be presented before any function that can utilize it

var OHSynchronizer = function(){};

// get the relative path of this file, to find WebWorker modules later
OHSynchronizer.webWorkers = $("script[src$='ohsynchronizer.js']").attr('src').replace(/\.js.*$/,'');

OHSynchronizer.onYouTubeIframeAPIReady = function() {}

OHSynchronizer.timestampToDate = function(timestamp) {
	var parts = timestamp.split(/[:\.]/);
	var result = new Date();
	result.setHours(parts[0]);
	result.setMinutes(parts[1]);
	result.setSeconds(parts[2]);
	result.setMilliseconds(parts[3]);
	return result;
}

OHSynchronizer.timestampAsSeconds = function(timestamp) {
	var parts = timestamp.split(/[:\.]/);
	var result = parseInt(parts[0]) * 3600;
	result += parseInt(parts[1]) * 60;
	result += parseInt(parts[2]);
	result += parseInt(parts[3])/1000;
	return result;
}

OHSynchronizer.twoDigits = function(value, frac) {
	return Number(value).toLocaleString(undefined, {minimumIntegerDigits: 2, maximumFractionDigits: frac, minimumFractionDigits: frac})
}

OHSynchronizer.secondsAsTimestamp = function(time, frac = 3) {
	var minutes = Math.floor(time / 60);
	var hours = Math.floor(minutes / 60);
	var seconds = (time - minutes * 60).toFixed(3);
	return OHSynchronizer.twoDigits(hours, 0) + ":" + OHSynchronizer.twoDigits(minutes, 0) + ":" + OHSynchronizer.twoDigits(seconds, frac);
}

OHSynchronizer.ytplayer = null;

// Looping is used to notify various functions if Transcript looping is currently active
OHSynchronizer.looping = -1;

OHSynchronizer.Events = {
	// no op handlers by default, can be overridden by context
	uploadsuccess : function(event) {},
	hlssuccess : function(event) {}
};

/** Import Functions **/

OHSynchronizer.Import = function(){};
// Here we accept locally uploaded files
OHSynchronizer.Import.uploadFile = function (sender) {
	// Grab the files from the user's selection
	var input = $(sender)[0];
	for (var i = 0; i < input.files.length; i++) {
		var file = input.files[i];

		// Get file extension
		var name = file.name.split('.');
		var ext = name[name.length - 1].toLowerCase();

		if (OHSynchronizer.Import.checkExt(ext) > -1) OHSynchronizer.Import.determineFile(file, ext, sender);
		else OHSynchronizer.errorHandler(new Error("Bad File - cannot load data from " + file.name));
	}
}

// Here we accept URL-based files
// This function is no longer utilized for non-AV files
OHSynchronizer.Import.uploadURLFile = function(sender) {
	// Continue onward, grab the URL value
	var input = $(sender)[0];
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

	if (ext == "m3u8") {
		OHSynchronizer.Import.renderHLS(url);
		OHSynchronizer.playerControls = OHSynchronizer.AblePlayer;
	}
	// HTTP is only allowed for Wowza URLs
	else if (!https) {
		var error = new Error("This field only accepts HTTPS URLs.");
		OHSynchronizer.errorHandler(error);
	}
	else if (id !== '') OHSynchronizer.Import.loadYouTube(id);
	else {
		// We only allow URL uploads of media files, not any text files
		if (ext == "mp3" || ext == "ogg" || ext == "mp4" || ext == "webm") {
			fetch(url)
				.then(res => res.blob())
				.then(blob => {
					if (OHSynchronizer.Import.checkExt(ext) > -1) OHSynchronizer.Import.determineFile(blob, ext, sender);
					else OHSynchronizer.errorHandler(new Error("Bad File - cannot load data from " + url));
				})
				.catch(function(e) { OHSynchronizer.errorHandler(e);	});
			  OHSynchronizer.playerControls = OHSynchronizer.AblePlayer;
		}
		else {
			var error = new Error("This field only accepts audio and video file URLs.");
			OHSynchronizer.errorHandler(error);
		}
	}
}

// Here we determine what kind of file was uploaded
OHSynchronizer.Import.determineFile = function(file, ext, sender) {
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
	if (sender === "#media-file-upload" || sender === "#media-url-upload") {
		switch(ext) {
			case "mp4":
			case "webm":
				OHSynchronizer.Import.renderVideo(file);
				break;

			case "ogg":
			case "mp3":
				OHSynchronizer.Import.renderAudio(file);
				break;

			default:
				OHSynchronizer.errorHandler(new Error("Bad File - cannot display data."));
				break;
		}
	}
	else if (sender === "#input-text") {
		if ($("#file-type").val() == 'none') OHSynchronizer.errorHandler(new Error("Please select the type of file you are uploading from the dropdown list provided."));
		else OHSynchronizer.Import.renderText(file, ext);
	}
	else OHSynchronizer.errorHandler(new Error("Bad File - cannot display data."));
}

// Here we ensure the extension is usable by the system
OHSynchronizer.Import.allowedExts = [
	"txt",
	"vtt",
	"xml",
	"srt",
	"mp4",
	"webm",
	"m3u8",
	"ogg",
	"mp3"
];
OHSynchronizer.Import.checkExt = function(ext) {
	return OHSynchronizer.Import.allowedExts.indexOf(ext);
}

/** Rendering Functions **/

// Here we load HLS playlists
OHSynchronizer.Import.renderHLS = function(url) {
	var player = document.querySelector('video');
	var hls = new Hls();
	hls.loadSource(url);
	hls.attachMedia(player);
	hls.on(Hls.Events.MANIFEST_PARSED,function() {
		OHSynchronizer.playerControls = new OHSynchronizer.AblePlayer();
		// Watch the AblePlayer time status for Transcript Syncing
		// Must set before video plays
		$("#video-player").bind('timeupdate', function() { OHSynchronizer.playerControls.transcriptTimestamp() });
		$("#audio-player").bind('timeupdate', function() { OHSynchronizer.playerControls.transcriptTimestamp() });
		video.play();
	});
	$("#media-upload").hide();
	// hide audio
	$("#audio").hide();
	// show video
	$("#video").show();
	// show segment controls
	$(".tag-add-segment").show();
	$("#finish-area").show();
	if ($('#transcript')[0].innerHTML != '') { $("#sync-controls").show(); }
	OHSynchronizer.Events.hlssuccess(new CustomEvent("hlssuccess", {detail: url}));
	OHSynchronizer.Index.closeButtons();
}

// Here we play video files in the video control player
OHSynchronizer.Import.renderVideo = function(file) {
	var reader = new FileReader();
	try {
		reader.onload = function(event) {
			var target = event.target.result;
			var videoNode = document.querySelector('video');

			videoNode.src = target;
			$("#media-upload").hide();
			// hide audio
			$("#audio").hide();
			$("#video").show();
			$(".tag-add-segment").show();
			$("#finish-area").show();
			if ($('#transcript')[0].innerHTML != '') {
				$("#sync-controls").show();
			}
			OHSynchronizer.Events.uploadsuccess(new CustomEvent("uploadsuccess", {detail: file}));
			OHSynchronizer.Index.closeButtons();
		}
	}
	catch (e) {
		OHSynchronizer.errorHandler(e);
		$("#media-upload").show();
		$("#video").hide();
		$("#audio").hide();
		$(".tag-add-segment").hide();
		$("#sync-controls").hide();
	}

	reader.readAsDataURL(file);
	$('#video-player').bind('durationchange', function() {
		var time = this.duration;
		$('#endTime')[0].innerHTML = OHSynchronizer.secondsAsTimestamp(time);
	});
}

// Here we load the YouTube video into the iFrame via its ID
OHSynchronizer.Import.loadYouTube = function(id) {
	if ($('#transcript')[0].innerHTML != '') { $("#sync-controls").show(); }
	$("#finish-area").show();
	$(".tag-add-segment").show();
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
	OHSynchronizer.playerControls = new OHSynchronizer.YouTube();
	new YT.Player('ytvideo', {
		events: {
			'onReady': function(event) {
				OHSynchronizer.playerControls.initializeControls(event);
				$('.tag-control-beginning').bind('click', function(){ OHSynchronizer.playerControls.playerControls('beginning') });
				$('.tag-control-backward').bind('click', function(){ OHSynchronizer.playerControls.playerControls('backward') });
				$('.tag-control-play').bind('click', function(){ OHSynchronizer.playerControls.playerControls('play') });
				$('.tag-control-stop').bind('click', function(){ OHSynchronizer.playerControls.playerControls('stop') });
				$('.tag-control-forward').bind('click', function(){ OHSynchronizer.playerControls.playerControls('forward') });
				$('.tag-control-update').bind('click', function(){ OHSynchronizer.playerControls.playerControls('update') });
			}
		}
	});
}

// Here we play audio files in the audio control player
OHSynchronizer.Import.renderAudio = function(file) {
	var reader = new FileReader();
	try {
		reader.onload = function(event) {
			var target = event.target.result;
			var audioNode = document.querySelector('audio');

			audioNode.src = target;
			$("#media-upload").hide();
			$("#audio").show();
			$("#video").hide();
			$(".tag-add-segment").show();
			$("#finish-area").show();
			if ($('#transcript')[0].innerHTML != '') { $("#sync-controls").show(); }
			OHSynchronizer.Events.uploadsuccess(new CustomEvent("uploadsuccess", {detail: file}));
			OHSynchronizer.Index.closeButtons();
		}
	}
	catch (e) {
		OHSynchronizer.errorHandler(e);
		$("#media-upload").show();
		$("#video").hide();
		$("#audio").hide();
		$(".tag-add-segment").hide();
		$("#sync-controls").hide();
	}

	reader.readAsDataURL(file);
	$('#audio-player').bind('durationchange', function() {
		var time = this.duration;
		$('#endTime')[0].innerHTML = OHSynchronizer.secondsAsTimestamp(time);
	});
}

// Here we display index or transcript file data
OHSynchronizer.Import.renderText = function(file, ext) {
	var reader = new FileReader();
	try {
		reader.onload = function(event) {
			var target = event.target.result;

			var fileType = $("#file-type").val();
			var timecodeRegEx = /(([\d]{2}:[\d]{2}:[\d]{2}.[\d]{3}\s-->\s[\d]{2}:[\d]{2}:[\d]{2}.[\d]{3}))+/;
			if (fileType == 'index') {
				var index = new OHSynchronizer.Index('input-index');
				index.initializeAccordion();
				// VTT Parsing
				if (ext === 'vtt') {
					$("#finish-area").show();

					if (target.indexOf("WEBVTT") !== 0) OHSynchronizer.errorHandler(new Error("Not a valid VTT index file."));
					else {
						// Having interview-level metadata is required
						if (/(Title:)+/.test(target) && /(Date:)+/.test(target) && /(Identifier:)+/.test(target)) {
							OHSynchronizer.Events.uploadsuccess(new CustomEvent("uploadsuccess", {detail: file}));
							OHSynchronizer.Index.closeButtons();
							// We'll break up the file line by line
							var text = target.split(/\r?\n|\r/);

							var k = 0;
							for (k; k < text.length; k++) {
								if (timecodeRegEx.test(text[k])) { break; }

								// First we pull out the interview-level metadata
								if (/(Title:)+/.test(text[k])) {
									// Save the interview title
									$('#tag-interview-title').val(text[k].slice(7));

									// Then add the rest of the information to the metadata section
									while (text[k] !== '' && k < text.length) {
										$('#interview-metadata')[0].innerHTML += text[k] + '<br />';
										k++;
									}
								}
							}

							// And we can remove the lines we've already seen to make segment parsing easier
							for (var j = k - 1; j >= 0; j--) {
								text.shift();
							}

							// Now we build segment panels
							var accordion = index.accordion();
							var timestamp = '';
							var title = '';
							var transcript = '';
							var synopsis = '';
							var keywords = '';
							var subjects = '';

							for (var i = 0; i < text.length; i++) {
								// We are only concerned with timestamped segments at this point of the parsing
								if (timecodeRegEx.test(text[i])) {
									timestamp = text[i].substring(0, 12);
									// $('#endTime').innerHTML = text[i].substring(17);

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
									index.addSegment({
										startTime: timestamp,
										title: title,
										description: synopsis,
										keywords: keywords,
										subjects: subjects,
										partialTranscript: transcript
									});
								}
							}

							index.sortAccordion();
							index.tagEdit();
							index.tagCancel();
							OHSynchronizer.Index.closeButtons();
						}
						else OHSynchronizer.errorHandler(new Error("Not a valid index file - missing interview-level metadata."));
					}
				}
				else OHSynchronizer.errorHandler(new Error("Not a valid file extension."));
			}
			else if (fileType == 'transcript') {
				// If there's no A/V present, there is no transcript Syncing
				if (!($("#audio").is(':visible')) && !($("#video").is(':visible')) && $("#ytplayer")[0].innerHTML === '') {
					OHSynchronizer.errorHandler(new Error("You must first upload an A/V file in order to sync a transcript."));
				}
				// VTT Parsing
				else {
					if (ext === 'vtt') {
						$("#finish-area").show();

						if (!(timecodeRegEx.test(target)) || target.indexOf("WEBVTT") !== 0){
							OHSynchronizer.errorHandler(new Error("Not a valid VTT transcript file."));
						}
						else {
							if ($("#audio").is(':visible') || $("#video").is(':visible') || $("#ytplayer")[0].innerHTML != '') $("#sync-controls").show();
							OHSynchronizer.Events.uploadsuccess(new CustomEvent("uploadsuccess", {detail: file}));
							OHSynchronizer.Index.closeButtons();
							// We'll break up the file line by line
							var text = target.split(/\r?\n|\r/);

							// We implement a Web Worker because larger transcript files will freeze the browser
							if (window.Worker) {
								var textWorker = new Worker(OHSynchronizer.webWorkers + "/transcript.js");
								textWorker.postMessage(text);
								textWorker.onmessage = function(e) {
									$('#transcript')[0].innerHTML += e.data;

								  // Enable click functions, addSyncMarker calls all three functions
									OHSynchronizer.Transcript.addSyncMarker();
								}
							}
						}
					}
					else OHSynchronizer.errorHandler(new Error("Not a valid file extension."));
				}
			}
			else { OHSynchronizer.errorHandler(new Error("No example file for parsing index and transcript data together available.")); }
		}
	}
	catch (e) { OHSynchronizer.errorHandler(e); }

	reader.readAsText(file);
}

/** Player Functions **/
OHSynchronizer.Player = function(){};
// Here we handling looping controls for Transcript syncing
OHSynchronizer.Player.prototype = {
	transcriptTimestamp: function() {
		var chime1 = $("#audio-chime1")[0];
		var chime2 = $("#audio-chime2")[0];

		if ($("#audio").is(':visible')) player = $("#audio-player")[0];
		else if ($("#video").is(':visible')) player = $("#video-player")[0];

		var time = this.currentTime();
		var offset = $('#sync-roll').val();

		// We only play chimes if we're on the transcript tab, and looping is active
		var loopingOnTranscript = $("#transcript").is(':visible') && OHSynchronizer.looping !== -1;
		if (Math.floor(time) % 60 == (60 - offset) && loopingOnTranscript) { chime1.play(); }
		if (Math.floor(time) % 60 == 0 && Math.floor(time) != 0 && loopingOnTranscript) { chime2.play(); }

		// If looping is active, we will jump back to a specific time should the the time be at the minute + offset
		if ((Math.floor(time) % 60 == offset || time === this.duration() ) && loopingOnTranscript) {
			$("#sync-minute")[0].innerHTML = parseInt($("#sync-minute")[0].innerHTML) + 1;
			OHSynchronizer.Transcript.syncControl("back", this);
			this.playerControls("play");
		}

		var timestamp = OHSynchronizer.secondsAsTimestamp(time, 0);
		$("#sync-time")[0].innerHTML = timestamp;
		// If the user is working on an index segment, we need to watch the playhead
		$("#tag-playhead").val(timestamp);
	},
	transcriptLoop: function() {
		var minute = parseInt($("#sync-minute")[0].innerHTML);

		// We don't loop at the beginning of the A/V
		if (minute === 0) {  }
		else {
			// If looping is active we stop it
			if (OHSynchronizer.looping !== -1) {
				this.playerControls("pause");
				$('#sync-play').addClass('btn-outline-info');
				$('#sync-play').removeClass('btn-info');
				OHSynchronizer.looping = -1;
			}
			// If looping is not active we start it
			else {
				this.seekMinute(minute);
				this.playerControls("play");
				$('#sync-play').removeClass('btn-outline-info');
				$('#sync-play').addClass('btn-info');
				OHSynchronizer.looping = minute;
			}
		}
	}
};
OHSynchronizer.YouTube = function(){
	OHSynchronizer.Player.call(this);
};
OHSynchronizer.YouTube.prototype = Object.create(OHSynchronizer.Player.prototype);
OHSynchronizer.YouTube.prototype.constructor = OHSynchronizer.YouTube;
OHSynchronizer.YouTube.prototype.currentTime = function() {
	return this.ytplayer.getCurrentTime();
}
OHSynchronizer.YouTube.prototype.duration = function() {
	return this.ytplayer.getDuration();
}
// Here we set up segment controls for the YouTube playback
//function initializeYTControls(event) {
OHSynchronizer.YouTube.prototype.initializeControls = function(event) {
	this.ytplayer = event.target;
	var player = this;
	window.setInterval(function() { player.transcriptTimestamp();}, 500);

	// Capture the end timestamp of the YouTube video
	var time = this.ytplayer.getDuration();
	$('#endTime')[0].innerHTML = OHSynchronizer.secondsAsTimestamp(time);

	$("#control-beginning").bind("click", function() {
		player.ytplayer.seekTo(0);
	});

	$("#control-backward").bind("click", function() {
		var now = player.ytplayer.getCurrentTime();
		player.ytplayer.seekTo(now - 15);
	});

	$("#control-play").bind("click", function() {
		player.ytplayer.playVideo();
	});

	$("#control-stop").bind("click", function() {
		player.ytplayer.pauseVideo();
	});

	$("#control-forward").bind("click", function() {
		var now = player.getCurrentTime();
		player.ytplayer.seekTo(now + 15);
	});

	$("#control-update-time").bind("click", function(){
		player.updateTimestamp()
	});
	this.transcriptTimestamp();

}
OHSynchronizer.YouTube.prototype.seekMinute = function(minute) {
	var offset = $('#sync-roll').val();
	this.ytplayer.seekTo(minute * 60 - offset);
}
OHSynchronizer.YouTube.prototype.seekTo = function(time) {
	this.ytplayer.seekTo(time);
}

/** Index Segment Functions **/

// Here we update the timestamp for the Tag Segment function for YouTube
OHSynchronizer.YouTube.prototype.updateTimestamp = function() {
	var player = "";

	var time = this.ytplayer.getCurrentTime();
	$("#tag-timestamp").val(OHSynchronizer.secondsAsTimestamp(time));
};

// Here we handle the keyword player controls for YouTube
OHSynchronizer.YouTube.prototype.playerControls = function(button) {
	switch(button) {
		case "beginning":
			this.ytplayer.seekTo(0);
			break;

		case "backward":
			this.ytplayer.seekTo(this.ytplayer.getCurrentTime() - 15);
			break;

		case "play":
			this.ytplayer.playVideo();
			break;

		case "stop":
			this.ytplayer.pauseVideo();
			break;

		case "forward":
			this.ytplayer.seekTo(this.ytplayer.getCurrentTime() + 15);
			break;

		case "update":
			this.updateTimestamp();
			break;

		case "seek":
			this.seekMinute(parseInt($("#sync-minute")[0].innerHTML));
			break;
		case "pause":
			this.updateTimestamp();
			this.ytplayer.pauseVideo();
			break;
		default:
			break;
	}
}

OHSynchronizer.AblePlayer = function(){
	OHSynchronizer.Player.call(this);
};
OHSynchronizer.AblePlayer.prototype = Object.create(OHSynchronizer.Player.prototype);
OHSynchronizer.AblePlayer.prototype.constructor = OHSynchronizer.AblePlayer;

OHSynchronizer.AblePlayer.prototype.player = function() {
	if ($("#audio").is(':visible')) return $("#audio-player")[0];
	else if ($("#video").is(':visible')) return $("#video-player")[0];
}
OHSynchronizer.AblePlayer.prototype.seekMinute = function(minute) {
	var offset = $('#sync-roll').val();
	this.player().currentTime = minute * 60 - offset;
}
OHSynchronizer.AblePlayer.prototype.seekTo = function(time) {
	this.player().currentTime = parseInt(time);
}
OHSynchronizer.AblePlayer.prototype.currentTime = function() {
	return this.player().currentTime;
}
OHSynchronizer.AblePlayer.prototype.duration = function() {
	return this.player().duration;
}

// Here we update the timestamp for the Tag Segment function for AblePlayer
OHSynchronizer.AblePlayer.prototype.updateTimestamp = function() {
	var time = this.player().currentTime;
	$("#tag-timestamp").val(OHSynchronizer.secondsAsTimestamp(time));
};

// Here we handle the keyword player controls for AblePlayer
OHSynchronizer.AblePlayer.prototype.playerControls = function(button) {
	switch(button) {
		case "beginning":
			this.player().currentTime = 0;
			break;

		case "backward":
			this.player().currentTime -= 15;
			break;

		case "play":
			this.player().play();
			break;

		case "stop":
			this.player().pause();
			break;

		case "forward":
			this.player().currentTime += 15;
			break;

		case "update":
			this.updateTimestamp();
			break;

		case "seek":
			this.seekMinute(parseInt($("#sync-minute")[0].innerHTML));
			break;

		default:
			break;
	}
}

/** Transcript Sync Functions **/
OHSynchronizer.Transcript = function(){};
// Here we add a Sync Marker
OHSynchronizer.Transcript.addSyncMarker = function() {
	$('.transcript-word').bind('click', function(){
		var minute = parseInt($("#sync-minute")[0].innerHTML);
		if (minute == 0) minute++;
		var marker = "{" + minute + ":00}";
		var regEx = new RegExp(marker);

		// If this word is already a sync marker, we don't make it another one
		if ($(this).hasClass('transcript-clicked')) {
			OHSynchronizer.errorHandler(new Error("Word already associated with a transcript sync marker."));
		}
		else {
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
			$("#sync-minute")[0].innerHTML = minute + 1;

			OHSynchronizer.Transcript.updateCurrentMark();
			OHSynchronizer.Transcript.removeSyncMarker();

			// If we are looping, we automatically jump forward
			if (OHSynchronizer.looping !== -1) {
				$("#sync-minute")[0].innerHTML = minute;
				OHSynchronizer.Transcript.syncControl("forward", OHSynchronizer.playerControls);
			}
		}
	});
}

// Here we update Transcript Sync Current Mark
OHSynchronizer.Transcript.updateCurrentMark = function() {
	$('.transcript-timestamp').bind('click', function(){
		var mark = $(this)[0].innerHTML;
		mark = mark.replace("{", '');
		var num = mark.split(":");
		$("#sync-minute")[0].innerHTML = num[0];
	})
}

// Here we remove a Transcript Sync Marker
OHSynchronizer.Transcript.removeSyncMarker = function() {
	$('.transcript-timestamp').bind('dblclick', function(){
		$(this).next(".transcript-clicked").removeClass('transcript-clicked');
		$(this).remove();
	});
}

// Here we capture Transcript sync control clicks
OHSynchronizer.Transcript.syncControl = function(type, playerControls) {
	var minute = parseInt($("#sync-minute")[0].innerHTML);
	var offset = $('#sync-roll').val();

	switch(type) {
		// Hitting back/forward are offset by the roll interval
		case "back":
			minute -= 1;
			if (minute <= 0) $("#sync-minute")[0].innerHTML = 0;
			else $("#sync-minute")[0].innerHTML = minute;

			playerControls.seekMinute(minute);
			break;

		case "forward":
			minute += 1;
			$("#sync-minute")[0].innerHTML = minute;

			playerControls.seekMinute(minute);
			break;

		case "loop":
			playerControls.transcriptLoop();
			break;

		default:
			break;
	}
}

OHSynchronizer.Index = function(id) {
	Object.call(this);
	this.indexDiv = $('#' + id);
	var index = this;
	$('.index-tag-save').bind('click', function(){
		index.tagSave();
	});
	$('.index-tag-cancel').bind('click', function(){
		index.tagCancel();
	});
	this.indexDiv.attr('data-editVar','-1');
	this.indexDiv.attr('data-endTime','0');
};
OHSynchronizer.Index.prototype.initializeAccordion = function() {
	this.accordion().accordion({
		header: "> div > h3",
		autoHeight: false,
		collapsible: true,
		clearStyle: true,
		active: false
	});
};

OHSynchronizer.Index.segmentHtml = function(segment) {
	var panel = '<div id="' + segment.startTime + '" class="segment-panel">';
	panel += '<h3>' + segment.startTime + '-<span class="tag-title">' + segment.title + '</span></h3>';
	panel += '<div>';
	panel += '<div class="col-md-2 pull-right"><button class="btn btn-xs btn-secondary tag-edit">Edit</button> ';
	panel += '<button class="btn btn-xs btn-primary tag-delete">Delete</button></div>';
	panel += '<p>Synopsis: <span class="tag-segment-synopsis">' + segment.description + "</span></p>";
	panel += '<p>Keywords: <span class="tag-keywords">' + segment.keywords + "</span></p>";
	panel += '<p>Subjects: <span class="tag-subjects">' + segment.subjects + "</span></p>";
	panel += '<p>Partial Transcript: <span class="tag-partial-transcript">' + segment.partialTranscript + "</span></p>";
	panel += '</div></div>';
	return panel;
}

OHSynchronizer.Index.prototype.constructor = OHSynchronizer.Index;
OHSynchronizer.Index.prototype.accordion = function() {
	return this.indexDiv.find(".indexAccordion");
}
OHSynchronizer.Index.prototype.addSegment = function(segment) {
	this.accordion().append(OHSynchronizer.Index.segmentHtml(segment));
}
// Here we save the contents of the Tag Segment modal
OHSynchronizer.Index.prototype.tagSave = function() {
	var edit = this.indexDiv.attr('data-editVar');
	var segment = {};
	segment.startTime = $("#tag-timestamp").val();
	segment.title = $("#tag-segment-title").val();
	segment.partialTranscript = $("#tag-partial-transcript").val();
	segment.keywords = $("#tag-keywords").val();
	segment.subjects = $("#tag-subjects").val();
	segment.description = $("#tag-segment-synopsis").val();

	// Get an array of jQuery objects for each accordion panel
	var panelIDs = $(".indexAccordion > div").map(function(panel) {
		var id = $(panel).attr('id');
		if (id !== edit) return id;
	});

	if (segment.title === "" || segment.title === null) alert("You must enter a title.");
	else if ($.inArray(segment.startTime, panelIDs) > -1) alert("A segment for this timestamp already exists.");
	else {
		// If we're editing a panel, we need to remove the existing panel from the accordion
		if (edit !== "-1") {
			var editPanel = document.getElementById(edit);
			editPanel.remove();
		}

		this.addSegment(segment);
		this.sortAccordion();

		this.tagEdit();
		this.tagCancel();
		OHSynchronizer.Index.closeButtons();
	}
}

// Here we enable the edit buttons for segments
OHSynchronizer.Index.prototype.tagEdit = function() {
	$('.tag-edit').bind('click', function(){
		// Pop up the modal
		$('#index-tag').modal('show');

		// Get our data for editing
		var id = $(this).closest('.segment-panel');
		var timestamp = id.attr('id');
		var title = id.find(".tag-title").text();
		var synopsis = id.find(".tag-segment-synopsis").text();
		var keywords = id.find(".tag-keywords").text();
		var subjects = id.find(".tag-subjects").text();
		var transcript = id.find(".tag-partial-transcript").text();

		// Tell the global variable we're editing
		this.indexDiv.attr('data-editVar',timestamp);

		// Set the fields to the appropriate values
		$("#tag-timestamp").val(timestamp);
		$("#tag-segment-title").val(title);
		$("#tag-segment-synopsis").val(synopsis);
		$("#tag-keywords").val(keywords);
		$("#tag-subjects").val(subjects);
		$("#tag-partial-transcript").val(transcript);

		OHSynchronizer.playerControls.seekTo(OHSynchronizer.timestampAsSeconds(timestamp));
	});
}

// Here we clear and back out of the Tag Segment modal
OHSynchronizer.Index.prototype.tagCancel = function() {
	$("#tag-segment-title").val("");
	$("#tag-partial-transcript").val("");
	$("#tag-keywords").val("");
	$("#tag-subjects").val("");
	$("#tag-segment-synopsis").val("");
	$("#index-tag").modal('hide');
	this.indexDiv.attr('data-editVar',"-1");
}

// Here we sort the accordion according to the timestamp to keep the parts in proper time order
OHSynchronizer.Index.prototype.sortAccordion = function() {
	var accordion = this.accordion();

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
	accordion.accordion("refresh");
}

// Here we remove items the user no longer wishes to see
// Includes deleting Segment Tags
OHSynchronizer.Index.closeButtons = function() {
	$('.close').bind('click', function(){
		$(this).parent('div').fadeOut();
	});

	$('.tag-delete').bind('click', function(){
		var panel = $(this).parents('div').get(2);
		panel.remove();
	});
}

/** Export Functions **/
OHSynchronizer.Export = function() {};

// Here we prepare transcript data for VTT files
OHSynchronizer.Export.transcriptVTT = function() {
	var minute = '';
	var metadata = $('#interview-metadata')[0].innerHTML.replace(/<br>/g, '\n');
	var content = $('#transcript')[0].innerHTML;

	// Need to find the first minute marker, because the first chunk of transcript is 0 to that minute
	minute = content.substring(content.indexOf("{") + 1, content.indexOf("}"));
	minute = minute.substring(0, minute.indexOf(':'));
	minute = (parseInt(minute) < 10) ? '0' + minute : minute;

	if (minute == '') {
		OHSynchronizer.errorHandler(new Error("You must add at least one sync marker in order to prepare a transcript."));
		return false;
	}
	else {
		// Replace our temporary content with the real data for the export
		content = (metadata != '') ? 'WEBVTT\n\nNOTE\n' + metadata + '\n\n' : 'WEBVTT\n\n';
		content += '\n00:00:00.000 --> 00:' + minute + ':00.000\n';
		content += $('#transcript')[0].innerHTML.replace(/<\/span>/g, '').replace(/<span class="transcript-word">/g, '').replace(/&nbsp;/g, ' ').replace(/<span class="transcript-word transcript-clicked">/g, '');

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

// Here we prepare index data for VTT files with jquery
OHSynchronizer.Export.indexSegmentData = function() {
	var metadata = $('#interview-metadata')[0].innerHTML.replace(/<br>/g, '\n');
	var content = (metadata != '') ? 'WEBVTT\n\nNOTE\n' + metadata + '\n\n' : 'WEBVTT\n\n';
	var endProxy = {startTime : $('#endTime')[0].innerHTML };
	// We'll break up the text by segments
	var segments = $('.indexAccordion > .segment-panel').map(function(index, div){
		return {
			startTime: $(div).attr('id'),
			title: $(div).find(".tag-title").text(),
			keywords: $(div).find(".tag-keywords").text(),
			subjects: $(div).find(".tag-subjects").text(),
			description: $(div).find(".tag-segment-synopsis").text(),
			partialTranscript: $(div).find(".tag-partial-transcript").text(),
		}
	});
	segments.map(function(index, segment) {
		segment.endTime = (segments[index + 1] || endProxy).startTime;
	});

	return segments;
}
// Here we prepare index data for VTT files
OHSynchronizer.Export.indexVTT = function() {
	var metadata = $('#interview-metadata')[0].innerHTML.replace(/<br>/g, '\n');
	var content = (metadata != '') ? 'WEBVTT\n\nNOTE\n' + metadata + '\n\n' : 'WEBVTT\n\n';

	// We'll break up the text by segments
	var segments = OHSynchronizer.Export.indexSegmentData();

	segments.each(function(index, segment) {

		content += segment.startTime + ' --> ' + segment.endTime + '\n{\n';
		content += '  "title": "' + segment.title.replace(/"/g, '\\"') + '",\n';
		content += '  "partial_transcript": "' + segment.partialTranscript.replace(/"/g, '\\"') + '",\n';
		content += '  "description": "' + segment.description.replace(/"/g, '\\"') + '",\n';
		content += '  "keywords": "' + segment.keywords.replace(/"/g, '\\"') + '",\n';
		content += '  "subjects": "' + segment.subjects.replace(/"/g, '\\"') + '"\n';
		content += '}\n\n\n';
	});

	return content;
}

// Here we use VTT-esque data to preview the end result
OHSynchronizer.Export.previewWork = function() {
	var type = $("ul#list-tabs li.ui-tabs-active > a")[0].innerHTML;

	// Make sure looping isn't running, we'll stop the A/V media and return the playhead to the beginning
	looping = -1;
	OHSynchronizer.playerControls.playerControls("beginning");
	OHSynchronizer.playerControls.playerControls("stop");

	if ($('#media-upload').visible) OHSynchronizer.errorHandler(new Error("You must first upload media in order to preview."));
	else if (type.toLowerCase() == "transcript" && $('#transcript')[0].innerHTML != '') {
		// The current open work needs to be hidden to prevent editing while previewing
		$("#transcript").hide();
		$("#sync-controls").hide();
		$("#transcript-preview").show();
		$("#export").addClass('hidden');
		$("#preview").addClass('hidden');
		$("#preview-close").removeClass('hidden');

		var content = OHSynchronizer.Export.transcriptVTT();
		$("#transcript-preview")[0].innerHTML = "<p>";

		// We need to parse the VTT-ified transcript data so that it is "previewable"
		var text = content.split(/\r?\n|\r/);
		var first = false;

		for (var i = 0; i < text.length; i++) {
			if (/(([0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}))+/.test(text[i])) {
			if (!first) first = true;
			var timestamp = text[i][3] !== "0" ? (text[i][3] + text[i][4]) : text[i][4];
			if (timestamp !== "0") { $('#transcript-preview')[0].innerHTML += '<span class="preview-minute">[' + timestamp + ':00]&nbsp;</span>'; }
				continue;
			}
			else if (first) {
				$('#transcript-preview')[0].innerHTML += text[i] + '<br />';
			}
		}

		$('#transcript-preview')[0].innerHTML += "</p>";

		OHSynchronizer.Export.addPreviewMinutes();
	}
	else if (type.toLowerCase() == "index" && $('.indexAccordion')[0] != '') {
		// The current open work needs to be hidden to prevent editing while previewing
		$(".tag-add-segment").hide();
		$("#export").addClass('hidden');
		$("#preview").addClass('hidden');
		$("#preview-close").removeClass('hidden');

		$(".indexAccordion").clone().prop({ id: "previewAccordion", name: "indexClone"}).appendTo($('#input-index'));
		$(".indexAccordion").hide();
		$("#previewAccordion").show();

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
		OHSynchronizer.Export.addPreviewSegments();
	}
	else {
		OHSynchronizer.errorHandler(new Error("The selected transcript or index document is empty."));
	}
}

// Here we activate the minute sync markers created for previewing transcript
OHSynchronizer.Export.addPreviewMinutes = function() {
	$('.preview-minute').bind('click', function(){
		var timestamp = $(this)[0].innerText.split('[');
		var minute = timestamp[1].split(':');
		OHSynchronizer.playerControls.seekMinute(parseInt(minute[0]));
	});
}

// Here we activate the index segment buttons to for playing index segments during preview
OHSynchronizer.Export.addPreviewSegments = function() {
	$('.preview-segment').bind('click', function(){
		var timestamp = $(this).parent().parent().parent().attr("id");
		OHSynchronizer.playerControls.seekTo(OHSynchronizer.timestampAsSeconds(timestamp));
		OHSynchronizer.playerControls.playerControls("play");
	});
}

// Here we return to editing work once we are finished with previewing the end result
OHSynchronizer.Export.previewClose = function() {
	// We'll stop the A/V media and return the playhead to the beginning
	OHSynchronizer.playerControls.playerControls("beginning");
	OHSynchronizer.playerControls.playerControls("stop");

	$("#transcript").show();
	$("#sync-controls").show();
	$("#transcript-preview")[0].innerHTML = '';
	$("#transcript-preview").hide();
	$(".tag-add-segment").show();
	$(".indexAccordion").show();
	if ($("#previewAccordion")[0] != null) $("#previewAccordion")[0].remove();
	$("#export").removeClass('hidden');
	$("#preview").removeClass('hidden');
	$("#preview-close").addClass('hidden');
}

// Here we use prepared data for export to a downloadable file
OHSynchronizer.Export.exportFile = function(sender) {
	var type = $("ul#list-tabs li.ui-tabs-active > a")[0].innerHTML;

	if (type.toLowerCase() == "transcript" && $('#transcript')[0].innerHTML != '') {
		switch (sender) {
			case "vtt":
				var content = OHSynchronizer.Export.transcriptVTT();
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
				OHSynchronizer.errorHandler(new Error("This function is still under development."));
				break;
		}
	}
	else if (type.toLowerCase() == "index" && $('.indexAccordion') != '') {
		switch (sender) {
			case "vtt":
				var content = OHSynchronizer.Export.indexVTT();

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
				OHSynchronizer.errorHandler(new Error("This function is still under development."));
				break;
		}
	}
	else {
		OHSynchronizer.errorHandler(new Error("The selected transcript or index document is empty."));
	}
}

/** General Functions **/

// Here is our error handling
OHSynchronizer.errorHandler = function(e) {
	var error = '';
	error += '<div class="col-md-6"><i id="close" class="fa fa-times-circle-o close"></i><p class="error-bar"><i class="fa fa-exclamation-circle"></i> ' + e + '</p></div>';
	$('#messagesBar').append(error);
	$('html, body').animate({ scrollTop: 0 }, 'fast');

	OHSynchronizer.Index.closeButtons();
}

// Here we reload the page
OHSynchronizer.clearBoxes = function() {
	if (confirm("This will clear the work in all areas.") == true) {
		location.reload(true);
	}
}
