<<<<<<< HEAD
/* Columbia University Library
   Project: Synchronizer Module
   File: script.js
	 Description: Javascript functions providing file upload and display
   Author: Ashley Pressley
   Date: 11/16/2017
*/

// Here is our error handling
function errorHandler(evt) {
  switch(evt.target.error.code) {
    case evt.target.error.NOT_FOUND_ERR:
      alert('File Not Found!');
      break;
    case evt.target.error.NOT_READABLE_ERR:
      alert('File is not readable');
      break;
    case evt.target.error.ABORT_ERR:
      break;
    default:
      alert('An error occurred reading this file.');
  };
}

// Here we play audio files in the video control player
=======
//this function is called when the input loads a video
>>>>>>> 2480555ab54f456974855201af5046314578d87b
function renderVideo(file) {
	$("#video").show();
	var reader = new FileReader();
	reader.onload = function(event) {
		var target = event.target.result;
		var videoNode = document.querySelector('video');

		videoNode.src = target;
	}

	reader.readAsDataURL(file);
}

<<<<<<< HEAD
// Here we play audio files in the audio control player
=======
>>>>>>> 2480555ab54f456974855201af5046314578d87b
function renderAudio(file) {
	$("#audio").show();
	var reader = new FileReader();
	reader.onload = function(event) {
		var target = event.target.result;
		var audioNode = document.querySelector('audio');

		audioNode.src = target;
	}

	reader.readAsDataURL(file);
}

<<<<<<< HEAD
// Here we display text file data
function renderText(file) {
	var reader = new FileReader();
	reader.onload = function(event) {
	// Because modern browsers will automagically close some open HTML tags,
	// the XML blocks are not able to be styled. Potential future TODO

		var target = event.target.result;
		if (file.type.match('text.xml')) document.getElementById('xml').innerText += target;
		else document.getElementById('text').innerHTML += '<div class="textfile-data" style="white-space: pre-line;">' + target + '</div>';
	}

	reader.readAsText(file);
}

// Here we determine what kind of file was uploaded
function determineFile(file) {
	// Development information sent to console
=======
function determineFile(file) {
>>>>>>> 2480555ab54f456974855201af5046314578d87b
	console.group("File " + file.name);
	console.log(file);
	console.log("size: " + parseInt(file.size / 1024, 10) + "kb");
	console.log("type: " + file.type);
	console.log("date: " + new Date(file.lastModified));
	console.groupEnd();
<<<<<<< HEAD

	// List the information from the files
	var listItem = '<p class="list-item">';
	// TODO:  filename from URL file
	// TODO:  filetype from URL file

	listItem += "File Name: " + file.name + "<br />";
	listItem += "File Size: " + parseInt(file.size / 1024, 10) + "kb<br />";
	listItem += "File Type: " + file.type + "<br />";
	listItem += "Last Modified Date: " + new Date(file.lastModified) + "<br />";
	listItem += "</p>";
	document.getElementById('info-results').innerHTML += listItem;

	// Depending on the type of file, display its contents in specific players or locations
	if (file.type.match('video.*')) renderVideo(file);
	if (file.type.match('audio.*')) renderAudio(file);
	if (file.type.match('text.*')) renderText(file);
}

// Document Ready
(function($){
	// Don't show the video and audio controls
	$("#video").hide();
	$("#audio").hide();

	// For grabbing files via upload
=======
	var listItem = "<li>";
	var fileName = (file.name == undefined) ? "URL" : file.name;
	listItem += "Filename"
	listItem += "</li>"
	document.getElementById('file-upload').append(listItem);

	if (file.type.match('video.*')) renderVideo(file);
	if (file.type.match('audio.*')) renderAudio(file);
}

(function($){
	$("#video").hide();
	$("#audio").hide();

>>>>>>> 2480555ab54f456974855201af5046314578d87b
	document.getElementById('file-upload').addEventListener('change', function(){
	    for(var i = 0; i < this.files.length; i++){
	        var file =  this.files[i];
					determineFile(file);
	    }
	}, false);

<<<<<<< HEAD
	// For grabbing files via URL
	document.getElementById('url-submit').addEventListener('click', function(){
		var xhr = new XMLHttpRequest();
		var url = document.getElementById('url-upload').value;
		console.log(url);
		xhr.open('GET', url, true);

		xhr.send(null);
		    xhr.onreadystatechange = function () {
		        if (xhr.readyState === 4 && xhr.status === 200) {
		            var type = xhr.getResponseHeader('Content-Type');
		            console.log(type);
								console.log(xhr.responseText);
		        }
		    }

		// xhr.responseType = 'blob';
		// xhr.onload = function(e) {
		//   if (this.status == 200) {
		//     var file = this.response;
		// 		determineFile(file);
		//   }
		// };
		// xhr.send();

=======
	document.getElementById('url-submit').addEventListener('click', function(){
		var xhr = new XMLHttpRequest();
		var url = document.getElementById('url-upload').value;
		xhr.open('GET', url, true);
		xhr.responseType = 'blob';
		xhr.onload = function(e) {
		  if (this.status == 200) {
		    var file = this.response;
				console.log(file);
				determineFile(file);
		  }
		};
		xhr.send();
>>>>>>> 2480555ab54f456974855201af5046314578d87b
	});
}(jQuery));
