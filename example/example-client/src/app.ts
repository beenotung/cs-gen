import { GetValue, SetKV, startAPI, SubscribeByKey } from './domain/api'

startAPI({ mode: 'local' })

function reportResult(p: Promise<any>) {
  p.then(res => {
    document.querySelector('#result')!.textContent =
      'result: ' + JSON.stringify(res, null, 2)
  }).catch(err => {
    document.querySelector('#result')!.textContent =
      'error: ' + JSON.stringify(err, null, 2)
  })
}

document.querySelector('input#SetKV')!.addEventListener('click', () => {
  const p = SetKV({
    Key: (document.querySelector('#key')! as HTMLInputElement).value,
    Value: (document.querySelector('#value')! as HTMLInputElement).value,
  })
  reportResult(p)
})

document.querySelector('input#GetValue')!.addEventListener('click', () => {
  const p = GetValue({
    Key: (document.querySelector('#key')! as HTMLInputElement).value,
  })
  reportResult(p)
})

document
  .querySelector('input#SubscribeByKey')!
  .addEventListener('click', () => {
    const Key = (document.querySelector('#key')! as HTMLInputElement).value
    const sub = SubscribeByKey(
      { Key },
      {
        onEach: Out => {
          valueTd.textContent = JSON.stringify(Out)
          timestampTd.textContent = new Date().toLocaleString()
        },
        onError: err => {
          valueTd.textContent = JSON.stringify(err)
          timestampTd.textContent = new Date().toLocaleString()
        },
        onReady: () => {
          valueTd.textContent = '(waiting for update)'
        },
      },
    )
    const table = document.querySelector('table#subs') as HTMLTableElement
    const tr = table.tBodies.item(0)!.insertRow()
    tr.insertCell().textContent = Key
    const valueTd = tr.insertCell()
    const timestampTd = tr.insertCell()
    const cancelButton = document.createElement('button')
    cancelButton.textContent = 'Cancel'
    cancelButton.onclick = () => {
      sub.cancel()
      tr.remove()
    }
    tr.insertCell().appendChild(cancelButton)
  })
