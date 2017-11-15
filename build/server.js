/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 18);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

module.exports = request;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ObservableSocket = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.clientMessage = clientMessage;
exports.fail = fail;
exports.success = success;

var _rxjs = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function clientMessage(message) {
	var error = new Error(message);
	error.clientMessage = message;
	return error;
}

function fail(message) {
	return _rxjs.Observable.throw({ clientMessage: message });
}

var successObservable = _rxjs.Observable.empty();
function success() {
	return successObservable;
}

var ObservableSocket = exports.ObservableSocket = function () {
	_createClass(ObservableSocket, [{
		key: "isConnected",
		get: function get() {
			return this._state.isConnected;
		}
	}, {
		key: "isReconnecting",
		get: function get() {
			return this._state.isReconnecting;
		}
	}, {
		key: "isTotallyDead",
		get: function get() {
			return !this.isConnected && !this.isReconnecting;
		}
	}]);

	function ObservableSocket(socket) {
		var _this = this;

		_classCallCheck(this, ObservableSocket);

		this._socket = socket;
		this._state = {};
		this._actionCallbacks = {};
		this._requests = {};
		this._nextRequestId = 0;

		this.status$ = _rxjs.Observable.merge(this.on$("connect").map(function () {
			return { isConnected: true };
		}), this.on$("disconnect").map(function () {
			return { isConnected: false };
		}), this.on$("reconnecting").map(function (attempt) {
			return { isConnected: false, isReconnecting: true, attempt: attempt };
		}), this.on$("reconnect_failed").map(function () {
			return { isConnected: false, isReconnecting: false };
		})).publishReplay(1).refCount();

		this.status$.subscribe(function (state) {
			return _this._state = state;
		});
	}

	/*
  * -----------------
  * Basic Wrappers
  */


	_createClass(ObservableSocket, [{
		key: "on$",
		value: function on$(event) {
			return _rxjs.Observable.fromEvent(this._socket, event);
		}
	}, {
		key: "on",
		value: function on(event, callback) {
			this._socket.on(event, callback);
		}
	}, {
		key: "off",
		value: function off(event, callback) {
			this._socket.off(event, callback);
		}
	}, {
		key: "emit",
		value: function emit(event, arg) {
			this._socket.emit(event, arg);
		}

		/*
   * -----------------
   * Emit (Client Side)
   */

	}, {
		key: "emitAction$",
		value: function emitAction$(action, arg) {
			var id = this._nextRequestId++;
			this._registerCallbacks(action);

			var subject = this._requests[id] = new _rxjs.ReplaySubject(1);
			this._socket.emit(action, arg, id);
			return subject;
		}
	}, {
		key: "_registerCallbacks",
		value: function _registerCallbacks(action) {
			var _this2 = this;

			if (this._actionCallbacks.hasOwnProperty(action)) {
				return;
			}

			this._socket.on(action, function (arg, id) {
				var request = _this2._popRequest(id);
				if (!request) {
					return;
				}

				request.next(arg);
				request.complete();
			});

			this._socket.on(action + ":fail", function (arg, id) {
				var request = _this2._popRequest(id);
				if (!request) {
					return;
				}

				request.error(arg);
			});

			this._actionCallbacks[action] = true;
		}
	}, {
		key: "_popRequest",
		value: function _popRequest(id) {
			if (!this._requests.hasOwnProperty(id)) {
				console.error("Event with id " + id + " was returned twice, or the server did not send back an ID!");
				return;
			}

			var request = this._requests[id];
			delete this._requests[id];
			return request;
		}

		/*
   * -----------------
   * On (Server Side)
   */

	}, {
		key: "onAction",
		value: function onAction(action, callback) {
			var _this3 = this;

			this._socket.on(action, function (arg, requestId) {
				try {
					var value = callback(arg);
					if (!value) {
						_this3._socket.emit(action, null, requestId);
						return;
					}

					if (typeof value.subscribe !== "function") {
						_this3._socket.emit(action, value, requestId);
						return;
					}

					var hasValue = false;
					value.subscribe({
						next: function next(item) {
							if (hasValue) {
								throw new Error("Action " + action + " produced more than one value.");
							}

							_this3._socket.emit(action, item, requestId);
							hasValue = true;
						},

						error: function error(_error) {
							_this3._emitError(action, requestId, _error);
							console.error(_error.stack || _error);
						},

						complete: function complete() {
							if (!hasValue) {
								_this3._socket.emit(action, null, requestId);
							}
						}
					});
				} catch (error) {
					if (typeof requestId !== "undefined") {
						_this3._emitError(action, requestId, error);
					}

					console.error(error.stack || error);
				}
			});
		}
	}, {
		key: "onActions",
		value: function onActions(actions) {
			for (var action in actions) {
				if (!actions.hasOwnProperty(action)) {
					continue;
				}

				this.onAction(action, actions[action]);
			}
		}
	}, {
		key: "_emitError",
		value: function _emitError(action, id, error) {
			var message = error && error.clientMessage || "Fatal Error";
			this._socket.emit(action + ":fail", { message: message }, id);
		}
	}]);

	return ObservableSocket;
}();

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ModuleBase = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint no-unused-vars: "off"*/

