import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import UserLink from '@/components/UserLink'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { getContracts } from '@/services/contractService'
import i18n from '@/i18n'

const MONEY_FORMATTERS = new Map()

function formatMoney(value, currency = 'BHD') {
  const code = typeof currency === 'string' && currency.trim() ? currency.toUpperCase() : 'BHD'
  // Cache per locale as well as per currency, or a language switch keeps the old digits.
  const cacheKey = `${i18n.language}:${code}`
  if (!MONEY_FORMATTERS.has(cacheKey)) {
    MONEY_FORMATTERS.set(cacheKey, new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-u-nu-latn' : 'en-BH', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'BHD' ? 3 : 2,
      maximumFractionDigits: code === 'BHD' ? 3 : 2,
    }))
  }
  return MONEY_FORMATTERS.get(cacheKey).format(Number(value) || 0)
}

const FILTERS = [
  ['', 'workspace.all'],
  ['active', 'status.active'],
  ['completed', 'status.completed'],
  ['cancelled', 'status.cancelled'],
]

function requestError(error) {
  return error?.response?.data?.message || i18n.t('workspace.contractsLoadFailed')
}

function MyContractsPage() {
  const { t } = useTranslation()
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
          <p className="text-sm font-medium text-primary">{t('workspace.work')}</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">{t('workspace.myContracts')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('workspace.contractsSubtitle')}</p>
        </div>
        <Button variant="outline" onClick={loadContracts}>{t('workspace.refresh')}</Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" aria-label={t('workspace.filterByStatus')}>
        {FILTERS.map(([value, labelKey]) => (
          <Button
            key={value || 'all'}
            size="sm"
            variant={status === value ? 'default' : 'outline'}
            onClick={() => {
              setStatus(value)
              setPage(1)
            }}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>{t('workspace.contractsUnavailable')}</AlertTitle>
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
                    <Badge variant="outline" className="capitalize">{contract.source?.type || t('workspace.contract')}</Badge>
                    <Badge variant={contract.status === 'cancelled' ? 'destructive' : contract.status === 'completed' ? 'default' : 'secondary'}>{i18n.exists(`status.${contract.status}`) ? t(`status.${contract.status}`) : contract.status}</Badge>
                  </div>
                  <CardTitle className="mt-2">{contract.title}</CardTitle>
                  <CardDescription>
                    {t('workspace.with')} <UserLink user={counterpart} className="inline-flex font-medium text-foreground" />
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex items-end justify-between gap-3 rounded-lg bg-muted/45 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('workspace.value')}</p>
                      <p className="font-heading text-lg font-medium">{formatMoney(contract.totalAmount, contract.currency)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('workspace.approvedRatio', { approved, total })}</p>
                  </div>
                  <Button className="w-full" nativeButton={false} render={<Link to={`/contracts/${contract._id}`} />}>
                    {t('workspace.openWorkspace')}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-14 text-center">
            <h2 className="font-heading text-xl font-medium">{t('workspace.noContracts')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('workspace.noContractsDescription')}</p>
          </CardContent>
        </Card>
      )}

      {pagination?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>{t('common.previous')}</Button>
          <span className="text-sm text-muted-foreground">{t('common.pageOfPlain', { page, total: pagination.totalPages })}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>{t('common.next')}</Button>
        </div>
      )}
    </main>
  )
}

export default MyContractsPage
