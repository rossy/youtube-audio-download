var blob, blobURL, xhr;

function sendMessage(type, data)
{
	window.parent.postMessage(JSON.stringify({ type: type, data: data }), "*");
}

function processMessage(type, data)
{
	switch (type)
	{
		case "ready-ack":
			get(url);
			break;
		case "revoke":
			blob = null;
			URL.revokeObjectURL(blobURL);
			break;
		case "cancel":
			xhr.abort();
			sendMessage("cancel-ack");
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
	var mp4 = new mp4js.Mp4(data), aac, m4a;

	data = null;

	try {
		aac = mp4.extractAACAsArrayBuffer();
	}
	catch (e) {
		sendMessage("error", { msg: "Error extracting AAC audio" });
		return;
	}

	mp4 = null;

	try {
		m4a = mp4js.aacToM4a(aac);
	}
	catch (e) {
		sendMessage("error", { msg: "Error creating M4A" });
		return;
	}

	blob = new Blob([m4a], { type: "audio/mp4" });
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
			process(xhr.response);
		else
			sendMessage("error", { msg: "Couldn't retrieve video, status code: " + xhr.status });
	};

	xhr.onprogress = function(e) {
		if (e.lengthComputable)
			sendMessage("progress", { loaded: e.loaded, total: e.total });
	};

	xhr.onerror = function(e) {
		sendMessage("error", { msg: "Couldn't retrieve video"});
	};

	xhr.send();
}

function main()
{
	sendMessage("ready");
}
