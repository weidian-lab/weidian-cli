const childProcess = require('child_process')

exports.exec = (command) => {
  return new Promise((resolve, reject) => {
    const result = childProcess.exec(command)
    result.stdout.on('data', (data) => {
      console.log(data)
    })
    result.on('exit', (code) => {
      if (code) {
        reject(new Error('exit with ' + code + ' ' + command))
      } else {
        resolve()
      }
    })
  })
}
