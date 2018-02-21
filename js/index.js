/* Columbia University Library
   Project: Synchronizer Module
   File: index.js
	 Description: Web Worker for Manipulating Index File Data
   Author: Ashley Pressley
   Date: 02/21/2018
	 Version: 1.0
*/

onmessage = function(e) {
  var workerResult = '';

  for (var i = 0; i < e.data.length; i++) {
    // We are only concerned with timestamped segments at this point of the parsing
    if (/(([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]\s-->\s[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]))+/.test(e.data[i])) {
      var timestamp = e.data[i][3] !== "0" ? (e.data[i][3] + e.data[i][4]) : e.data[i][4];
      if (timestamp !== "0") {
        workerResult += '<span class="index-timestamp">{' + timestamp + ':00}&nbsp;</span>';
      }
      continue;
    }
  }
  postMessage(workerResult);
}
