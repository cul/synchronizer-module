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
	document.getElementById("video-player").ontimeupdate = function() { OHSynchronizer.AblePlayer.transcriptTimestamp() };
	document.getElementById("audio-player").ontimeupdate = function() { OHSynchronizer.AblePlayer.transcriptTimestamp() };

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

	// Load YouTube Frame API
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	// Scroll to top function
	$('#working-area').scroll(function() {
    $('#media-playback').css('top', $(this).scrollTop());
	});
}(jQuery));
