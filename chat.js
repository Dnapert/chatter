import showdown from 'showdown'

let context = []

const modelSelect = document.querySelector('#model')
const contextSlider = document.querySelector('#context-length')
let contextLength = contextSlider.value
contextSlider.addEventListener('input', () => {
    contextLength = contextSlider.value

})

modelSelect.addEventListener('change', () => {
    context = []
}
)

const createResponseElement = (prompt, id) => {
    const response = document.createElement('div')
    response.classList.add('response')
    response.innerHTML = `
    <div id="bot">
    <pre class="log-prompt">${prompt}</pre>
    <div class="log-response" id="response-${id}"></div>
    </div>
    `
    return response
}


export const streamingChatRequest = async (data) => {

    const chat = document.querySelector('#chatlog')
    let tag = createResponseElement(data.prompt, data.id)
    chat.appendChild(tag) 
    const controller = new AbortController()
    const signal = controller.signal
    let abortButton = document.createElement('button')
    abortButton.innerHTML = 'Abort'
    document.getElementById(`response-${data.id}`).appendChild(abortButton)
    abortButton.onclick = () => {
        controller.abort()
        document.getElementById(`response-${data.id}`).removeChild(abortButton)
    }
    const response = await fetch('http://192.168.0.220:11434/api/generate', {
        method: 'POST',
        signal: signal,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'prompt': data.prompt,
            'model': data.model,
            'temperature': data.temperature,
            'stream': true,
            'context': context,
        }),
        timeout: 10000,
    }).catch((error) => {
        console.error(error)
        controller.abort()
    })

    const reader = response.body.getReader()
    let done = false
    while (!done) {
        const { value, done: isDone } = await reader.read()
        done = isDone
        if (value) {
            const text = JSON.parse(new TextDecoder().decode(value))
            const responseElement = document.getElementById(`response-${data.id}`)
            responseElement.insertAdjacentHTML('beforeend', text.response)
            if (text.context) {
                context = text.context
                const eval_count = text.eval_count
                const eval_duration = text.eval_duration
                const eval_speed = (eval_count / eval_duration ) * 10e9 
                document.getElementById('eval-speed').innerHTML = `Eval speed: ${eval_speed} tokens/s`
                document.getElementById('eval-count').innerHTML = `Eval count: ${eval_count}`
                document.getElementById('current-context-length').innerHTML = `Chat history: ${context.length} tokens`
                if (context.length > contextSlider.value) {
                    //slice the front of the array
                    context = context.slice(context.length - contextSlider.value)
                }
                console.log(context.length)
            }
        }
    }
    const converter = new showdown.Converter()
    let string = document.getElementById(`response-${data.id}`).innerHTML
    let html = converter.makeHtml(string)
    document.getElementById(`response-${data.id}`).innerHTML = html
    try {
        document.getElementById(`response-${data.id}`).removeChild(abortButton)
     
    }
    catch (e) {
        console.log(e)
    }
}


export const singleChatRequest = async (data) => {
    const chat = document.querySelector('#chatlog')
    let tag = createResponseElement(data.prompt, data.id)
    const parser = new DOMParser()
    const doc = parser.parseFromString(tag.outerHTML, 'text/html')
    chat.appendChild(doc.body.firstChild)
    const response = await fetch('http://192.168.0.220:11434/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify({
            'model': data.model,
            'temperature': data.temperature,
            'stream': false,
            'messages': [{
                'content': data.prompt,
                'role': 'user'
            }]
        })
    })
    const converter = new showdown.Converter()
    const text = await response.json()
    let string = text.message.content
    let html = converter.makeHtml(string)
    document.getElementById(`response-${data.id}`).innerHTML = html

}