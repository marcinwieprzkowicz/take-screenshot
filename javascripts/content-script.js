function resetPageSettings(originalParams) {
	setFixed(originalParams.fixed);
	document.querySelector("body").style.overflow = originalParams.overflow;
	window.scrollTo({top:originalParams.scrollTop, behavior:"auto"});
	document.querySelector("html").style.scrollBehavior = originalParams.scrollBehavior;
}

function getPageSettings() {
	return {
		"scrollTop"     : document.documentElement.scrollTop,
		"overflow"      : getComputedStyle(document.querySelector("body")).getPropertyValue("overflow"),
		"scrollBehavior": getComputedStyle(document.querySelector("html")).getPropertyValue("scroll-behavior"),
		"fixed"         : getFixed()
	};
}

function setFixed(fixed) {
	for (var i in fixed) {
		var elem = document.getElementById(i);
		elem.style.display = fixed[i];
	}
}

function getFixed() {
	var fixed = {};
	var elems = document.body.getElementsByTagName("*");
	for (var i = 0; i < elems.length; i++) {
		var styles = getComputedStyle(elems[i]);
		var position = styles.getPropertyValue("position");
		if (['fixed', 'sticky', '-webkit-sticky'].indexOf(position) > -1) {
			if (!elems[i].id) {
				elems[i].id = Math.random().toString();
			}
			fixed[elems[i].id] = styles.getPropertyValue("display");
		}
	}
	return fixed;
}

function hideFixed(fixed) {
	for (var i in fixed) {
		var elem = document.getElementById(i);
		elem.style.display = "none";
	}
}

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
	switch (request.msg) {
		case "getPageDetails":
			var originalParams = getPageSettings();
			if (request.hideFixedElems) {
				hideFixed(originalParams.fixed);
			}
			document.querySelector("body").style.overflow = "hidden";
			document.querySelector("html").style.scrollBehavior = "auto";
			window.scrollTo({top:0, behavior:"auto"});

			function setPageDetails() {
				document.querySelector("html").style.scrollBehavior = "auto";
				window.scrollTo({top:0, behavior:"auto"});

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
					"originalParams": originalParams
				});
			}

			if (request.prescrollPage) {
				document.querySelector("html").style.scrollBehavior = "smooth";
				window.scrollTo({top:document.body.scrollHeight, behavior:"smooth"});
				setTimeout(setPageDetails, 5000);
			}
			else {
				setPageDetails();
			}
			break;

		case "scrollPage":
			var lastCapture = false;

			window.scrollTo({top:request.scrollTo, behavior:"auto"});

			// last scrolling
			if (request.size.height <= Math.round(window.scrollY) + request.scrollBy) {
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
			resetPageSettings(request.originalParams);
			break;

		case "showError":
			var errorEl = document.createElement("div");

			errorEl.innerHTML = "<div style='position: absolute; top: 10px; right: 10px; z-index: 9999; padding: 8px; background-color: #fff2f2; border: 1px solid #f03e3e; border-radius: 2px; font-size: 12px; line-height: 16px; transition: opacity .3s linear;'>An internal error occurred while taking pictures.</div>";
			document.body.appendChild(errorEl);

			setTimeout(function () {
				errorEl.firstChild.style.opacity = 0;
			}, 3000);

			resetPageSettings(request.originalParams);
			break;
	}
});