var ModuleBase = exports.ModuleBase = function () {
	function ModuleBase() {
		_classCallCheck(this, ModuleBase);
	}

	_createClass(ModuleBase, [{
		key: "init$",
		value: function init$() {
			return _rxjs.Observable.empty();
		}
	}, {
		key: "registerClient",
		value: function registerClient(client) {}
	}, {
		key: "clientRegistered",
		value: function clientRegistered(client) {}
	}]);

	return ModuleBase;
}();

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Validator = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Validator = exports.Validator = function () {
	_createClass(Validator, [{
		key: "isValid",
		get: function get() {
			return !this._errors.length;
		}
	}, {
		key: "errors",
		get: function get() {
			return this._errors;
		}
	}, {
		key: "message",
		get: function get() {
			return this._errors.join(", ");
		}
	}]);

	function Validator() {
		_classCallCheck(this, Validator);

		this._errors = [];
	}

	_createClass(Validator, [{
		key: "error",
		value: function error(message) {
			this._errors.push(message);
		}
	}, {
		key: "toObject",
		value: function toObject() {
			if (this.isValid) {
				return {};
			}

			return {
				errors: this._errors,
				message: this.message
			};
		}
	}, {
		key: "throw$",
		value: function throw$() {
			return _rxjs.Observable.throw({ clientMessage: this.message });
		}
	}]);

	return Validator;
}();

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.YOUTUBE_REGEXES = undefined;
exports.validateAddSource = validateAddSource;

var _lodash = __webpack_require__(0);

var _lodash2 = _interopRequireDefault(_lodash);

var _validator = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var YOUTUBE_REGEXES = exports.YOUTUBE_REGEXES = [/https?:\/\/(?:www\.)?youtube\.com\/.*?v=(.*)$/, /https?:\/\/youtu\.be\/(.*)/];

function validateAddSource(url) {
	var validator = new _validator.Validator();
	if (!_lodash2.default.some(YOUTUBE_REGEXES, function (r) {
		return r.test(url);
	})) {
		validator.error("Invalid Url");
	}

	return validator;
}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ChatModule = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _module = __webpack_require__(2);

var _chat = __webpack_require__(14);

var _observableSocket = __webpack_require__(1);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MAX_HISTORY = 100;
var BATCH_SIZE = 10;

