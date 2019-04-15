const functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webpuch = require('web-push');
var formidable = require('formidable');
var fs = require('fs');
var UUID = require('uuid-v4');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pwagram.json");

var gconfig = {
    progectId: 'pwagram-7fdad',
    keyFilename: 'pwagram.json'
}

var gcs = require('@google-cloud/storage')(gconfig);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-7fdad.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, function() {
        var uuid = UUID();
        var formData = new formidable.IncomingForm();
        formData.parse(request, function(err, fields, files) {
            fs.rename(files.file.path, '/tmp/' + files.file.name);
            var bucket = gsc.bucket('pwagram-7fdad.appspot.com');

            bucket.upload('/tmp/' + files.file.name, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: files.file.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            }, function(err, file) {
                if(!err) {
                    admin.database().ref('posts').push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        rawLocation: {
                            lat: fields.rawLocationLat,
                            lng: fields.rawLocationLng,
                        },
                        image: 'https://firebasestorage.googleapis.com/v0/b/' 
                            + bucket.name + '/o/' + encodeURIComponent(file.name)
                            + '?alt=media&token=' + uuid
                    })
                    .then(function() {
                        webpuch.setVapidDetails(
                            'mailto:******@gmail.com', 
                            'BC7R2-aam1OmEIp3DPAkcn3HIXjDxB4S4sluw8wf0wA6GVRhEcdVy2NZriWUnhr8L7OVVI_ZQcSnnTsjwTGXlf4', 
                            '8CuDq600dy5H75_vprVQ12x0LLOgkM6bRiL7_1OrIIU'
                        );
                        return admin.database().ref('subscriptions').once('value');
                    })
                    .then(function(subscriptions) {
                        subscriptions.forEach(function(sub) {
                            var pushConfig = {
                                endpoint: sub.val().endpoint,
                                keys: {
                                    auth: sub.val().keys.auth,
                                    p256dh: sub.val().keys.p256dh
                                }
                            };
            
                            webpush.sendNotification(pushConfig, JSON.stringify({
                                title: 'New Post', 
                                content: 'New Post added!',
                                openUrl: '/help'
                            }))
                                .catch(function(err) {
                                    console.log(err);
                                });
                        });
                        response.status(201).json({message: 'Data stored', id: fields.id});
                    })
                    .catch(function(err) {
                        response.status(500).json({error: err});
                    });
                } else {
                    console.log(err);
                }
            });
        });
    });
});

