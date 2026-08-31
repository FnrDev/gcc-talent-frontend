import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getTransactionReceipt } from '@/services/walletService'

const MONEY_FORMATTER = new Intl.NumberFormat('en-BH', {
  style: 'currency',
  currency: 'BHD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const DATE_FORMATTER = new Intl.DateTimeFormat('en-BH', {
  dateStyle: 'long',
  timeStyle: 'medium',
})

function TransactionReceiptPage() {
  const { id } = useParams()
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')

  const loadReceipt = useCallback(async () => {
    try {
      const data = await getTransactionReceipt(id)
      setReceipt(data.receipt)
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'We could not load this receipt.')
    }
  }, [id])

  useEffect(() => {
    // The response populates this protected receipt after the route mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReceipt()
  }, [loadReceipt])

  if (error) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-10">
        <Alert variant="destructive">
          <AlertTitle>Receipt unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    )
  }

  if (!receipt) {
    return <main className="mx-auto max-w-2xl px-4 py-10"><Skeleton className="h-[34rem] rounded-xl" /></main>
  }

  const transaction = receipt.transaction

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 print:max-w-none print:p-0">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Button variant="outline" nativeButton={false} render={<Link to="/wallet" />}>Back to wallet</Button>
        <Button onClick={() => window.print()}>Print receipt</Button>
      </div>

      <Card className="print:border-0 print:ring-0">
        <CardHeader className="border-b">
          <p className="text-sm font-medium text-primary">{receipt.platform}</p>
          <CardTitle className="text-2xl">Transaction receipt</CardTitle>
          <p className="font-mono text-xs text-muted-foreground">{receipt.receiptNumber}</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Account</p>
              <p className="mt-1 font-medium">{receipt.account?.name}</p>
              <p className="text-sm text-muted-foreground">{receipt.account?.email}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Transaction date</p>
              <p className="mt-1">{DATE_FORMATTER.format(new Date(transaction.createdAt))}</p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-5 text-center">
            <p className="text-sm capitalize text-muted-foreground">{transaction.type.replaceAll('_', ' ')}</p>
            <p className="mt-2 font-heading text-4xl font-semibold">{MONEY_FORMATTER.format(transaction.amount)}</p>
            <p className="mt-2 text-sm capitalize">{transaction.direction} · {transaction.status}</p>
          </div>

          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Reference</dt><dd className="max-w-[70%] break-all text-right font-mono text-xs">{transaction.reference}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Currency</dt><dd>{receipt.currency}</dd></div>
            {receipt.contract && (
              <>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Contract</dt><dd className="text-right">{receipt.contract.title}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Contract status</dt><dd className="capitalize">{receipt.contract.status}</dd></div>
              </>
            )}
          </dl>

          <p className="border-t pt-5 text-center text-xs text-muted-foreground">Generated {DATE_FORMATTER.format(new Date(receipt.issuedAt))}. This receipt records a GCC Talent platform ledger entry.</p>
        </CardContent>
      </Card>
    </main>
  )
}

export default TransactionReceiptPage
