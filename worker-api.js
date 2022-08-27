import SharedWorker from 'worker-loader!./socket.worker'

const worker = new SharedWorker()

export function sendMessage(msg){
  worker.postMessage(msg)
}
