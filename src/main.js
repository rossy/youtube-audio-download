var blob, blobURL, xhr;

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem || window.mozRequestFileSystem;

window.addEventListener("unload", function() {
	destroy();
}, false);

function sendMessage(type, data)
{
	window.parent.postMessage(JSON.stringify({ type: type, data: data }), "*");
}

function destroy()
{
	blob = null;
	if (blobURL)
		URL.revokeObjectURL(blobURL);
	blobURL = null;
	sendMessage("revoke-ack");
}

function saveAs(blob, defaultName)
{
	var saveLink = document.createElement("a");

	if ("download" in saveLink)
	{
		saveLink.setAttribute("href", blobURL);
		saveLink.setAttribute("download", defaultName);
		var e = document.createEvent("MouseEvents");

		e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

		if (saveLink.dispatchEvent(e))
		{
			sendMessage("save-ack");
			return;
		}
	}

	if (requestFileSystem)
		requestFileSystem(window.TEMPORARY, blob.size, function(fs) {
			fs.root.getFile(defaultName, { create: true, exclusive: false }, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter) {
					fileWriter.onwriteend = function() {
						window.location.href = fileEntry.toURL();
						sendMessage("save-ack");
					};

					fileWriter.onerror = function() {
						sendMessage("error", { msg: "Error writing file" });
					};

					fileWriter.write(blob);
				}, function() {
					sendMessage("error", { msg: "Error creating file" });
				});
			}, function() {
				sendMessage("error", { msg: "Error creating file" });
			});
		}, function() {
			sendMessage("error", { msg: "Couldn't get filesystem access" });
		});
	else
		sendMessage("save-fail");
}

function processMessage(type, data)
{
	switch (type)
	{
		case "ready-ack":
			get(url);
			break;
		case "revoke":
			destroy();
			break;
		case "cancel":
			if (xhr)
				xhr.abort();
			sendMessage("cancel-ack");
			break;
		case "save":
			saveAs(blob, data.defaultName);
			break;
	}
}

window.addEventListener("message", function(e) {
	if (e.source != window.parent)
		return;

	var json = JSON.parse(e.data);

	processMessage(json.type, json.data);
}, false);

function process(data)
{
	var mp4 = new mp4js.Mp4(new Uint8Array(data)), aac, m4a;

	data = null;

	try {
		aac = mp4.extractAACAsArrayBuffer();
	}
	catch (e) {
		sendMessage("error", { msg: "Error extracting AAC audio: " + e });
		return;
	}

	mp4 = null;

	try {
		m4a = mp4js.aacToM4a(aac);
	}
	catch (e) {
		sendMessage("error", { msg: "Error creating M4A: " + e });
		return;
	}

	blob = new Blob([new Uint8Array(m4a)], { type: "audio/mp4" });
	blobURL = URL.createObjectURL(blob);

	sendMessage("finished", { blob: blobURL });
}

function get(url)
{
	xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.responseType = "arraybuffer";

	xhr.onload = function(e) {
		if (xhr.status == 200)
		{
			process(xhr.response);
			xhr = null;
		}
		else
			sendMessage("error", { msg: "Couldn't retrieve video, status code: " + xhr.status });
	};

	xhr.onprogress = function(e) {
		if (e.lengthComputable)
			sendMessage("progress", { loaded: e.loaded, total: e.total });
	};

	xhr.onerror = function(e) {
		sendMessage("error", { msg: "Couldn't retrieve video: " + e });
	};

	xhr.send();
}

function main()
{
	sendMessage("ready");
}
