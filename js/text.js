/* Columbia University Library
   Project: Synchronizer Module
   File: text.js
	 Description: Web Worker for Manipulating Transcript File Data
   Author: Ashley Pressley
   Date: 02/05/2018
	 Version: 1.0
*/

onmessage = function(e) {
  var first = false;
  var workerResult = '';
  for (var i = 0; i < e.data.length; i++) {
    // We don't save any interview-level data from the transcript, so we ignore everything until the first timestamp
    if (/(([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]\s-->\s[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]))+/.test(e.data[i])) {
      if (!first) first = true;
      workerResult += '<span class="hidden transcript-timestamp">' + e.data[i] + '</span>';
      continue;
    }
    else if (first) {
      e.data[i] = e.data[i].replace("<v ", '');
      e.data[i] = e.data[i].replace("</v>", '');
      e.data[i] = e.data[i].replace(/((>\s))+/, ": ");
      var words = e.data[i].split(/\s/);

      for (var j = 0; j < words.length; j++) workerResult += '<span class="transcript-word">' + words[j] + '</span>&nbsp;';
      workerResult += '\r\n';
    }
  }
  postMessage(workerResult);
}
