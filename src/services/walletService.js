import api from './api'

async function getWallet() {
  const response = await api.get('/wallet')
  return response.data.data
}

async function addWalletFunds(payload, idempotencyKey) {
  const response = await api.post('/wallet/deposits', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return response.data.data
}

async function withdrawWalletFunds(payload, idempotencyKey) {
  const response = await api.post('/wallet/withdrawals', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return response.data.data
}

async function getTransactions(params = {}) {
  const response = await api.get('/wallet/transactions', { params })
  return response.data.data
}

async function getTransactionReceipt(transactionId) {
  const response = await api.get(`/wallet/transactions/${transactionId}/receipt`)
  return response.data.data
}

export {
  addWalletFunds,
  getTransactionReceipt,
  getTransactions,
  getWallet,
  withdrawWalletFunds,
}
