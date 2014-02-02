chrome.extension.onRequest.addListener(function (request, sender, callback) {
	switch (request.msg) {
		case "getPageDetails":
			var size = {
				width: Math.max(
					document.documentElement.clientWidth,
					document.body.scrollWidth,
					document.documentElement.scrollWidth,
					document.body.offsetWidth,
					document.documentElement.offsetWidth
				),
				height: Math.max(
					document.documentElement.clientHeight,
					document.body.scrollHeight,
					document.documentElement.scrollHeight,
					document.body.offsetHeight,
					document.documentElement.offsetHeight
				)
			};

			chrome.extension.sendRequest({
				"msg": "setPageDetails",
				"size": size,
				"scrollBy": window.innerHeight,
				"originalParams": {
					"overflow": document.querySelector("html").style.overflow,
					"scrollTop": document.documentElement.scrollTop
				}
			});
			break;

		case "scrollPage":
			var lastCapture = false;

			window.scrollTo(0, request.scrollTo);

			// first scrolling
			if (request.scrollTo === 0) {
				document.querySelector("html").style.overflow = "hidden";
			}

			// last scrolling
			if (request.size.height <= document.documentElement.scrollTop + request.scrollBy) {
				lastCapture = true;
				request.scrollTo = request.size.height - request.scrollBy;
			}

			chrome.extension.sendRequest({
				"msg": "capturePage",
				"position": request.scrollTo,
				"lastCapture": lastCapture
			});
			break;

		case "resetPage":
			window.scrollTo(0, request.originalParams.scrollTop);
			document.querySelector("html").style.overflow = request.originalParams.overflow;
			break;
	}
});
