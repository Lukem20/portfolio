// -----------------------------------------------------------------------------
function loadTextFile(url, callback) {
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();

		// Math.random will prevent cacheing
		request.open('GET', url + '?please-dont-cache=' + Math.random(), true);

		request.onload =  () => {
			if (request.status < 200 || request.status > 299) {
				reject('Error: HTTP Status ' + request.status + ' on resource ' + url);
			} else {
				resolve(request.responseText);
			}
		};
		request.send();
	});
}

// -----------------------------------------------------------------------------
var loadJSONFile = (url, callback) => {
	return new Promise((resolve, reject) => {
		loadTextFile(url)
		.then((result) => {
			resolve(JSON.parse(result));
		}).catch((err) => {
			reject(err);
		});
	});
}

// -----------------------------------------------------------------------------
var loadImage = (url, callback) => {
	return new Promise((resolve, reject) => {
		var image = new Image();
		image.onload = () => {
			resolve(image);
		};
		image.onerror = () => {
			reject('Unable to load ' + url);
		};
		image.src = url;
	});
};

// EOF 00100001-10