var ChatModule = exports.ChatModule = function (_ModuleBase) {
	_inherits(ChatModule, _ModuleBase);

	function ChatModule(io, usersModule) {
		_classCallCheck(this, ChatModule);

		var _this = _possibleConstructorReturn(this, (ChatModule.__proto__ || Object.getPrototypeOf(ChatModule)).call(this));

		_this._io = io;
		_this._users = usersModule;
		_this._chatLog = [];
		return _this;
	}

	_createClass(ChatModule, [{
		key: "sendMessage",
		value: function sendMessage(user, message, type) {
			message = message.trim();

			var validator = (0, _chat.validateSendMessage)(user, message, type);
			if (!validator.isValid) {
				return validator.throw$();
			}

			var newMessage = {
				user: { name: user.name, color: user.color },
				message: message,
				time: new Date().getTime(),
				type: type
			};

			this._chatLog.push(newMessage);

			if (this._chatLog.length >= MAX_HISTORY) {
				this._chatLog.splice(0, BATCH_SIZE);
			}

			this._io.emit("chat:added", newMessage);
		}
	}, {
		key: "registerClient",
		value: function registerClient(client) {
			var _this2 = this;

			client.onActions({
				"chat:list": function chatList() {
					return _this2._chatLog;
				},

				"chat:add": function chatAdd(_ref) {
					var message = _ref.message,
					    type = _ref.type;

					type = type || "normal";

					var user = _this2._users.getUserForClient(client);
					if (!user) {
						return (0, _observableSocket.fail)("You must be logged in");
					}

					_this2.sendMessage(user, message, type);
				}
			});
		}
	}]);

	return ChatModule;
}(_module.ModuleBase);

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PlaylistModule = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = __webpack_require__(0);

var _lodash = __webpack_require__(0);

var _lodash2 = _interopRequireDefault(_lodash);

var _module = __webpack_require__(2);

var _observableSocket = __webpack_require__(1);

