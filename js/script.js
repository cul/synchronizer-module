/* Columbia University Library
   Project: Synchronizer Module
   File: script.js
	 Description: Javascript functions providing file upload and display
   Author: Ashley Pressley
   Date: 11/22/2017
*/

// Here is our error handling
function errorHandler(e) {
	  document.getElementById('info-results').innerHTML += '<p class="list-item">' + e + '</p><hr />';
}

// Here we play audio files in the video control player
function renderVideo(file) {
	$("#video").show();
	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  		var target = event.target.result;
  		var videoNode = document.querySelector('video');

  		videoNode.src = target;
  	}
  }
  catch (e) { errorHandler(e); }

	reader.readAsDataURL(file);
}

// Here we play audio files in the audio control player
function renderAudio(file) {
	$("#audio").show();
	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  		var target = event.target.result;
  		var audioNode = document.querySelector('audio');

  		audioNode.src = target;
  	}
  }
  catch (e) { errorHandler(e); }

	reader.readAsDataURL(file);
}

// Here we display text file data
function renderText(file) {
	var reader = new FileReader();
  try {
  	reader.onload = function(event) {
  	// Because modern browsers will automagically close some open HTML tags,
  	// the XML blocks are not able to be styled. Potential future TODO

  		var target = event.target.result;
      guessLanguage.name(target, function(languageName) {
      	document.getElementById('language').innerHTML = "Documents provided are in " + languageName + ".";
      });

  		// if (file.type.match('text.xml')) document.getElementById('xml').innerText += target;
  		// else document.getElementById('text').innerHTML += '<div class="textfile-data" style="white-space: pre-line;">' + target + '</div>';

      document.getElementById('index').value += target;
  	}
  }
  catch (e) { errorHandler(e); }

	reader.readAsText(file);
}

// Here we determine what kind of file was uploaded
function determineFile(file) {
	// List the information from the files
	var listItem = '<p class="list-item">';
	listItem += "File Name: " + file.name + "<br />";
	listItem += "File Size: " + parseInt(file.size / 1024, 10) + "kb<br />";
	listItem += "File Type: " + file.type + "<br />";
	listItem += "Last Modified Date: " + new Date(file.lastModified) + "<br />";
	listItem += "</p><hr />";
	document.getElementById('info-results').innerHTML += listItem;

	// Get file extension
	var name = file.name.split('.');
	var ext = name[name.length - 1];

	// Depending on the type of file, display its contents in specific players or locations
	if (file.type.match('video.*')) renderVideo(file);
	else if (file.type.match('audio.*')) renderAudio(file);
	else if (file.type.match('text.*')) renderText(file);

	// For legacy SRT files
	else if (ext == "srt" || ext == "SRT") renderText(file);

	// If no file types or extensions are caught, error
	else errorHandler(new Error("Bad File Type - cannot display data"));
}

// Document Ready
(function($){
	// Don't show the video and audio controls
	$("#video").hide();
	$("#audio").hide();

	// For grabbing files via upload
	document.getElementById('file-upload').addEventListener('change', function(){
    for(var i = 0; i < this.files.length; i++){
      var file =  this.files[i];
			determineFile(file);
    }
	}, false);

	// For importing files via URL
	document.getElementById('url-submit').addEventListener('click', function(){
		var url = document.getElementById('url-upload').value;

		// Get file extension from url
		var urlArr = url.split('.');
		var ext = urlArr[urlArr.length - 1];

    fetch(url)
      .then(res => res.blob())
      .then(blob => { determineFile(blob); })
      .catch(function(e) { errorHandler(e); });
	});
}(jQuery));
