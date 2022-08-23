const API_KEY =
  "380ec498044c900f249ad39326e8320a2cb4ee09b94afe4dff6911e37ef56bfc";

const tickersHandlers = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
let BTCPrice = 0;

const AGGREGATE_INDEX = "5";
const INVALID_PARAMETER_TYPE = "500";
const INVALID_SUB = "INVALID_SUB";
const BTC_SYMBOL = "BTC";

socket.addEventListener("open", () => {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~BTC~USD`]
  });
});

socket.addEventListener("message", e => {
  const { TYPE: type, MESSAGE: message, PARAMETER: parameter, FROMSYMBOL: currency, TOSYMBOL: toSymbol, PRICE: newPrice } = JSON.parse(
    e.data
  );

  if (type === INVALID_PARAMETER_TYPE && message === INVALID_SUB) {
    handleSubscriptionPriceCors(parameter);
    return
  }

  if (currency === BTC_SYMBOL) {
    BTCPrice = newPrice
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  if (toSymbol === BTC_SYMBOL) {
    const multiCorsPrice = newPrice * BTCPrice;
    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(multiCorsPrice));
    return
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach(fn => fn(newPrice));
});

function handleSubscriptionPriceCors (parameter) {
  const splitParameters = parameter.split('~');

  const fromSymbol = splitParameters[2]
  const toSymbol = splitParameters[3]

  if (toSymbol === BTC_SYMBOL) {
    const handlers = tickersHandlers.get(fromSymbol) ?? [];
    handlers.forEach(fn => fn(-1));
    return
  }

  unsubscribeFromUSDTickerOnWs(fromSymbol);
  subscribeToBTCTickerOnWs(fromSymbol);
}

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToUSDTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

function subscribeToBTCTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~BTC`]
  });
}

function unsubscribeFromUSDTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

function unsubscribeFromBTCTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~BTC`]
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToUSDTickerOnWs(ticker);
};

export const unsubscribeFromTicker = ticker => {
  tickersHandlers.delete(ticker);
  if (ticker === BTC_SYMBOL) {
    return
  }
  unsubscribeFromUSDTickerOnWs(ticker);
  unsubscribeFromBTCTickerOnWs(ticker)
};
