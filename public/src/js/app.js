var defferedPromt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/service-worker.js')
        .then(function() {
            console.log("Service worker is registered!");
        })
        .catch(function(error) {
            console.log(error);
        });
        // .register('/sw.js', {scope: '/help/'})
}

window.addEventListener('beforeinstallpromt', function(event) {
    console.log("beforeinstallpromt fired");
    event.preventDefault();
    defferedPromt = event;
    return false;
});

function displayConfirmNotification() {
    if ('serviceWorker' in navigator) {
        var options = {
            body: 'You successfuly subscribed to our Notification service!',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US',
            vibrate: [100, 50, 200],
            badge: '/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
                { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
            ]
        };

        navigator.serviceWorker.ready
            .then(function(swreg) {
                swreg.showNotification('Successfully subscribed!', options);
            });
    }
}

function configurePushSub() {
    if(!('serviceWorker' in navigator)) {
        return;
    }

    var reg;
    navigator.serviceWorker.ready
        .then(function(swreg) {
            reg = swreg;
            return swreg.pushManager.getSubscription();
        })
        .then(function(sub) {
            if(sub === null) {
                var vapidPublicKey = 'BC7R2-aam1OmEIp3DPAkcn3HIXjDxB4S4sluw8wf0wA6GVRhEcdVy2NZriWUnhr8L7OVVI_ZQcSnnTsjwTGXlf4';
                var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey) ;
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
            } else {

            }
        })
        .then(function(newSub) {
            return fetch('https://pwagram-7fdad.firebaseio.com/subscriptions.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSub)
            });
        });
}

function askForNotificationPermission() {
    Notification.requestPermission(function(result) {
        console.log('User Choice', result);
        if(result !== 'granted') {
            console.log('No notification permission granted!');
        } else {
            configurePushSub();
            // displayConfirmNotification();
        }
    })
    .then(function(res) {
        if(res.ok) {
            displayConfirmNotification();
        }
    })
    .catch(function(err) {
        console.log(err);
    });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
    for(var i = 0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = 'inline-block';
        enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission)
    }
}

// var xhr = new XMLHttpRequest();
// xhr.open('GET', 'https://zavaliy.com');
// xhr.responseType = 'json';

// xhr.onload = function() {
//     console.log(xhr.response);
// }

// xhr.onerror = function() {
//     console.log('Error!');
// }

// xhr.send();

// fetch('https://zavaliy.com')
//     .then(function(response) {
//         console.log(response);
//         return response.json();
//     }).then(function(data) {
//         console.log(data);
//     }).catch(function(error) {
//         console.log(error);
//     });

// fetch('https://zavaliy.com', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//     },
//     mode: 'cors',
//     body: JSON.stringify({
//         message: 'Does this work?'
//     })
// })
//     .then(function(response) {
//         console.log(response);
//         return response.json();
//     }).then(function(data) {
//         console.log(data);
//     }).catch(function(error) {
//         console.log(error);
//     });

// var promise = new Promise(function(resolve, reject) {
//     setTimeout(function() {
//         resolve('This is executed once the timer is done!');
//         // reject('error');
//     }, 3000);
// });

// promise.then(function(text) {
//     console.log(text);
//     return text;
// }, function(error) {
//     console.log(text);
// }).then(function(newText) {
//     console.log(newText);
// }).catch(function(error) {
//     console.log(error);
// });