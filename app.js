
/**
 * Module dependencies.
 */

var express    = require('express');
var http       = require('http');
var path       = require('path');
var handlebars = require('express3-handlebars');


//Define all views\webpages
var index   = require('./routes/index');
var scientist = require('./routes/scientist');
var citizen = require('./routes/citizen');
var map = require('./routes/map');
var login = require('./routes/login');
var help = require('./routes/help');
var about = require('./routes/about');

//Define the app
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('Intro HCI secret key'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Add routes here
app.get('/', login.view);
app.get('/scientist', scientist.view);
app.get('/citizen', citizen.view);
app.get('/map', map.view);
app.get('/index', index.view);
app.get('/about', about.view);
app.get('/help', help.view);

//app.get('/science/:role', science.view);
// Example route
// app.get('/users', user.list);

//Server requirements
require('node-easel');
var util       = require('util'),
    //io         = require('socket.io'),
    Player     = require('./public/js/Classes.js').Player,
    server     = http.createServer(app),
    io         = require('socket.io').listen(server);
    gameport   = 8080;
    server.listen(gameport);

/* Game server code */
var players;

    function init() {
      players = [];
      setEventHandlers();
    };

    var setEventHandlers = function() {
      io.sockets.on("connection", onSocketConnection);
    }


    function onSocketConnection(client){
      util.log("Server :: New player has connected : "+client.id);
      client.on("disconnect", onClientDisconnect);
      client.on("new player", onNewPlayer);
      client.on("move player", onMovePlayer);
    }

    function onClientDisconnect(){
      var removePlayer = playerById(this.id);

      if(!removePlayer) {
         util.log("Player not found: "+this.id);
         return;
      };
      util.log("Server :: player has disconnected : "+this.id);

      //Remove player from players array
      players.splice(players.indexOf(removePlayer), 1);

      //Broadcast removed player
      this.broadcast.emit("disconnect", { id: removePlayer.id, 
                                           x: removePlayer.getPos().x, 
                                           y: removePlayer.getPos().y });

    }

    function onNewPlayer(data){

      console.log("Server :: New player id: "+this.id);
      var newPlayer = new Player({x: data.x, y: data.y});
      console.log("Server :: location: ( "+newPlayer.getPos().x+", "+data.y+")");
      newPlayer.id = this.id;

      //update all clients but current
      this.broadcast.emit("new player", { id: newPlayer.id, 
                                          x: newPlayer.getPos().x, 
                                          y: newPlayer.getPos().y });
      var i, existingPlayer;
      for (i = 0; i < players.length; i++) {
         existingPlayer = players[i];

         //Add existingPlayer to new client
         this.emit("new player", { id: existingPlayer.id,
                                    x: existingPlayer.getPos().x,
                                    y: existingPlayer.getPos().y });
      };

      //Add new player to list of added players
      players.push(newPlayer);
    }


    function onMovePlayer(data){

       var movePlayer = playerById(this.id);
       if(!movePlayer) {
            util.log("Player not found: "+this.id);
            return;
       };
       movePlayer.setPos({x: data.x, y: data.y});

       this.broadcast.emit("move player", { id: this.id, 
                                             x: movePlayer.getPos().x, 
                                             y: movePlayer.getPos().y });

    }

    init();
    // Multiplayer Helper Functions 
    function playerById(id){
        var i ;
        for( i = 0; i < players.length; i++) {
           if(players[i].id == id)
                 return players[i];
        };
     
        return false;
     }