var _playlist = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlaylistModule = exports.PlaylistModule = function (_ModuleBase) {
	_inherits(PlaylistModule, _ModuleBase);

	function PlaylistModule(io, usersModule, playlistRepository, videoServices) {
		_classCallCheck(this, PlaylistModule);

		var _this = _possibleConstructorReturn(this, (PlaylistModule.__proto__ || Object.getPrototypeOf(PlaylistModule)).call(this));

		_this._io = io;
		_this._users = usersModule;
		_this._repository = playlistRepository;
		_this._services = videoServices;

		_this._nextSourceId = 1;
		_this._playlist = [];
		_this._currentIndex = -1;
		_this._currentSource = null;
		_this._currentTime = 0;

		setInterval(_this._tickUpdateTime.bind(_this), 1000);
		setInterval(_this._tickUpdateClients.bind(_this), 5000);
		return _this;
	}

	_createClass(PlaylistModule, [{
		key: "init$",
		value: function init$() {
			return this._repository.getAll$().do(this.setPlaylist.bind(this));
		}
	}, {
		key: "getSourceById",
		value: function getSourceById(id) {
			return _lodash2.default.find(this._playlist, { id: id });
		}
	}, {
		key: "setPlaylist",
		value: function setPlaylist(playlist) {
			this._playlist = playlist;

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = playlist[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var source = _step.value;

					source.id = this._nextSourceId++;
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			this._io.emit("playlist:list", this._playlist);
		}
	}, {
		key: "setCurrentSource",
		value: function setCurrentSource(source) {
			if (source == null) {
				this._currentSource = null;
				this._currentIndex = this._currentTime = 0;
			} else {
				var newIndex = this._playlist.indexOf(source);
				if (newIndex === -1) {
					throw new Error("Cannot set current to source " + source.id + " / " + source.title + ", it was not found");
				}

				this._currentTime = 0;
				this._currentSource = source;
				this._currentIndex = newIndex;
			}

			this._io.emit("playlist:current", this._createCurrentEvent());
			console.log("playlist: setting current to " + (source ? source.title : "{nothing}"));
		}
	}, {
		key: "playNextSource",
		value: function playNextSource() {
			if (!this._playlist.length) {
				this.setCurrentSource(null);
				return;
			}

			if (this._currentIndex + 1 >= this._playlist.length) {
				this.setCurrentSource(this._playlist[0]);
			} else {
				this.setCurrentSource(this._playlist[this._currentIndex + 1]);
			}
		}
	}, {
		key: "addSourceFromUrl$",
		value: function addSourceFromUrl$(url) {
			var _this2 = this;

			var validator = (0, _playlist.validateAddSource)(url);
			if (!validator.isValid) {
				return validator.throw$();
			}

			return new _rxjs.Observable(function (observer) {
				var getSource$ = null;

				var _iteratorNormalCompletion2 = true;
				var _didIteratorError2 = false;
				var _iteratorError2 = undefined;

				try {
					for (var _iterator2 = _this2._services[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
						var service = _step2.value;

						getSource$ = service.process$(url);

						if (getSource$) {
							break;
						}
					}
				} catch (err) {
					_didIteratorError2 = true;
					_iteratorError2 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion2 && _iterator2.return) {
							_iterator2.return();
						}
					} finally {
						if (_didIteratorError2) {
							throw _iteratorError2;
						}
					}
				}

				if (!getSource$) {
					return (0, _observableSocket.fail)("No service accepted url " + url);
				}

				getSource$.do(function (source) {
					return _this2.addSource(source);
				}).subscribe(observer);
			});
		}
	}, {
		key: "addSource",
		value: function addSource(source) {
			source.id = this._nextSourceId++;

			var insertIndex = 0,
			    afterId = -1;

			if (this._currentSource) {
				afterId = this._currentSource.id;
				insertIndex = this._currentIndex + 1;
			}

			this._playlist.splice(insertIndex, 0, source);
			this._io.emit("playlist:added", { source: source, afterId: afterId });

			if (!this._currentSource) {
				this.setCurrentSource(source);
			}

			console.log("playlist: added " + source.title);
		}
	}, {
		key: "_tickUpdateTime",
		value: function _tickUpdateTime() {
			if (this._currentSource == null) {
				if (this._playlist.length) {
					this.setCurrentSource(this._playlist[0]);
				}
			} else {
				this._currentTime++;
				if (this._currentTime > this._currentSource.totalTime + 2) {
					this.playNextSource();
				}
			}
		}
	}, {
		key: "_tickUpdateClients",
		value: function _tickUpdateClients() {
			this._io.emit("playlist:current", this._createCurrentEvent());
		}
	}, {
		key: "_createCurrentEvent",
		value: function _createCurrentEvent() {
			return this._currentSource ? {
				id: this._currentSource.id,
				time: this._currentTime
			} : {
				id: null,
				time: 0
			};
		}
	}, {
		key: "moveSource",
		value: function moveSource(fromId, toId) {
			var fromSource = this.getSourceById(fromId);
			if (!fromSource) {
				throw new Error("Could not find \"from\" source " + fromId);
			}

			var toSource = null;
			if (toId) {
				toSource = this.getSourceById(toId);
				if (!toSource) {
					throw new Error("Could not find \"to\" source " + toId);
				}
			}

			var fromIndex = this._playlist.indexOf(fromSource);
			this._playlist.splice(fromIndex, 1);

			var toIndex = toId ? this._playlist.indexOf(toSource) + 1 : 0;
			this._playlist.splice(toIndex, 0, fromSource);

			if (this._currentSource) {
				this._currentIndex = this._playlist.indexOf(this._currentSource);
			}

			this._io.emit("playlist:moved", { fromId: fromId, toId: toId });
			console.log("playlist: moved " + fromSource.title + " to " + (toSource ? "to after " + toSource.title : "to the beginning"));
		}
	}, {
		key: "deleteSourceById",
		value: function deleteSourceById(id) {
			var source = this.getSourceById(id);
			if (!source) {
				throw new Error("Cannot find source " + id);
			}

			var sourceIndex = this._playlist.indexOf(source);

			if (source == this._currentSource) {
				if (this._playlist.length == 1) {
					this.setCurrentSource(null);
				} else {
					this.playNextSource();
				}
			}

			this._playlist.splice(sourceIndex, 1);

			if (this._currentSource) {
				this._currentIndex = this._playlist.indexOf(this._currentSource);
			}

			this._io.emit("playlist:removed", { id: id });
			console.log("playlist: deleted " + source.title);
		}
	}, {
		key: "registerClient",
		value: function registerClient(client) {
			var _this3 = this;

			var isLoggedIn = function isLoggedIn() {
				return _this3._users.getUserForClient(client) !== null;
			};

			client.onActions({
				"playlist:list": function playlistList() {
					return _this3._playlist;
				},

				"playlist:current": function playlistCurrent() {
					return _this3._createCurrentEvent();
				},

				"playlist:add": function playlistAdd(_ref) {
					var url = _ref.url;

					if (!isLoggedIn()) {
						return (0, _observableSocket.fail)("You must be logged in to do that");
					}

					return _this3.addSourceFromUrl$(url);
				},

				"playlist:set-current": function playlistSetCurrent(_ref2) {
					var id = _ref2.id;

					if (!isLoggedIn()) {
						return (0, _observableSocket.fail)("You must be logged in to do that");
					}

					var source = _this3.getSourceById(id);
					if (!source) {
						return (0, _observableSocket.fail)("Cannot find source " + id);
					}

					_this3.setCurrentSource(source);
				},

				"playlist:move": function playlistMove(_ref3) {
					var fromId = _ref3.fromId,
					    toId = _ref3.toId;

					if (!isLoggedIn()) {
						return (0, _observableSocket.fail)("You must be logged in to do that");
					}

					_this3.moveSource(fromId, toId);
				},

				"playlist:remove": function playlistRemove(_ref4) {
					var id = _ref4.id;

					if (!isLoggedIn()) {
						return (0, _observableSocket.fail)("You must be logged in to do that");
					}

					_this3.deleteSourceById(id);
				}

				// D57e70e236ba4f8d9ebbe1e5c215e656
			});
		}
	}]);

	return PlaylistModule;
}(_module.ModuleBase);

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.UsersModule = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = __webpack_require__(0);

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = __webpack_require__(0);

