var takeScreenshot = {
	/**
	 * @description ID of current tab
	 * @type {Number}
	 */
	tabId: null,

	/**
	 * @description Canvas element
	 * @type {Object}
	 */
	screenshotCanvas: null,

	/**
	 * @description 2D context of screenshotCanvas element
	 * @type {Object}
	 */
	screenshotContext: null,

	/**
	 * @description Number of pixels by which to move the screen
	 * @type {Number}
	 */
	scrollBy: 0,

	/**
	 * @description Sizes of page
	 * @type {Object}
	 */
	size: {
		width: 0,
		height: 0
	},

	/**
	 * @description Keep original params of page
	 * @type {Object}
	 */
	originalParams: {
		overflow: "",
		scrollTop: 0
	},

	/**
	 * @description Initialize plugin
	 */
	initialize: function () {
		this.screenshotCanvas = document.createElement("canvas");
		this.screenshotContext = this.screenshotCanvas.getContext("2d");

		this.bindEvents();
	},

	/**
	 * @description Bind plugin events
	 */
	bindEvents: function () {
		// handle onClick plugin icon event
		chrome.browserAction.onClicked.addListener(function (tab) {
			this.tabId = tab.id;

			chrome.tabs.sendMessage(tab.id, {
				"msg": "getPageDetails"
			});
		}.bind(this));

		// handle chrome requests
		chrome.runtime.onMessage.addListener(function (request, sender, callback) {
			if (request.msg === "setPageDetails") {
				this.size = request.size;
				this.scrollBy = request.scrollBy;
				this.originalParams = request.originalParams;

				// set width & height of canvas element
				this.screenshotCanvas.width = this.size.width;
				this.screenshotCanvas.height = this.size.height;

				this.scrollTo(0);
			} else if (request.msg === "capturePage") {
				this.capturePage(request.position, request.lastCapture);
			}
		}.bind(this));
	},

	/**
	 * @description Send request to scroll page on given position
	 * @param {Number} position
	 */
	scrollTo: function (position) {
		chrome.tabs.sendMessage(this.tabId, {
			"msg": "scrollPage",
			"size": this.size,
			"scrollBy": this.scrollBy,
			"scrollTo": position
		});
	},

	/**
	 * @description Takes screenshot of visible area and merges it
	 * @param {Number} position
	 * @param {Boolean} lastCapture
	 */
	capturePage: function (position, lastCapture) {
		var self = this;

		setTimeout(function () {
			chrome.tabs.captureVisibleTab(null, {
				"format": "png"
			}, function (dataURI) {
				var newWindow,
					image = new Image();

				if (typeof dataURI !== "undefined") {
					image.onload = function() {
						self.screenshotContext.drawImage(image, 0, position);

						if (lastCapture) {
							self.resetPage();
							newWindow = window.open();
							newWindow.document.write("<style type='text/css'>body {margin: 0;}</style>");
							newWindow.document.write("<img src='" + self.screenshotCanvas.toDataURL("image/png") + "'/>");
						} else {
							self.scrollTo(position + self.scrollBy);
						}
					};

					image.src = dataURI;
				} else {
					chrome.tabs.sendMessage(self.tabId, {
						"msg": "showError",
						"originalParams": self.originalParams
					});
				}
			});
		}, 300);
	},

	/**
	 * @description Send request to set original params of page
	 */
	resetPage: function () {
		chrome.tabs.sendMessage(this.tabId, {
			"msg": "resetPage",
			"originalParams": this.originalParams
		});
	}
};


takeScreenshot.initialize();
