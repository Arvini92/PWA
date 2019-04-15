
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v2';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/idb.js',
    '/src/js/utility.js',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', function(event) {
    console.log('Installing service worker...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function(cache) {
                console.log('Preecashing App Shell');
                cache.addAll(STATIC_FILES);
                // cache.add('/');
            })
    );
});

self.addEventListener('activate', function(event) {
    console.log('Activating service worker...', event);
    event.waitUntil(
        caches.keys()
            .then(function(keyList) {
                return Promise.all(keyList.map(function(key){
                    if(key) {
                        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                            console.log('Service worker removing old cashe.', key);
                            return caches.delete(key);
                        }
                    }
                }));
            })
    );
    return self.clients.claim();
});

// self.addEventListener('fetch', function(event) {
//     console.log('Fetching something...', event);
//     event.respondWith(
//         caches.match(event.request)
//             .then(function(response) {
//                 if(response) {
//                     return response;
//                 } else {
//                     return fetch(event.request)
//                         .then(function(res){
//                             return caches.open(CACHE_DYNAMIC_NAME)
//                                 .then(function(cache) {
//                                     // cache.put(event.request.url, res.clone())
//                                     return res;
//                                 })
//                         })
//                         .catch(function(err) {
//                             return caches.open(CACHE_STATIC_NAME)
//                                 .then(function(cache) {
//                                     return cache.match('/offline.html');
//                                 });
//                         });
//                 }
//             })
            
//         // fetch(event.request)
//     );
// });

function trimCache(cacheName, maxItems) {
    caches.open(cacheName)
        .then(function(cache) {
            return cache.keys()
                .then(function(keys) {
                    if (keys.length > maxItems) {
                        cache.delete(keys[0])
                            .then(trimCache(cacheName, maxItems));
                    }
                })
        })
}

function isInArray(string, array) {
    for (var i = 0; 1 < array.length; i++) {
        if (array[i] === string) {
            return true;
        }
    }
    return false;
}

self.addEventListener('fetch', function(event) {
    console.log('Fetching something...', event);
    var url = 'https://pwagram-7fdad.firebaseio.com/posts';
    if(event.request.url.indexOf(url) > -1) {
        event.respondWith(fetch(event.request)
            .then(function(res) {
                var clonedRes = res.clone();
                clearAllData('posts')
                    .then(function() {
                        return clonedRes.json()
                    })
                    .then(function(data) {
                        for (var key in data) {
                            writeData('posts', data[key]);
                                // .then(function() {
                                //     deleteItemFromData('posts', key);
                                // });
                        }
                    });
                return res;
            })
        );
       
    } else if (isInArray(event.request.url, STATIC_FILES)) {
        event.respondWith(
            caches.match(event.request)  
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    if(response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(function(res){
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function(cache) {
                                        // trimCache(CACHE_DYNAMIC_NAME, 3);
                                        cache.put(event.request.url, res.clone())
                                        return res;
                                    })
                            })
                            .catch(function(err) {
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function(cache) {
                                        if (event.request.headers.get('accept').includes('text/html')) {
                                            return cache.match('/offline.html');
                                        }  
                                    });
                            });
                    }
                })
        );
        
    }
   
});

// self.addEventListener('fetch', function(event) {
//     console.log('Fetching something...', event);
//     event.respondWith(
//         caches.match(event.request)  
//     );
// });


// self.addEventListener('fetch', function(event) {
//     console.log('Fetching something...', event);
//     event.respondWith(
//         fetch(event.request)  
//     );
// });

// self.addEventListener('fetch', function(event) {
//     console.log('Fetching something...', event);
//     event.respondWith(
//         fetch(event.request)
//         .then(function(res){
//             return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                     cache.put(event.request.url, res.clone())
//                     return res;
//                 })
//             })
//             .catch(function(err) {
//                 return caches.match(event.request);
//             })
            
//         // fetch(event.request)
//     );
// });

self.addEventListener('sync', function(event) {
    console.log('[Service Worker] Background syncing', event);
    if (event.tag === 'sync-new-posts') {
        console.log('[Service Worker] Syncing new Posts');
        event.waitUntill(
            readAllData('sync-posts')
                .then(function(data) {
                    for (var dt of data) {
                        var postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('rawLocationLat', dt.rawLocation.lat);
                        postData.append('rawLocationLng', dt.rawLocation.lng);
                        postData.append('file', dt.picture, dt.id + '.png');

                        fetch('https://us-central1-pwagram-7fdad.cloudfunctions.net/storePostData ', {
                            method: 'POST',
                            body: postData
                        })
                        .then(function(res) {
                            console.log('Send data', res);
                            if (res.ok) {
                                res.json()
                                    .then(function(resData) {
                                        deleteItemFromData('sync-posts', resData.id);
                                    });
                                
                            }
                        })
                        .catch(function(err) {
                            console.log('Error while sending data', err);
                        });
                    }
                })
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    var notification = event.notification;
    var action = event.action;

    console.log(notification);

    if(action === 'confirm') {
        console.log('Confirm was chosen');
        notification.close();
    } else {
        console.log(action);
        event.waitUntil(
            clients.matchAll()
            .then(function(clis) {
                var client = clis.find(function(c) {
                    return c.visibilityState === 'visible';
                });

                if (client !== undefined) {
                    client.navigate(notification.data.url);
                    client.focus();
                } else {
                    clients.openWindow(notification.data.url)
                }
                notification.close();
            })
        );
    }
});

self.addEventListener('notificationclose', function(event) {
    console.log('Notification was closed', event);
});

self.addEventListener('push', function(event) {
    console.log('Push Notification recived', event);

    var data = {title: 'New!', content: 'Something new happened!', openUrl: '/'};

    if(event.data) {
        data = JSON.parse(event.data.text());
    }

    var options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.openUrl
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});