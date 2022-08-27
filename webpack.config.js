// const WorkerPlugin = require('worker-plugin')

module.exports = {
  plugins: [
    {
      rules: [
        {
          test: /\.worker\.js$/i,
          loader: "worker-loader",
          options: {
            worker: {
              type: "SharedWorker",
              options: {
                type: "classic",
                credentials: "omit",
                name: "my-custom-worker-name",
              },
            },
          },
        },
      ],
    },
    // new WorkerPlugin()
  ]
};
