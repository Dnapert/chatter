import './style.css'
import { streamingChatRequest,singleChatRequest } from './chat.js'

let responseId = 0
const button = document.querySelector('#chat')
const promptarea = document.querySelector('#prompt')
const toggle = document.querySelector('#toggle-console')
toggle.addEventListener('click', () => {
  const console = document.querySelector('#console')
  if (console.style.display === 'none') {
    console.style.display = 'flex'
  } else {
    console.style.display = 'none'
  }
})


button.addEventListener('click', async () => {
  const data = getData()
  if (data.prompt === '') {
    return
  }
  promptarea.value = ''
  promptarea.selectionStart = 0
  button.disabled = true
  streamingChatRequest(data)
  //singleChatRequest(data)
  setTimeout(() => {
    button.disabled = false
  }, 1000)
  console.log(data)
})

promptarea.addEventListener('keypress', async (event) => {
if (event.keyCode === 13 && !event.shiftKey) {
    button.click()
  }

}
)

const getData = () => {
  responseId += 1
  const data = {
    prompt: promptarea.value,
    model: document.querySelector('#model').value,
    temperature: document.querySelector('#temperature').value / 100,
    id: responseId,
  }
 return data
}