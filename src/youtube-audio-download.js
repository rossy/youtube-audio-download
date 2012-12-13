// ==UserScript==
// @name           YouTube Audio Download
// @namespace      sooaweso.me
// @description    An add-on for YouTube Video Download that splits the audio from the video.
// @version        1.0
// @author         rossy
// @license        MIT License
// @grant          none
// @updateURL      https://github.com/rossy2401/youtube-audio-download/raw/master/youtube-audio-download.user.js
// @include        http://www.youtube.com/watch?*
// @include        https://www.youtube.com/watch?*
// @include        http://*.c.youtube.com/*
// @run-at         document-start
// ==/UserScript==

var mp4js = (function() {
	// mp4.js has some really weird scoping issues. Not that keeping the global
	// namespace clean is really important here.
	this.mp4js = this;
	this.descr = this;
	this.box = this;
	this.utils = this;
	window.mp4js = this;
	window.descr = this;
	window.box = this;
	window.utils = this;

#import "mp4/mp4.js"
#import "mp4/mp4.utils.js"
#import "mp4/mp4.descr.js"
#import "mp4/mp4.box.js"
#import "mp4/mp4.main.js"

	return this;
}).call({});

(function() {
	"use strict";

	function script(url) {
#import "main.js"

		main();
	}

	if (/^https?:\/\/www.youtube.com\/watch?/.test(document.location.href))
		document.documentElement.setAttribute("data-ytd-audio-present", "data-ytd-audio-present");
	else
	{
		var m = document.location.href.match(/^(http:\/\/[^\/]+.c.youtube.com)\/#(.*)/);
		if (m)
		{
			document.replaceChild(document.createElement("html"), document.documentElement);
			document.documentElement.appendChild(document.createElement("body"));

			script(m[1] + m[2]);
		}
	}
})();
