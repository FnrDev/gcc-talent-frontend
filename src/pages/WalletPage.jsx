import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import {
  addWalletFunds,
  getTransactions,
  getWallet,
  withdrawWalletFunds,
} from '@/services/walletService'

const MONEY_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const DATE_FORMATTER = new Intl.DateTimeFormat('en-BH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const TRANSACTION_LABELS = {
  deposit: 'Deposit',
  escrow_fund: 'Milestone funding',
  escrow_release: 'Escrow release',
  escrow_refund: 'Escrow refund',
  platform_fee: 'Platform fee',
  withdrawal: 'Withdrawal',
}

function randomKey() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function amount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? MONEY_FORMATTER.format(parsed) : '—'
}

function requestError(error, fallback) {
  return error?.response?.data?.message || fallback
}

function attemptKey(attemptRef, signature) {
  if (!attemptRef.current || attemptRef.current.signature !== signature) {
    attemptRef.current = { signature, key: randomKey() }
  }
  return attemptRef.current.key
}

function WalletPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState(null)
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deposit, setDeposit] = useState({
    amount: '',
    cardholderName: '',
    cardNumber: '4242 4242 4242 4242',
    expiryMonth: '12',
    expiryYear: String(new Date().getFullYear() + 2),
    cvc: '123',
  })
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const depositAttempt = useRef(null)
  const withdrawalAttempt = useRef(null)

  const loadWallet = useCallback(async () => {
    const data = await getWallet()
    setWallet(data.wallet)
  }, [])

  const loadTransactions = useCallback(async () => {
    const data = await getTransactions({ page, limit: 12, ...(type ? { type } : {}) })
    setTransactions(data.transactions || [])
    setPagination(data.pagination)
  }, [page, type])

  const loadAll = useCallback(async () => {
    setError('')
    try {
      await Promise.all([loadWallet(), loadTransactions()])
    } catch (loadError) {
      setError(requestError(loadError, 'We could not load your wallet.'))
    } finally {
      setLoading(false)
    }
  }, [loadTransactions, loadWallet])

  useEffect(() => {
    // The external API responses initialize this route's wallet state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll()
  }, [loadAll])

  async function submitDeposit(event) {
    event.preventDefault()
    const payload = { ...deposit, amount: Number(deposit.amount) }
    const signature = JSON.stringify(payload)
    const key = attemptKey(depositAttempt, signature)

    setBusy('deposit')
    setError('')
    setNotice('')
    try {
      const data = await addWalletFunds(payload, key)
      setWallet(data.wallet)
      setNotice('Funds added to your BHD wallet.')
      setDeposit((current) => ({ ...current, amount: '', cvc: '' }))
      depositAttempt.current = null
      await loadTransactions()
    } catch (depositError) {
      setError(requestError(depositError, 'The deposit could not be completed.'))
      if (depositError?.response?.status === 402) {
        if (depositError.response.data?.data?.wallet) setWallet(depositError.response.data.data.wallet)
        await loadTransactions()
      }
    } finally {
      setBusy('')
    }
  }

  async function submitWithdrawal(event) {
    event.preventDefault()
    const payload = { amount: Number(withdrawalAmount) }
    const signature = JSON.stringify(payload)
    const key = attemptKey(withdrawalAttempt, signature)

    setBusy('withdrawal')
    setError('')
    setNotice('')
    try {
      const data = await withdrawWalletFunds(payload, key)
      setWallet(data.wallet)
      setWithdrawalAmount('')
      withdrawalAttempt.current = null
      setNotice('Withdrawal completed.')
      await loadTransactions()
    } catch (withdrawalError) {
      setError(requestError(withdrawalError, 'The withdrawal could not be completed.'))
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[65vh] w-full max-w-7xl gap-5 px-4 py-10 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-xl lg:col-span-3" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Payments</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Wallet</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Balances, escrow movements, deposits, withdrawals, and receipts use Bahraini dinar.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Payment not completed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert className="mb-5">
          <AlertTitle>Wallet updated</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Available', wallet?.available],
          ['Pending', wallet?.pending],
          ['Total', wallet?.total],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{amount(value)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add funds</CardTitle>
              <CardDescription>This is a mock checkout. Real card details are never accepted or stored.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={submitDeposit}>
                <div>
                  <Label htmlFor="deposit-amount">Amount (BHD)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    min="0.001"
                    max="100000"
                    step="0.001"
                    required
                    value={deposit.amount}
                    onChange={(event) => setDeposit((current) => ({ ...current, amount: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cardholder-name">Cardholder name</Label>
                  <Input
                    id="cardholder-name"
                    autoComplete="cc-name"
                    required
                    value={deposit.cardholderName}
                    onChange={(event) => setDeposit((current) => ({ ...current, cardholderName: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="card-number">Mock card number</Label>
                  <Input
                    id="card-number"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={deposit.cardNumber}
                    onChange={(event) => setDeposit((current) => ({ ...current, cardNumber: event.target.value }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">4242 4242 4242 4242 succeeds · 4000 0000 0000 0002 declines</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="expiry-month">Month</Label>
                    <Input
                      id="expiry-month"
                      inputMode="numeric"
                      required
                      value={deposit.expiryMonth}
                      onChange={(event) => setDeposit((current) => ({ ...current, expiryMonth: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry-year">Year</Label>
                    <Input
                      id="expiry-year"
                      inputMode="numeric"
                      required
                      value={deposit.expiryYear}
                      onChange={(event) => setDeposit((current) => ({ ...current, expiryYear: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-cvc">CVC</Label>
                    <Input
                      id="card-cvc"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      value={deposit.cvc}
                      onChange={(event) => setDeposit((current) => ({ ...current, cvc: event.target.value }))}
                    />
                  </div>
                </div>
                <Button className="w-full" type="submit" disabled={Boolean(busy)}>
                  {busy === 'deposit' ? 'Processing…' : 'Add funds'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {user?.role === 'freelancer' && (
            <Card>
              <CardHeader>
                <CardTitle>Withdraw funds</CardTitle>
                <CardDescription>Withdrawals debit your available balance immediately.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={submitWithdrawal}>
                  <div>
                    <Label htmlFor="withdrawal-amount">Amount (BHD)</Label>
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      min="0.001"
                      max="100000"
                      step="0.001"
                      required
                      value={withdrawalAmount}
                      onChange={(event) => setWithdrawalAmount(event.target.value)}
                    />
                  </div>
                  <Button className="w-full" type="submit" variant="outline" disabled={Boolean(busy)}>
                    {busy === 'withdrawal' ? 'Withdrawing…' : 'Withdraw'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction history</CardTitle>
            <CardDescription>Completed and failed movements, newest first.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Label htmlFor="transaction-type">Type</Label>
              <select
                id="transaction-type"
                className="h-9 rounded-lg border bg-background px-3 text-sm"
                value={type}
                onChange={(event) => {
                  setType(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">All transactions</option>
                {Object.entries(TRANSACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <Button size="sm" variant="ghost" onClick={loadAll}>Refresh</Button>
            </div>

            <div className="divide-y rounded-xl border">
              {transactions.length ? transactions.map((transaction) => {
                const credit = transaction.direction === 'credit'
                return (
                  <div key={transaction._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{TRANSACTION_LABELS[transaction.type] || transaction.type}</p>
                        <Badge variant={transaction.status === 'failed' ? 'destructive' : 'outline'}>{transaction.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{DATE_FORMATTER.format(new Date(transaction.createdAt))}</p>
                      {transaction.contract?.title && <p className="mt-1 text-xs text-muted-foreground">{transaction.contract.title}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${credit ? 'text-emerald-700' : ''}`}>{credit ? '+' : '−'}{amount(transaction.amount)}</p>
                      <Button
                        className="mt-1 h-auto px-0 text-xs"
                        variant="link"
                        nativeButton={false}
                        render={<Link to={`/transactions/${transaction._id}/receipt`} />}
                      >
                        View receipt
                      </Button>
                    </div>
                  </div>
                )
              }) : <p className="px-4 py-10 text-center text-sm text-muted-foreground">No transactions match this filter.</p>}
            </div>

            {pagination?.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
                <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default WalletPage
