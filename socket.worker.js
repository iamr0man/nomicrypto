let browserInstances = [];

self.addEventListener('onconnect', function (e) {
  console.log('worker got, ', e);

  const port = e.ports[0];
  browserInstances.push(port);

  port.onmessage = function(event) {
    console.log('worker got, ', event);
    self.postMessage(event.data.toUpperCase())
  }
});

// function postMessage(message) {
//   browserInstances.map(instance => {
//     instance.postMessage(message);
//   });
// }
