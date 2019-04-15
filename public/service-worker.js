importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.2.0/workbox-sw.js");

workbox.router.registerRouter(/.*(?:googleapis|gstatic)\.com.*$/, workboxSW.strategies
.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpiration: {
        maxEntries: 3,
        maxAgeSeconds: 60 * 60 * 24 * 30
    }
}));

workbox.router.registerRouter('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', 
workboxSW.strategies
.staleWhileRevalidate({
    cacheName: 'material-css'
}));

workbox.router.registerRouter(/.*(?:firebasestorage\.googleapis)\.com.*$/, workboxSW.strategies
.staleWhileRevalidate({
    cacheName: 'post-images'
}));

workbox.router.registerRouter('https://pwagram-7fdad.firebaseio.com/posts.json', function(args) {
    return fetch(args.event.request)
    .then(function(res) {
        var clonedRes = res.clone();
        clearAllData('posts')
            .then(function() {
                return clonedRes.json()
            })
            .then(function(data) {
                for (var key in data) {
                    writeData('posts', data[key]);
                }
            });
        return res;
    });
});

workbox.router.registerRouter(function (routeData) {
    return (routeData.event.request.headers.get('accept').includes('text/html'));
}, function(args) {
    return  caches.match(args.event.request)
    .then(function(response) {
        if(response) {
            return response;
        } else {
            return fetch(args.event.request)
                .then(function(res){
                    return caches.open('dynamic')
                        .then(function(cache) {
                            cache.put(event.request.url, res.clone())
                            return res;
                        })
                })
                .catch(function(err) {
                    return caches.match('/offline.html')
                        .then(function(res) {
                            return res;
                        });
                });
        }
    })
});

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "753d1943486ba00fff8603a405b84726"
  },
  {
    "url": "manifest.json",
    "revision": "76d3b2444579d5c3bd421eaffc4609d7"
  },
  {
    "url": "offline.html",
    "revision": "c176622db671562a47694b2b343cebc5"
  },
  {
    "url": "src/css/app.css",
    "revision": "314211dd7ea490ae64d4acc2e8a5506a"
  },
  {
    "url": "src/css/feed.css",
    "revision": "fd296d7110a2e0a55036cb0daf27d2b8"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "0565059f9c1a15def69b7990278aa5d8"
  },
  {
    "url": "src/js/feed.js",
    "revision": "d344d9e5518ec9d1113fc9d88ba29021"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/utility.js",
    "revision": "216967aae6feb3ad58c734de862e91e3"
  },
  {
    "url": "sw-base.js",
    "revision": "5d56bb50fa21c1db296f58989c41dc12"
  },
  {
    "url": "sw.js",
    "revision": "f86480ea8c687304d5e4b70acda83471"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
], {});