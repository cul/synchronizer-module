//this function is called when the input loads a video
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

function determineFile(file) {
	console.group("File " + file.name);
	console.log(file);
	console.log("size: " + parseInt(file.size / 1024, 10) + "kb");
	console.log("type: " + file.type);
	console.log("date: " + new Date(file.lastModified));
	console.groupEnd();
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

	document.getElementById('file-upload').addEventListener('change', function(){
	    for(var i = 0; i < this.files.length; i++){
	        var file =  this.files[i];
					determineFile(file);
	    }
	}, false);

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
	});
}(jQuery));
