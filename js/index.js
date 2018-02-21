/* Columbia University Library
   Project: Synchronizer Module
   File: index.js
	 Description: Web Worker for Manipulating Index File Data
   Author: Ashley Pressley
   Date: 02/21/2018
	 Version: 1.0
*/

onmessage = function(e) {
  var panel = '';
  var timestamp = '';
  var title = '';
  var synopsis = '';
  var keywords = '';
  var subjects = '';
  var transcript = '';

  for (var i = 0; i < e.data.length; i++) {
    // We are only concerned with timestamped segments at this point of the parsing
    if (/(([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]\s-->\s[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]))+/.test(e.data[i])) {
      timestamp = e.data[i].substring(0, 12);

  		panel += '<div id="' + timestamp + '" class="segment-panel">';
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
  }

  postMessage(panel);
}
