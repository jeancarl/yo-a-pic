// Filename: server.js
// API key for Yo user.
var apiKey = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';

// The URL for instructions on how to use.
var welcomeLink = 'http://XXX.XX.XX.XXX:8080/index.html';

// Mongo DB server address.
var mongooseServerAddress = 'mongodb://127.0.0.1:27017/test';

// What port to listen to.
var port = 8080;

/*********** End Configuration ***********/

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var querystring = require('querystring');
var url = require('url');
var request = require('request');

app.use(bodyParser.json());
app.listen(port);

console.log("App listening on port "+port);

mongoose.connect(mongooseServerAddress);

var PictureSchema = new mongoose.Schema({
    username: String,
    photo: String,
});

PictureSchema.statics.random = function(cb) {
  this.count(function(err, count) {
    if(err) 
        return cb(err);

    var rand = Math.floor(Math.random() * count);
    this.findOne().skip(rand).exec(cb);
  }.bind(this));
};

var Picture = mongoose.model('Charlie', PictureSchema);

function sendYo(yo)
{
    // Uncomment if you receive a self-signed certificate in chain error.
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    request(
        {
            url: 'https://api.justyo.co/yo/',
            qs: yo,
            method: 'POST',
        },
        function(error, response, body) {
            if(error || response.statusCode != 200) {
                console.log('Unable to send a Yo!');
            }
        }                
    );
}

// Callback handler for Yo service.
app.get('/yo/callback', function(req, res) {
    var query = url.parse(req.url, true).query;

    if('link' in query) {
        var pic = {
            photo: query.link,
            username: query.username
        };

    	Picture.create(pic, function(err, pic) {
            if(err)
            {
                console.log('Unable to add picture to database');
                return;
            }
        });
    } else {
        // Mirror, mirror, on the wall, pick a random picture please!
        Picture.random(function(err, pic) {
            if(err) {
                console.log('Unable to get picture from database');
                return; // We'll ignore an error or no picture.
            }

            // If there is no picture to send back, send the 
            // instructions so we can get a picture in the system!
            if(!pic) {
                sendYo({
                    username: query.username, 
                    api_token: apiKey, 
                    link: welcomeLink
                });    

                return;        
            }
    
            // Send the link to the picture.
            sendYo({
                username: query.username, 
                api_token: apiKey, 
                link: pic.photo
            });
        });
    }
});

app.use(express.static(__dirname + '/public'));