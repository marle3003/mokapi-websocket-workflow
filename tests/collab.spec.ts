import { test, expect, type Page } from '@playwright/test'

async function joinAs(page: Page, docId: string, name: string) {
  await page.goto('/')
  await page.getByTestId('docid-input').fill(docId)
  await page.getByTestId('userid-input').fill(name)
  await page.getByTestId('join-button').click()
  await expect(page.getByTestId('status')).toContainText('Connected', { timeout: 5000 })
}

function uniqueDocId(label: string) {
  return `${label}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

test('a client joining later immediately sees existing content', async ({ browser }) => {
  const docId = uniqueDocId('late-join')

  const alice = await (await browser.newContext()).newPage()
  const bob = await (await browser.newContext()).newPage()

  await joinAs(alice, docId, 'alice')
  await alice.getByTestId('editor').fill('Hello from Alice')
  // wait for the round trip so the server has actually applied it
  await expect(alice.getByTestId('version')).toContainText('version 1', { timeout: 5000 })

  await joinAs(bob, docId, 'bob')

  await expect(bob.getByTestId('editor')).toHaveValue('Hello from Alice')
  await expect(bob.getByTestId('users')).toContainText('alice')
  await expect(bob.getByTestId('users')).toContainText('bob')
})

test('edits from one client sync live to another connected client', async ({ browser }) => {
  const docId = uniqueDocId('live-sync')

  const alice = await (await browser.newContext()).newPage()
  const bob = await (await browser.newContext()).newPage()

  await joinAs(alice, docId, 'alice')
  await joinAs(bob, docId, 'bob')

  await alice.getByTestId('editor').fill('sync test')

  await expect(bob.getByTestId('editor')).toHaveValue('sync test', { timeout: 5000 })
})

test('a stale patch is rejected instead of corrupting the document', async ({ page }) => {
  const docId = uniqueDocId('conflict')

  await joinAs(page, docId, 'alice')
  await page.getByTestId('editor').fill('original content')
  await expect(page.getByTestId('version')).toContainText('version 1', { timeout: 5000 })

  const versionBefore = await page.getByTestId('version').textContent()

  await page.getByTestId('conflict-button').click()
  // give the round trip a moment, then confirm nothing changed
  await page.waitForTimeout(700)

  await expect(page.getByTestId('version')).toHaveText(versionBefore!)
  await expect(page.getByTestId('editor')).toHaveValue('original content')
})

test('a client that disconnects and reconnects catches up on missed edits', async ({ browser }) => {
  const docId = uniqueDocId('reconnect')

  const alice = await (await browser.newContext()).newPage()
  const bob = await (await browser.newContext()).newPage()

  await joinAs(alice, docId, 'alice')
  await joinAs(bob, docId, 'bob')

  await alice.getByTestId('editor').fill('first')
  await expect(bob.getByTestId('editor')).toHaveValue('first', { timeout: 5000 })

  await alice.getByTestId('disconnect-button').click()
  await expect(alice.getByTestId('status')).toContainText('Disconnected')

  await bob.getByTestId('editor').fill('first second')
  await expect(bob.getByTestId('version')).toContainText('version 2', { timeout: 5000 })

  await alice.getByTestId('reconnect-button').click()
  await expect(alice.getByTestId('status')).toContainText('Connected', { timeout: 5000 })

  await expect(alice.getByTestId('editor')).toHaveValue('first second')
})