import {
  STACKS_API_URL,
} from './config.js'

export async function processing(tx, count = 0) {
  console.log("processing", tx, count)
  var result = await fetch(
    `${STACKS_API_URL}/extended/v1/tx/${tx}`
  )
  var value = await result.json()
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`)
    // console.log(value)
    return true
  }
  // if (value.tx_status === "pending") {
  //   console.log("pending" /*, value*/)
  // }
  if (count > 10) {
    console.log("failed after 2 attempts", value)
    return false
  }

  await timeout(30000)
  return processing(tx, count + 1)
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
