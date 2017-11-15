import "source-map-support/register"
const express = require("express"),
	http = require("http"),
 	socketIo = require("socket.io"),
 	chalk = require("chalk"),
 	{Observable} =  require("rxjs")

import "shared/operators"
 {ObservableSocket} require("shared/observable-socket"),

 {FileRepository} = require("./repositories/file"),
 {YoutubeService} = require("./services/youtube"),

 {UsersModule} = require("./modules/users"),
 {PlaylistModule} = require("./modules/playlist"),
 {ChatModule} = require ("./modules/chat")

const isDevelopment = process.env.NODE_ENV !== "production"

// Setup
const app = express()
const server = new http.Server(app)
const io = socketIo(server)
// Client Webpack
if (process.env.USE_WEBPACK === "true") {
	const webpackMiddleware = require("webpack-dev-middleware"),
		webpackHotMiddlware = require("webpack-hot-middleware"),
		webpack = require("webpack"),
		clientConfig = require("../../webpack.client")

	const compiler = webpack(clientConfig)
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
	}))

	app.use(webpackHotMiddlware(compiler))
	console.log(chalk.bgRed("Using WebPack Dev Middleware! THIS IS FOR DEV ONLY!"))
}

// Configure Express
app.set("view engine", "jade")
app.use(express.static("public"))

const useExternalStyles = !isDevelopment
app.get("/", (req, res) => {
	res.render("index", {
		useExternalStyles
	})
})
// Services
const videoServices = [new YoutubeService("{fixme}")]
const playlistRepository = new FileRepository("./data/playlist.json")


// Modules
const users = new UsersModule(io)
const chat = new ChatModule(io, users)
const playlist = new PlaylistModule(io, users, playlistRepository, videoServices)
const modules = [
	users,
	chat,
	playlist
]

// Socket
io.on("connection", socket => {
	console.log(`Got connection from ${socket.request.connection.remoteAddress}`)

	const client = new ObservableSocket(socket)

	for (const mod of modules) {
		mod.registerClient(client)
	}
	for (const mod of modules) {
		mod.clientRegistered(client)
	}
})

// Startup
const port = process.env.PORT || 3000

function startServer() {
	server.listen(port, () => {
		console.log(`Started http server on ${port}`)
	})
}

Observable.merge(...modules.map(m => m.init$()))
	.subscribe({
		complete() {
			startServer()
		},

		error(error) {
			console.error(`COuld not init module: ${error.stack || error}`)
		}
	})