var _module = __webpack_require__(2);

var _users = __webpack_require__(15);

var _observableSocket = __webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AuthContext = Symbol("AuthContext");

var UsersModule = exports.UsersModule = function (_ModuleBase) {
	_inherits(UsersModule, _ModuleBase);

	function UsersModule(io) {
		_classCallCheck(this, UsersModule);

		var _this = _possibleConstructorReturn(this, (UsersModule.__proto__ || Object.getPrototypeOf(UsersModule)).call(this));

		_this._io = io;
		_this._userList = [];
		_this._users = {};
		return _this;
	}

	_createClass(UsersModule, [{
		key: "getColorForUsername",
		value: function getColorForUsername(username) {
			var hash = _lodash2.default.reduce(username, function (hash, ch) {
				return ch.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
			}, 0);

			hash = Math.abs(hash);
			var hue = hash % 360,
			    saturation = hash % 25 + 70,
			    lightness = 100 - (hash % 15 + 35);

			return "hsl(" + hue + ", " + saturation + "%, " + lightness + "%)";
		}
	}, {
		key: "getUserForClient",
		value: function getUserForClient(client) {
			var auth = client[AuthContext];
			if (!auth) {
				return null;
			}

			return auth.isLoggedIn ? auth : null;
		}
	}, {
		key: "loginClient$",
		value: function loginClient$(client, username) {
			username = username.trim();

			var validator = (0, _users.validateLogin)(username);
			if (!validator.isValid) {
				return validator.throw$();
			}

			if (this._users.hasOwnProperty(username)) {
				return (0, _observableSocket.fail)("Username " + username + " is already taken");
			}

			var auth = client[AuthContext] || (client[AuthContext] = {});
			if (auth.isLoggedIn) {
				return (0, _observableSocket.fail)("You are already logged in");
			}

			auth.name = username;
			auth.color = this.getColorForUsername(username);
			auth.isLoggedIn = true;

			this._users[username] = client;
			this._userList.push(auth);

			this._io.emit("users:added", auth);
			console.log("User " + username + " logged in");
			return _rxjs.Observable.of(auth);
		}
	}, {
		key: "logoutClient",
		value: function logoutClient(client) {
			var auth = this.getUserForClient(client);
			if (!auth) {
				return;
			}

			var index = this._userList.indexOf(auth);
			this._userList.splice(index, 1);
			delete this._users[auth.name];
			delete client[AuthContext];

			this._io.emit("users:removed", auth);
			console.log("User " + auth.name + " logged out");
		}
	}, {
		key: "registerClient",
		value: function registerClient(client) {
			var _this2 = this;

			client.onActions({
				"users:list": function usersList() {
					return _this2._userList;
				},

				"auth:login": function authLogin(_ref) {
					var name = _ref.name;

					return _this2.loginClient$(client, name);
				},

				"auth:logout": function authLogout() {
					_this2.logoutClient(client);
				}
			});

			client.on("disconnect", function () {
				_this2.logoutClient(client);
			});
		}
	}]);

	return UsersModule;
}(_module.ModuleBase);

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.FileRepository = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = __webpack_require__(16);

