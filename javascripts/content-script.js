function resetPage(originalParams) {
	window.scrollTo(0, originalParams.scrollTop);
	document.querySelector("body").style.overflow = originalParams.overflow;
}

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
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

			chrome.extension.sendMessage({
				"msg": "setPageDetails",
				"size": size,
				"scrollBy": window.innerHeight,
				"originalParams": {
					"overflow": document.querySelector("body").style.overflow,
					"scrollTop": document.documentElement.scrollTop
				}
			});
			break;

		case "scrollPage":
			var lastCapture = false;

			window.scrollTo(0, request.scrollTo);

			// first scrolling
			if (request.scrollTo === 0) {
				document.querySelector("body").style.overflow = "hidden";
			}

			// last scrolling
			if (request.size.height <= window.scrollY + request.scrollBy) {
				lastCapture = true;
				request.scrollTo = request.size.height - request.scrollBy;
			}

			chrome.extension.sendMessage({
				"msg": "capturePage",
				"position": request.scrollTo,
				"lastCapture": lastCapture
			});
			break;

		case "resetPage":
			resetPage(request.originalParams);
			break;

		case "showError":
			var errorEl = document.createElement("div");

			errorEl.innerHTML = "<div style='position: absolute; top: 10px; right: 10px; z-index: 9999; padding: 8px; background-color: #fff2f2; border: 1px solid #f03e3e; border-radius: 2px; font-size: 12px; line-height: 16px; transition: opacity .3s linear;'>An internal error occurred while taking pictures.</div>";
			document.body.appendChild(errorEl);

			setTimeout(function () {
				errorEl.firstChild.style.opacity = 0;
			}, 3000);

			resetPage(request.originalParams);
			break;
	}
});
