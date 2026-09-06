'use strict'

// Cookies (1.20.5+) are keyed by resource location and answered from one map in every
// state, like the vanilla client's serverCookies; `cookie_request` and `cookie_response`
// only exist in the login, configuration and play states of versions that have cookies,
// so the listeners never fire (nor write) elsewhere.
module.exports = function (client, options) {
  client._cookies = new Map(options.cookies instanceof Map ? options.cookies : Object.entries(options.cookies ?? {}))

  client.on('store_cookie', (packet) => {
    client._cookies.set(packet.key, packet.value)
  })

  client.on('cookie_request', (packet) => {
    let value = client._cookies.get(packet.cookie)
    if (value === undefined && !cookieValueIsOptional(client.version)) {
      // An absent option and an empty ByteArray both serialize as a single 0x00 byte, so
      // this reply is wire-identical to vanilla's null where minecraft-data (1.21.8)
      // declares the value without the option wrapper
      value = Buffer.alloc(0)
    }
    client.write('cookie_response', { key: packet.cookie, value })
  })
}

function cookieValueIsOptional (version) {
  const type = require('minecraft-data')(version).protocol.types.packet_common_cookie_response
  return type[1].find(field => field.name === 'value').type[0] === 'option'
}