var _fs2 = _interopRequireDefault(_fs);

var _rxjs = __webpack_require__(0);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var readFile = _rxjs.Observable.bindNodeCallback(_fs2.default.readFile);
var writeFile = _rxjs.Observable.bindNodeCallback(_fs2.default.writeFile);

var FileRepository = exports.FileRepository = function () {
	function FileRepository(filename) {
		_classCallCheck(this, FileRepository);

		this._filename = filename;
	}

	_createClass(FileRepository, [{
		key: "getAll$",
		value: function getAll$() {
			var _this = this;

			return readFile(this._filename).map(function (contents) {
				return JSON.parse(contents);
			}).do(function () {
				console.log(_this._filename + ": got all data");
			}).catch(function (e) {
				console.error(_this._filename + ": failed to get all data: " + (e.stack || e));
				return _rxjs.Observable.throw(e);
			});
		}
	}, {
		key: "save$",
		value: function save$(items) {
			var _this2 = this;

			return writeFile(this._filename, JSON.stringify(items)).do(function () {
				console.log(_this2._filename + ": data saved");
			}).catch(function (e) {
				console.error(_this2._filename + ": failed to save data: " + (e.stack || e));
			});
		}
	}]);

	return FileRepository;
}();

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.YoutubeService = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = __webpack_require__(0);

var _moment = __webpack_require__(0);

var _moment2 = _interopRequireDefault(_moment);

var _lodash = __webpack_require__(0);

var _lodash2 = _interopRequireDefault(_lodash);

var _request = __webpack_require__(13);

var _playlist = __webpack_require__(4);

var _observableSocket = __webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var YOUTUBE_ENDPOINT = "https://www.googleapis.com/youtube/v3";

var YoutubeService = exports.YoutubeService = function () {
	function YoutubeService(apiKey) {
		_classCallCheck(this, YoutubeService);

		this._apiKey = apiKey;

		if (apiKey === "{fixme}") {
			console.error("Please enter your own YouTube API key in server.js");
		}
	}

	_createClass(YoutubeService, [{
		key: "process$",
		value: function process$(url) {
			if (this._apiKey === "{fixme}") {
				console.error("Please enter your own YouTube API key in server.js");
				return null;
			}

			var match = (0, _lodash2.default)(_playlist.YOUTUBE_REGEXES).map(function (r) {
				return url.match(r);
			}).find(function (a) {
				return a != null;
			});

			return match ? this.getSourceFromId$(match[1]) : null;
		}
	}, {
		key: "getSourceFromId$",
		value: function getSourceFromId$(id) {
			return (0, _request.getJson$)(this._buildGetVideoUrl(id)).flatMap(function (data) {
				if (!data || data.items.length != 1) {
					return (0, _observableSocket.fail)("Cannot locate youtube video " + id);
				}

				var _data$items$ = data.items[0],
				    id = _data$items$.id,
				    snippet = _data$items$.snippet,
				    contentDetails = _data$items$.contentDetails;

				return _rxjs.Observable.of({
					type: "youtube",
					thumb: snippet.thumbnails.default.url,
					url: id,
					title: snippet.title || "{No Title}",
					totalTime: _moment2.default.duration(contentDetails.duration).asSeconds()
				});
			});
		}
	}, {
		key: "_buildGetVideoUrl",
		value: function _buildGetVideoUrl(id) {
			return YOUTUBE_ENDPOINT + "/videos?id=" + id + "&key=" + this._apiKey + "&part=snippet,contentDetails,statistics,status";
		}
	}]);

	return YoutubeService;
}();

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

var _rxjs = __webpack_require__(0);

_rxjs.Observable.prototype.safeSubscribe = function (next, error, complete) {
	var subscription = this.subscribe(function (item) {
		try {
			next(item);
		} catch (e) {
			console.error(e.stack || e);
			subscription.unsubscribe();
		}
	}, error, complete);

	return subscription;
};

