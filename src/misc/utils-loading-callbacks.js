// -----------------------------------------------------------------------------
function loadTextFile(url, callback) {
  var request = new XMLHttpRequest();

  // Math.random will prevent cacheing
  request.open('GET', url + '?please-dont-cache=' + Math.random(), true);

	request.onload = () => {
		if (request.status < 200 || request.status > 299) {
			callback('Error: HTTP Status ' + request.status + ' on resource ' + url);
		} else {
			callback(null, request.responseText);
		}
	};
	request.send();
}

// -----------------------------------------------------------------------------
var loadJSONFile = (url, callback) => {
	loadTextFile(url, (err, result) => {
		if (err) {
			callback(err);
		} else {
			try {
				callback(null, JSON.parse(result));
			} catch (e) {
				callback(e);
			}
		}
	});
};

// -----------------------------------------------------------------------------
var loadImage = (url, callback) => {
	var image = new Image();
	image.onload = () => {
		callback(null, image);
	};
	image.src = url;
};

// EOF 00100001-10