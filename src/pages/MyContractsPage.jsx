import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'

import UserLink from '@/components/UserLink'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { getContracts } from '@/services/contractService'

const MONEY_FORMATTERS = new Map()

function formatMoney(value, currency = 'BHD') {
  const code = typeof currency === 'string' && currency.trim() ? currency.toUpperCase() : 'BHD'
  if (!MONEY_FORMATTERS.has(code)) {
    MONEY_FORMATTERS.set(code, new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'BHD' ? 3 : 2,
      maximumFractionDigits: code === 'BHD' ? 3 : 2,
    }))
  }
  return MONEY_FORMATTERS.get(code).format(Number(value) || 0)
}

const FILTERS = [
  ['', 'All'],
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
]

function requestError(error) {
  return error?.response?.data?.message || 'We could not load your contracts.'
}

function MyContractsPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadContracts = useCallback(async () => {
    setError('')
    try {
      const data = await getContracts({ status, page, limit: 12 })
      setContracts(data.contracts || [])
      setPagination(data.pagination)
    } catch (loadError) {
      setError(requestError(loadError))
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    // The external API response initializes this authenticated list route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContracts()
  }, [loadContracts])

  const currentUserId = String(user?._id || user?.id || '')

  return (
    <main className="mx-auto min-h-[65vh] w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Work</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">My contracts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Every job and service contract where you are the client or freelancer.</p>
        </div>
        <Button variant="outline" onClick={loadContracts}>Refresh</Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Filter contracts by status">
        {FILTERS.map(([value, label]) => (
          <Button
            key={value || 'all'}
            size="sm"
            variant={status === value ? 'default' : 'outline'}
            onClick={() => {
              setStatus(value)
              setPage(1)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Contracts unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-64 rounded-xl" />)}
        </div>
      ) : contracts.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contracts.map((contract) => {
            const clientId = String(contract.client?._id || contract.client || '')
            const counterpart = currentUserId === clientId ? contract.freelancer : contract.client
            const approved = contract.milestones?.filter((milestone) => milestone.status === 'approved').length || 0
            const total = contract.milestones?.length || 0
            return (
              <Card key={contract._id} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="capitalize">{contract.source?.type || 'contract'}</Badge>
                    <Badge variant={contract.status === 'cancelled' ? 'destructive' : contract.status === 'completed' ? 'default' : 'secondary'}>{contract.status}</Badge>
                  </div>
                  <CardTitle className="mt-2">{contract.title}</CardTitle>
                  <CardDescription>
                    With <UserLink user={counterpart} className="inline-flex font-medium text-foreground" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex items-end justify-between gap-3 rounded-lg bg-muted/45 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-heading text-lg font-medium">{formatMoney(contract.totalAmount, contract.currency)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{approved}/{total} approved</p>
                  </div>
                  <Button className="w-full" nativeButton={false} render={<Link to={`/contracts/${contract._id}`} />}>
                    Open workspace
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-14 text-center">
            <h2 className="font-heading text-xl font-medium">No contracts found</h2>
            <p className="mt-2 text-sm text-muted-foreground">Contracts appear here after a proposal is accepted or a service is ordered.</p>
          </CardContent>
        </Card>
      )}

      {pagination?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      )}
    </main>
  )
}

export default MyContractsPage