_rxjs.Observable.prototype.catchWrap = function () {
	return this.catch(function (error) {
		return _rxjs.Observable.of({ error: error });
	});
};

_rxjs.Observable.fromEventNoDefault = function (element, event) {
	return _rxjs.Observable.fromEvent(element, event).do(function (e) {
		return e.preventDefault();
	});
};

_rxjs.Observable.fromPrompt = function (promptText) {
	return new _rxjs.Observable(function (observer) {
		var result = window.prompt(promptText);
		observer.next(result);
		observer.complete();
	});
};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

/* eslint-disable multiline-ternary,no-ternary,no-negated-condition */
var path = __webpack_require__(17),
    webpack = __webpack_require__(0),
    ExtractTextPlugin = __webpack_require__(0);

var vendorModules = ["jquery", "lodash", "socket.io-client", "rxjs", "moment", "moment-duration-format"];

var dirname = path.resolve("./");
// eslint-disable-next-line max-statements
function createConfig(isDebug) {
	var devTool = isDebug ? "eval-source-map" : "source-map";
	var plugins = [new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.js")];

	var cssLoader = { test: /\.css$/, loader: "style!css" };
	var sassLoader = { test: /\.scss$/, loader: "style!css!sass" };
	var appEntry = ["./src/client/application.js"];

	if (!isDebug) {
		plugins.push(new webpack.optimize.UglifyJsPlugin());
		plugins.push(new ExtractTextPlugin("[name].css"));

		cssLoader.loader = ExtractTextPlugin.extract("style", "css");
		sassLoader.loader = ExtractTextPlugin.extract("style", "css!sass");
	} else {
		plugins.push(new webpack.HotModuleReplacementPlugin());
		appEntry.splice(0, 0, "webpack-hot-middleware/client");
	}

	// WEBPACK CONFIG
	return {
		devtool: devTool,
		entry: {
			application: appEntry,
			vendor: vendorModules
		},
		output: {
			path: path.join(dirname, "public", "build"),
			filename: "[name].js",
			publicPath: "/build/"
		},
		resolve: {
			alias: {
				shared: path.join(dirname, "src", "shared")
			}
		},
		module: {
			loaders: [{ test: /\.js$/, loader: "babel", exclude: /node_modules/ }, { test: /\.(png|jpg|jpeg|gif|woff|ttf|eot|svg|woff2)/, loader: "url-loader?limit=1024" }, cssLoader, sassLoader]
		},
		plugins: plugins
	};
	// ---------------------
}

module.exports = createConfig(true);

/***/ },
/* 12 */
/***/ function(module, exports) {

module.exports = require("http");

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getJson$ = getJson$;

var _rxjs = __webpack_require__(0);

var _request = __webpack_require__(0);

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getJson$(url) {
	return new _rxjs.Observable(function (observer) {
		(0, _request2.default)(url, function (error, response, body) {
			if (error) {
				observer.error(error);
				return;
			}

			observer.next(JSON.parse(body));
			observer.complete();
		});
	});
}

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.MESSAGE_TYPES = undefined;
exports.validateSendMessage = validateSendMessage;

var _lodash = __webpack_require__(0);

var _lodash2 = _interopRequireDefault(_lodash);

var _validator = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MESSAGE_TYPES = exports.MESSAGE_TYPES = ["normal"];

function validateSendMessage(user, message, type) {
	var validator = new _validator.Validator();

	if (message.length > 50) {
		validator.error("Message must be smaller than 50 characters");
	}

	if (message.trim().length === 0) {
		validator.error("Message cannot be empty");
	}

	if (!_lodash2.default.includes(MESSAGE_TYPES, type)) {
		validator.error("Invalid message type " + type);
	}

	return validator;
}

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.USERNAME_REGEX = undefined;
exports.validateLogin = validateLogin;

var _validator = __webpack_require__(3);

var USERNAME_REGEX = exports.USERNAME_REGEX = /^[\w\d_-]+$/;

function validateLogin(username) {
	var validator = new _validator.Validator();

	if (username.length >= 20) {
		validator.error("Username must be fewer than 20 characters");
	}

	if (!USERNAME_REGEX.test(username)) {
		validator.error("Username can only contain numbers, digits, underscores and dashes");
	}

	return validator;
}

/***/ },
/* 16 */
/***/ function(module, exports) {

module.exports = require("fs");

/***/ },
/* 17 */
/***/ function(module, exports) {

module.exports = require("path");

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

__webpack_require__(0);

var _express = __webpack_require__(0);

var _express2 = _interopRequireDefault(_express);

var _http = __webpack_require__(12);

var _http2 = _interopRequireDefault(_http);

var _socket = __webpack_require__(0);

var _socket2 = _interopRequireDefault(_socket);

var _chalk = __webpack_require__(0);

var _chalk2 = _interopRequireDefault(_chalk);

var _rxjs = __webpack_require__(0);

__webpack_require__(10);

var _observableSocket = __webpack_require__(1);

var _file = __webpack_require__(8);

var _youtube = __webpack_require__(9);

var _users = __webpack_require__(7);

var _playlist = __webpack_require__(6);

var _chat = __webpack_require__(5);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var isDevelopment = process.env.NODE_ENV !== "production";

/*
 * ------------------------
 * Setup
 */
var app = (0, _express2.default)();
var server = new _http2.default.Server(app);
var io = (0, _socket2.default)(server);

/*
 * ------------------------
 * Client Webpack
 */
if (process.env.USE_WEBPACK === "true") {
	var webpackMiddleware = __webpack_require__(0),
	    webpackHotMiddlware = __webpack_require__(0),
	    webpack = __webpack_require__(0),
	    clientConfig = __webpack_require__(11);

	var compiler = webpack(clientConfig);
	app.use(webpackMiddleware(compiler, {
		publicPath: "/build/",
		stats: {
			colors: true,
			chunks: false,
			assets: false,
			timings: false,
			modules: false,
			hash: false,
			version: false
		}
	}));

	app.use(webpackHotMiddlware(compiler));
	console.log(_chalk2.default.bgRed("Using WebPack Dev Middleware! THIS IS FOR DEV ONLY!"));
}

/*
 * ------------------------
 * Configure Express
 */
app.set("view engine", "jade");
app.use(_express2.default.static("public"));

var useExternalStyles = !isDevelopment;
app.get("/", function (req, res) {
	res.render("index", {
		useExternalStyles: useExternalStyles
	});
});

/*
 * ------------------------
 * Services
 */
var videoServices = [new _youtube.YoutubeService("{fixme}")];
var playlistRepository = new _file.FileRepository("./data/playlist.json");

/*
 * ------------------------
 * Modules
 */
var users = new _users.UsersModule(io);
var chat = new _chat.ChatModule(io, users);
var playlist = new _playlist.PlaylistModule(io, users, playlistRepository, videoServices);
var modules = [users, chat, playlist];

/*
 * ------------------------
 * Socket
 */
io.on("connection", function (socket) {
	console.log("Got connection from " + socket.request.connection.remoteAddress);

	var client = new _observableSocket.ObservableSocket(socket);

	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = modules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var mod = _step.value;

			mod.registerClient(client);
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = modules[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var _mod = _step2.value;

			_mod.clientRegistered(client);
		}
	} catch (err) {
		_didIteratorError2 = true;
		_iteratorError2 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion2 && _iterator2.return) {
				_iterator2.return();
			}
		} finally {
			if (_didIteratorError2) {
				throw _iteratorError2;
			}
		}
	}
});

/*
 * ------------------------
 * Startup
 */
var port = process.env.PORT || 3000;

function startServer() {
	server.listen(port, function () {
		console.log("Started http server on " + port);
	});
}

_rxjs.Observable.merge.apply(_rxjs.Observable, _toConsumableArray(modules.map(function (m) {
	return m.init$();
}))).subscribe({
	complete: function complete() {
		startServer();
	},
	error: function error(_error) {
		console.error("COuld not init module: " + (_error.stack || _error));
	}
});

/***/ }
/******/ ]);
//# sourceMappingURL=server.js.map