import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { debitCardRequestApi, type DebitCardRequestDTO } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AccountOption {
  accountNumber: string;
  label: string;
}

interface DebitCardRequestsPanelProps {
  accountNumber: string | null;
  accountOptions: AccountOption[];
  onAccountChange: (accountNumber: string) => void;
  isApprover: boolean;
  isRequester: boolean;
}

const DEFAULT_CARD_TYPES = ['Visa', 'Mastercard', 'RuPay'];
const DELIVERY_METHODS = ['STANDARD', 'EXPRESS', 'BRANCH_PICKUP'];

export default function DebitCardRequestsPanel({
  accountNumber,
  accountOptions,
  onAccountChange,
  isApprover,
  isRequester,
}: DebitCardRequestsPanelProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionTarget, setDecisionTarget] = useState<DebitCardRequestDTO | null>(null);
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject'>('approve');
  const [formState, setFormState] = useState({
    accountNumber: accountNumber ?? '',
    cardType: DEFAULT_CARD_TYPES[0],
    isVirtual: false,
    dailyLimit: '',
    monthlyLimit: '',
    otpRequired: true,
    isContactlessEnabled: true,
    isInternationalEnabled: false,
    deliveryMethod: DELIVERY_METHODS[0],
    deliveryAddress: '',
    expectedDeliveryDate: '',
    trackingNumber: '',
    reviewNotes: '',
    rejectionReason: '',
  });
  const [myRequests, setMyRequests] = useState<DebitCardRequestDTO[]>([]);
  const [pendingRequests, setPendingRequests] = useState<DebitCardRequestDTO[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<DebitCardRequestDTO[]>([]);
  const [issuedRequests, setIssuedRequests] = useState<DebitCardRequestDTO[]>([]);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState<DebitCardRequestDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      accountNumber: accountNumber ?? prev.accountNumber,
    }));
  }, [accountNumber]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [my, pending, approved, issued] = await Promise.all([
        isRequester ? debitCardRequestApi.listMy() : Promise.resolve([]),
        isApprover ? debitCardRequestApi.listPending() : Promise.resolve([]),
        isApprover ? debitCardRequestApi.listApproved() : Promise.resolve([]),
        isApprover ? debitCardRequestApi.listIssued() : Promise.resolve([]),
      ]);
      setMyRequests(my);
      setPendingRequests(pending);
      setApprovedRequests(approved);
      setIssuedRequests(issued);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load card requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [isApprover, isRequester]);

  const canSubmit = isRequester && accountOptions.length > 0 && Boolean(formState.accountNumber);

  const submitRequest = async () => {
    if (!formState.accountNumber) {
      toast.error('Select an account');
      return;
    }
    try {
      const deliveryAddress = formState.isVirtual ? undefined : formState.deliveryAddress;
      await debitCardRequestApi.create({
        accountNumber: formState.accountNumber,
        cardType: formState.cardType,
        isVirtual: formState.isVirtual,
        dailyLimit: formState.dailyLimit ? Number(formState.dailyLimit) : undefined,
        monthlyLimit: formState.monthlyLimit ? Number(formState.monthlyLimit) : undefined,
        otpRequired: formState.otpRequired,
        isContactlessEnabled: formState.isContactlessEnabled,
        isInternationalEnabled: formState.isInternationalEnabled,
        deliveryMethod: formState.isVirtual ? 'DIGITAL' : formState.deliveryMethod,
        deliveryAddress,
      });
      toast.success('Debit card request submitted');
      setCreateOpen(false);
      await loadRequests();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit request');
    }
  };

  const openDecision = (request: DebitCardRequestDTO, mode: 'approve' | 'reject') => {
    setDecisionTarget(request);
    setDecisionMode(mode);
    setFormState((prev) => ({
      ...prev,
      cardType: request.cardType || prev.cardType,
      isVirtual: Boolean(request.isVirtual),
      dailyLimit: request.dailyLimit ? String(request.dailyLimit) : '',
      monthlyLimit: request.monthlyLimit ? String(request.monthlyLimit) : '',
      deliveryMethod: request.deliveryMethod || prev.deliveryMethod,
      deliveryAddress: request.deliveryAddress || '',
      expectedDeliveryDate: request.expectedDeliveryDate || '',
      reviewNotes: request.reviewNotes || '',
      rejectionReason: '',
    }));
    setDecisionOpen(true);
  };

  const submitDecision = async () => {
    if (!decisionTarget) return;
    try {
      const expectedDeliveryDate = normalizeDateTime(formState.expectedDeliveryDate);
      const payload = {
        cardType: formState.cardType,
        isVirtual: formState.isVirtual,
        dailyLimit: formState.dailyLimit ? Number(formState.dailyLimit) : undefined,
        monthlyLimit: formState.monthlyLimit ? Number(formState.monthlyLimit) : undefined,
        otpRequired: formState.otpRequired,
        isContactlessEnabled: formState.isContactlessEnabled,
        isInternationalEnabled: formState.isInternationalEnabled,
        deliveryMethod: formState.isVirtual ? 'DIGITAL' : formState.deliveryMethod,
        deliveryAddress: formState.isVirtual ? undefined : formState.deliveryAddress,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        reviewNotes: formState.reviewNotes || undefined,
        rejectionReason: formState.rejectionReason,
      };
      if (decisionMode === 'approve') {
        await debitCardRequestApi.approve(decisionTarget.id, payload);
        toast.success('Request approved and queued for issuance');
      } else {
        await debitCardRequestApi.reject(decisionTarget.id, payload);
        toast.success('Request rejected');
      }
      setDecisionOpen(false);
      setDecisionTarget(null);
      await loadRequests();
      queryClient.invalidateQueries({ queryKey: ['debitCards'] });
    } catch (error) {
      console.error(error);
      toast.error('Failed to process request');
    }
  };

  const issueCard = async (request: DebitCardRequestDTO) => {
    try {
      await debitCardRequestApi.issue(request.id);
      toast.success('Card issued');
      await loadRequests();
      queryClient.invalidateQueries({ queryKey: ['debitCards'] });
    } catch (error) {
      console.error(error);
      toast.error('Failed to issue card');
    }
  };

  const openDispatch = (request: DebitCardRequestDTO) => {
    setDispatchTarget(request);
    setFormState((prev) => ({
      ...prev,
      trackingNumber: request.trackingNumber || '',
      expectedDeliveryDate: request.expectedDeliveryDate || '',
    }));
    setDispatchOpen(true);
  };

  const submitDispatch = async () => {
    if (!dispatchTarget) return;
    try {
      const expectedDeliveryDate = normalizeDateTime(formState.expectedDeliveryDate);
      await debitCardRequestApi.dispatch(dispatchTarget.id, {
        trackingNumber: formState.trackingNumber || undefined,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
      });
      toast.success('Card dispatched');
      setDispatchOpen(false);
      setDispatchTarget(null);
      await loadRequests();
    } catch (error) {
      console.error(error);
      toast.error('Failed to dispatch card');
    }
  };

  const confirmDelivery = async (request: DebitCardRequestDTO) => {
    try {
      await debitCardRequestApi.deliver(request.id);
      toast.success('Delivery confirmed');
      await loadRequests();
    } catch (error) {
      console.error(error);
      toast.error('Failed to confirm delivery');
    }
  };

  function formatDate(value?: string) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function normalizeDateTime(value?: string) {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.length === 16) {
      return `${trimmed}:00`;
    }
    return trimmed;
  }

  function toLocalInputValue(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }
    return value.slice(0, 16);
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return <Badge className="bg-emerald-100 text-emerald-700">Issued</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-700">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
    }
  };

  const deliveryBadge = (status?: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge className="bg-emerald-100 text-emerald-700">Delivered</Badge>;
      case 'DISPATCHED':
        return <Badge className="bg-blue-100 text-blue-700">Dispatched</Badge>;
      case 'NOT_REQUIRED':
        return <Badge className="bg-slate-100 text-slate-700">Digital</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-amber-100 text-amber-700">Awaiting dispatch</Badge>;
    }
  };

  const formattedRequests = useMemo(() => myRequests, [myRequests]);

  const timelineSteps = (request: DebitCardRequestDTO) => {
    const deliveryStatus = request.deliveryStatus || (request.isVirtual ? 'NOT_REQUIRED' : 'PENDING');
    const steps = [
      { key: 'REQUESTED', label: 'Requested', at: request.requestedAt },
      { key: 'APPROVED', label: 'Approved', at: request.approvedAt },
      { key: 'ISSUED', label: 'Issued', at: request.issuedAt },
    ];
    if (deliveryStatus !== 'NOT_REQUIRED') {
      steps.push(
        { key: 'DISPATCHED', label: 'Dispatched', at: request.dispatchedAt },
        { key: 'DELIVERED', label: 'Delivered', at: request.deliveredAt },
      );
    } else {
      steps.push({ key: 'DIGITAL', label: 'Digital delivery', at: request.issuedAt });
    }
    return steps.map((step) => ({
      ...step,
      done: Boolean(step.at),
    }));
  };

  return (
    <Card className="overflow-hidden border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur">
      <CardHeader className="relative overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Debit Card Requests</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track approvals, issuance, and delivery for physical and virtual cards.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900">
              {formattedRequests.length} My requests
            </Badge>
            {isApprover ? (
              <Badge className="bg-blue-100 text-blue-700">{pendingRequests.length} Pending review</Badge>
            ) : null}
            <Button onClick={() => setCreateOpen(true)} disabled={!canSubmit}>
              New request
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading requests...</div>
        ) : null}

        <Tabs defaultValue="my">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my">My requests</TabsTrigger>
            <TabsTrigger value="ops" disabled={!isApprover}>
              Operations queue
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my" className="space-y-3">
            {!isRequester ? (
              <div className="text-sm text-muted-foreground">Only customers can submit requests.</div>
            ) : formattedRequests.length === 0 ? (
              <div className="text-sm text-muted-foreground">No requests yet.</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {formattedRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{request.accountNumber}</div>
                        <div className="text-xs text-muted-foreground">Requested {formatDate(request.requestedAt)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(request.status)}
                        {request.deliveryStatus ? deliveryBadge(request.deliveryStatus) : null}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <div>Type: {request.cardType || 'Standard'}</div>
                      <div>Virtual: {request.isVirtual ? 'Yes' : 'No'}</div>
                      <div>Daily limit: {request.dailyLimit ?? 'Default'}</div>
                    </div>
                    <div className="mt-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Timeline</div>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        {timelineSteps(request).map((step) => (
                          <div key={step.key} className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${step.done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <div className="text-xs">
                              <div className="font-medium text-slate-700 dark:text-slate-200">{step.label}</div>
                              <div className="text-[11px] text-muted-foreground">{formatDate(step.at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <div>KYC snapshot: {request.kycStatusAtRequest ?? '—'}</div>
                      <div>Delivery: {request.deliveryMethod ?? (request.isVirtual ? 'Digital' : 'Standard')}</div>
                    </div>
                    {request.deliveryAddress ? (
                      <div className="mt-2 text-xs text-muted-foreground">Address: {request.deliveryAddress}</div>
                    ) : null}
                    {request.rejectionReason ? (
                      <div className="mt-2 text-xs text-red-500">Reason: {request.rejectionReason}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="ops" className="space-y-4">
            {!isApprover ? (
              <div className="text-sm text-muted-foreground">You do not have approval access.</div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Pending review</div>
                      <div className="text-xs text-muted-foreground">Check KYC, limits, and delivery details.</div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">{pendingRequests.length}</Badge>
                  </div>
                  {pendingRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                      No pending requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">{request.accountNumber}</div>
                              <div className="text-xs text-muted-foreground">Requested by {request.requestedByName || 'User'}</div>
                            </div>
                            {statusBadge(request.status)}
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                            <div>Type: {request.cardType || 'Standard'}</div>
                            <div>Virtual: {request.isVirtual ? 'Yes' : 'No'}</div>
                            <div>Delivery: {request.deliveryMethod ?? (request.isVirtual ? 'Digital' : 'Standard')}</div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => openDecision(request, 'approve')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openDecision(request, 'reject')}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Ready to issue</div>
                      <div className="text-xs text-muted-foreground">Approved requests awaiting card issuance.</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">{approvedRequests.length}</Badge>
                  </div>
                  {approvedRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                      No approved requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {approvedRequests.map((request) => (
                        <div key={request.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">{request.accountNumber}</div>
                              <div className="text-xs text-muted-foreground">Approved {formatDate(request.approvedAt)}</div>
                            </div>
                            {statusBadge(request.status)}
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                            <div>Type: {request.cardType || 'Standard'}</div>
                            <div>Virtual: {request.isVirtual ? 'Yes' : 'No'}</div>
                            <div>KYC: {request.kycStatusAtRequest ?? '—'}</div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => issueCard(request)}>
                              Issue card
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Fulfillment & delivery</div>
                      <div className="text-xs text-muted-foreground">Dispatch and confirm delivery of issued cards.</div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">{issuedRequests.length}</Badge>
                  </div>
                  {issuedRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                      No issued requests awaiting delivery.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {issuedRequests.map((request) => (
                        <div key={request.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">{request.accountNumber}</div>
                              <div className="text-xs text-muted-foreground">Issued {formatDate(request.issuedAt)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(request.status)}
                              {deliveryBadge(request.deliveryStatus)}
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                            <div>Tracking: {request.trackingNumber || '—'}</div>
                            <div>ETA: {formatDate(request.expectedDeliveryDate)}</div>
                            <div>Delivery: {request.deliveryMethod ?? (request.isVirtual ? 'Digital' : 'Standard')}</div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {request.deliveryStatus === 'PENDING' && !request.isVirtual ? (
                              <Button size="sm" onClick={() => openDispatch(request)}>
                                Dispatch
                              </Button>
                            ) : null}
                            {request.deliveryStatus === 'DISPATCHED' ? (
                              <Button size="sm" variant="outline" onClick={() => confirmDelivery(request)}>
                                Confirm delivery
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Request a debit card</DialogTitle>
            <DialogDescription>Choose the account and card preferences to submit.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={formState.accountNumber} onValueChange={(value) => {
                setFormState((prev) => ({ ...prev, accountNumber: value }));
                onAccountChange(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map((option) => (
                    <SelectItem key={option.accountNumber} value={option.accountNumber}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Card type</Label>
              <Select value={formState.cardType} onValueChange={(value) => setFormState((prev) => ({ ...prev, cardType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CARD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Daily limit</Label>
              <Input
                value={formState.dailyLimit}
                onChange={(event) => setFormState((prev) => ({ ...prev, dailyLimit: event.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly limit</Label>
              <Input
                value={formState.monthlyLimit}
                onChange={(event) => setFormState((prev) => ({ ...prev, monthlyLimit: event.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Usage controls</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={formState.otpRequired ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormState((prev) => ({ ...prev, otpRequired: !prev.otpRequired }))}
                >
                  OTP required
                </Button>
                <Button
                  type="button"
                  variant={formState.isContactlessEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormState((prev) => ({ ...prev, isContactlessEnabled: !prev.isContactlessEnabled }))}
                >
                  Contactless
                </Button>
                <Button
                  type="button"
                  variant={formState.isInternationalEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormState((prev) => ({ ...prev, isInternationalEnabled: !prev.isInternationalEnabled }))}
                >
                  International
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Virtual card</Label>
              <Button
                type="button"
                variant={formState.isVirtual ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormState((prev) => ({ ...prev, isVirtual: !prev.isVirtual }))}
              >
                {formState.isVirtual ? 'Virtual enabled' : 'Physical card'}
              </Button>
            </div>
            {!formState.isVirtual ? (
              <>
                <div className="space-y-2">
                  <Label>Delivery method</Label>
                  <Select
                    value={formState.deliveryMethod}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, deliveryMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Delivery address</Label>
                  <Textarea
                    value={formState.deliveryAddress}
                    onChange={(event) => setFormState((prev) => ({ ...prev, deliveryAddress: event.target.value }))}
                    placeholder="Street, city, postal code"
                  />
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={!canSubmit}>
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {decisionMode === 'approve' ? 'Approve & issue card' : 'Reject request'}
            </DialogTitle>
            <DialogDescription>
              {decisionMode === 'approve'
                ? 'Confirm card settings before issuing the debit card.'
                : 'Provide an optional reason before rejecting this request.'}
            </DialogDescription>
          </DialogHeader>
          {decisionTarget ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
                <div className="font-medium">{decisionTarget.accountNumber}</div>
                <div className="text-xs text-muted-foreground">Requested by {decisionTarget.requestedByName || 'User'}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Card type</Label>
                  <Select value={formState.cardType} onValueChange={(value) => setFormState((prev) => ({ ...prev, cardType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CARD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Virtual card</Label>
                  <Button
                    type="button"
                    variant={formState.isVirtual ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormState((prev) => ({ ...prev, isVirtual: !prev.isVirtual }))}
                  >
                    {formState.isVirtual ? 'Virtual enabled' : 'Physical card'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Daily limit</Label>
                  <Input
                    value={formState.dailyLimit}
                    onChange={(event) => setFormState((prev) => ({ ...prev, dailyLimit: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly limit</Label>
                  <Input
                    value={formState.monthlyLimit}
                    onChange={(event) => setFormState((prev) => ({ ...prev, monthlyLimit: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                {!formState.isVirtual ? (
                  <>
                    <div className="space-y-2">
                      <Label>Delivery method</Label>
                      <Select
                        value={formState.deliveryMethod}
                        onValueChange={(value) => setFormState((prev) => ({ ...prev, deliveryMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Delivery address</Label>
                      <Textarea
                        value={formState.deliveryAddress}
                        onChange={(event) => setFormState((prev) => ({ ...prev, deliveryAddress: event.target.value }))}
                        placeholder="Street, city, postal code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected delivery</Label>
                      <Input
                        type="datetime-local"
                        value={toLocalInputValue(formState.expectedDeliveryDate)}
                        onChange={(event) => setFormState((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))}
                      />
                    </div>
                  </>
                ) : null}
                <div className="space-y-2">
                  <Label>Usage controls</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={formState.otpRequired ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormState((prev) => ({ ...prev, otpRequired: !prev.otpRequired }))}
                    >
                      OTP required
                    </Button>
                    <Button
                      type="button"
                      variant={formState.isContactlessEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormState((prev) => ({ ...prev, isContactlessEnabled: !prev.isContactlessEnabled }))}
                    >
                      Contactless
                    </Button>
                    <Button
                      type="button"
                      variant={formState.isInternationalEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormState((prev) => ({ ...prev, isInternationalEnabled: !prev.isInternationalEnabled }))}
                    >
                      International
                    </Button>
                  </div>
                </div>
                {decisionMode === 'reject' ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Rejection reason</Label>
                    <Input
                      value={formState.rejectionReason}
                      onChange={(event) => setFormState((prev) => ({ ...prev, rejectionReason: event.target.value }))}
                      placeholder="Provide a reason"
                    />
                  </div>
                ) : null}
                {decisionMode === 'approve' ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Review notes</Label>
                    <Textarea
                      value={formState.reviewNotes}
                      onChange={(event) => setFormState((prev) => ({ ...prev, reviewNotes: event.target.value }))}
                      placeholder="Add internal review notes"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDecision}>
              {decisionMode === 'approve' ? 'Approve & issue' : 'Reject request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispatch physical card</DialogTitle>
            <DialogDescription>Attach tracking and update the delivery ETA.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 text-sm">
              <div className="font-medium">{dispatchTarget?.accountNumber}</div>
              <div className="text-xs text-muted-foreground">Delivery {dispatchTarget?.deliveryMethod ?? 'Standard'}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tracking number</Label>
                <Input
                  value={formState.trackingNumber}
                  onChange={(event) => setFormState((prev) => ({ ...prev, trackingNumber: event.target.value }))}
                  placeholder="Courier tracking"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected delivery</Label>
                <Input
                  type="datetime-local"
                  value={toLocalInputValue(formState.expectedDeliveryDate)}
                  onChange={(event) => setFormState((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDispatch}>Confirm dispatch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
