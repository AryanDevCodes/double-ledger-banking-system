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
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreditCard, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api-client';

interface AccountOption {
  accountNumber: string;
  label: string;
}

interface CreditCardApplicationDTO {
  id: string;
  accountNumber: string;
  cardType: string;
  creditLimit?: number;
  annualFee?: number;
  rewardRate?: number;
  status: 'PENDING' | 'CREDIT_CHECK' | 'UNDERWRITING' | 'APPROVED' | 'REJECTED' | 'ACTIVATED';
  creditScore?: number;
  creditCheckResult?: string;
  underwritingResult?: string;
  approvalReason?: string;
  rejectionReason?: string;
  issuedAt?: string;
  activatedAt?: string;
  applicationDate: string;
  requestedByName?: string;
}

interface CreditCardApplicationPanelProps {
  accountNumber: string | null;
  accountOptions: AccountOption[];
  onAccountChange: (accountNumber: string) => void;
  isApprover: boolean;
  isRequester: boolean;
}

const DEFAULT_CARD_PLANS = [
  { name: 'Rewards Plus', limit: 100000, fee: 5000, reward: 1.5 },
  { name: 'Premium Elite', limit: 500000, fee: 15000, reward: 3 },
  { name: 'Business Platinum', limit: 1000000, fee: 25000, reward: 5 },
];

export default function CreditCardApplicationPanel({
  accountNumber,
  accountOptions,
  onAccountChange,
  isApprover,
  isRequester,
}: CreditCardApplicationPanelProps) {
  const queryClient = useQueryClient();
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionTarget, setDecisionTarget] = useState<CreditCardApplicationDTO | null>(null);
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject'>('approve');
  const [formState, setFormState] = useState({
    accountNumber: accountNumber ?? '',
    cardPlan: DEFAULT_CARD_PLANS[0].name,
    employmentStatus: 'EMPLOYED',
    annualIncome: '',
    approvalDecision: '',
    underwritingRemarks: '',
    creditScoreThreshold: '600',
    rejectionReason: '',
  });
  const [myApplications, setMyApplications] = useState<CreditCardApplicationDTO[]>([]);
  const [pendingApplications, setPendingApplications] = useState<CreditCardApplicationDTO[]>([]);
  const [underwritingApplications, setUnderwritingApplications] = useState<CreditCardApplicationDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      accountNumber: accountNumber ?? prev.accountNumber,
    }));
  }, [accountNumber]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      // Mock data for now - in real implementation, call API endpoints
      if (isRequester) {
        setMyApplications([]);
      }
      if (isApprover) {
        setPendingApplications([]);
        setUnderwritingApplications([]);
      }
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, 'Failed to load applications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [isApprover, isRequester]);

  const canSubmit = isRequester && accountOptions.length > 0 && Boolean(formState.accountNumber);

  const submitApplication = async () => {
    if (!formState.accountNumber) {
      toast.error('Select an account');
      return;
    }
    if (!formState.annualIncome) {
      toast.error('Enter annual income');
      return;
    }
    try {
      // Call API: POST /api/credit-card-applications
      toast.success('Credit card application submitted');
      setApplicationOpen(false);
      await loadApplications();
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, 'Failed to submit application'));
    }
  };

  const openDecision = (app: CreditCardApplicationDTO, mode: 'approve' | 'reject') => {
    setDecisionTarget(app);
    setDecisionMode(mode);
    setFormState((prev) => ({
      ...prev,
      approvalDecision: '',
      underwritingRemarks: app.underwritingResult || '',
      rejectionReason: '',
    }));
    setDecisionOpen(true);
  };

  const submitDecision = async () => {
    if (!decisionTarget) return;
    try {
      if (decisionMode === 'approve') {
        // Call API: POST /api/credit-card-applications/{id}/approve
        toast.success('Application approved');
      } else {
        // Call API: POST /api/credit-card-applications/{id}/reject
        toast.success('Application rejected');
      }
      setDecisionOpen(false);
      setDecisionTarget(null);
      await loadApplications();
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, 'Failed to process decision'));
    }
  };

  function statusBadge(status: string) {
    switch (status) {
      case 'ACTIVATED':
        return (
          <Badge className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200">
            ✓ Activated
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
            ✓ Approved
          </Badge>
        );
      case 'UNDERWRITING':
        return (
          <Badge className="bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200">
            ⊙ Underwriting
          </Badge>
        );
      case 'CREDIT_CHECK':
        return (
          <Badge className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200">
            ⊙ Credit Check
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200">
            ✗ Rejected
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200">
            ◇ Pending
          </Badge>
        );
    }
  }

  const formattedApplications = useMemo(() => myApplications, [myApplications]);

  const underwritingTimeline = (app: CreditCardApplicationDTO) => {
    const steps = [
      { key: 'APPLICATION', label: 'Application', icon: '📋', done: true, date: app.applicationDate },
      { key: 'CREDIT_CHECK', label: 'Credit Check', icon: '📊', done: app.status !== 'PENDING', date: app.creditScore ? `Score: ${app.creditScore}` : undefined },
      { key: 'UNDERWRITING', label: 'Underwriting', icon: '⚙️', done: ['UNDERWRITING', 'APPROVED', 'ACTIVATED'].includes(app.status), date: app.underwritingResult ? 'Reviewed' : undefined },
      { key: 'APPROVAL', label: 'Approval', icon: '✓', done: app.status === 'APPROVED' || app.status === 'ACTIVATED', date: undefined },
      { key: 'ACTIVATED', label: 'Activated', icon: '🎉', done: app.status === 'ACTIVATED', date: app.activatedAt },
    ];
    return steps;
  };

  return (
    <Card className="overflow-hidden border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-white/95 via-amber-50/50 to-white/95 dark:from-slate-900/95 dark:via-amber-950/20 dark:to-slate-900/95 backdrop-blur-sm">
      <CardHeader className="relative overflow-hidden border-b border-amber-200/30 dark:border-amber-900/20 bg-gradient-to-r from-amber-600/5 via-orange-500/5 to-amber-600/5 dark:from-amber-950/10 dark:via-orange-950/10 dark:to-amber-950/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(180,83,9,0.08),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_70%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Credit Card Applications</CardTitle>
              <p className="text-sm text-muted-foreground">
                Premium rewards & exclusive benefits. Rewards: up to 5% cashback.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              {formattedApplications.length} Applications
            </Badge>
            {isApprover ? (
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                {pendingApplications.length + underwritingApplications.length} Pending
              </Badge>
            ) : null}
            <Button 
              onClick={() => setApplicationOpen(true)} 
              disabled={!canSubmit}
              className="bg-gradient-to-r from-amber-600 hover:from-amber-700 to-orange-600 hover:to-orange-700 text-white"
            >
              Apply Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading applications...</div>
        ) : null}

        <Tabs defaultValue="my" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="my">My Applications</TabsTrigger>
            <TabsTrigger value="review" disabled={!isApprover}>
              Review Queue
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my" className="space-y-4">
            {!isRequester ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-200">Only customers can submit credit card applications.</span>
              </div>
            ) : formattedApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm text-muted-foreground">No applications yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Apply for a premium credit card with exclusive rewards.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {formattedApplications.map((app) => (
                  <div
                    key={app.id}
                    className="relative rounded-2xl border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-white/80 to-amber-50/50 dark:from-slate-900/80 dark:to-amber-950/20 p-5 shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full -mr-12 -mt-12" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-bold text-amber-900 dark:text-amber-100">{app.accountNumber}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Applied on {new Date(app.applicationDate).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          {statusBadge(app.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                        <div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Card Plan</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{app.cardType}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Limit</div>
                          <div className="text-sm font-bold text-amber-600 dark:text-amber-400">₹{app.creditLimit?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Annual Fee</div>
                          <div className="text-sm font-bold">₹{app.annualFee?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Rewards</div>
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{app.rewardRate}% cashback</div>
                        </div>
                      </div>

                      {app.creditScore && (
                        <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded border border-blue-200/50 dark:border-blue-900/30 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Credit Score</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{app.creditScore}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Processing Steps</div>
                        <div className="grid grid-cols-5 gap-1">
                          {underwritingTimeline(app).map((step) => (
                            <div key={step.key} className="flex flex-col items-center text-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mb-1 ${
                                step.done
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-500'
                              }`}>
                                {step.icon}
                              </div>
                              <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-tight">{step.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {app.rejectionReason && (
                        <div className="mt-3 p-2.5 bg-red-50/50 dark:bg-red-950/20 rounded border border-red-200/50 dark:border-red-900/30">
                          <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Rejection Reason</div>
                          <div className="text-xs text-red-600 dark:text-red-200">{app.rejectionReason}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            {!isApprover ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <AlertCircle className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">You do not have review access.</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Credit Check Queue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        Credit Check Queue
                      </div>
                      <div className="text-xs text-muted-foreground">Initiate credit bureau inquiry.</div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">{pendingApplications.length}</Badge>
                  </div>
                  {pendingApplications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-muted-foreground">
                      No pending applications.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingApplications.map((app) => (
                        <div key={app.id} className="rounded-lg border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">{app.accountNumber}</div>
                              <div className="text-xs text-muted-foreground">Plan: {app.cardType}</div>
                            </div>
                            <Button 
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => openDecision(app, 'approve')}
                            >
                              Run Credit Check
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Underwriting Queue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        Underwriting Review
                      </div>
                      <div className="text-xs text-muted-foreground">Review credit scores and make approval decisions.</div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">{underwritingApplications.length}</Badge>
                  </div>
                  {underwritingApplications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-muted-foreground">
                      No applications in underwriting.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {underwritingApplications.map((app) => (
                        <div key={app.id} className="rounded-lg border border-purple-200/50 bg-purple-50/50 dark:bg-purple-950/20 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase">Account</div>
                              <div className="text-sm font-bold">{app.accountNumber}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase">Credit Score</div>
                              <div className="text-sm font-bold text-blue-600">{app.creditScore || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase">Requested Limit</div>
                              <div className="text-sm font-bold text-amber-600">₹{app.creditLimit?.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => openDecision(app, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700"
                              onClick={() => openDecision(app, 'reject')}
                            >
                              Reject
                            </Button>
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

      {/* Application Dialog */}
      <Dialog open={applicationOpen} onOpenChange={setApplicationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Credit Card Application
            </DialogTitle>
            <DialogDescription>
              Select a plan, verify income, and we'll handle the rest. Premium rewards await!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="account" className="text-sm font-semibold">
                  Account
                </Label>
                <Select value={formState.accountNumber} onValueChange={(v) => {
                  setFormState((prev) => ({ ...prev, accountNumber: v }));
                  onAccountChange(v);
                }}>
                  <SelectTrigger id="account" className="mt-1">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountOptions.map((opt) => (
                      <SelectItem key={opt.accountNumber} value={opt.accountNumber}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-3 block">Choose Card Plan</Label>
                <div className="grid gap-3">
                  {DEFAULT_CARD_PLANS.map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setFormState((prev) => ({ ...prev, cardPlan: plan.name }))}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formState.cardPlan === plan.name
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="font-semibold text-amber-900 dark:text-amber-100">{plan.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Limit: ₹{plan.limit.toLocaleString()} • Fee: ₹{plan.fee.toLocaleString()} • Rewards: {plan.reward}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="employment" className="text-sm font-semibold">
                  Employment Status
                </Label>
                <Select value={formState.employmentStatus} onValueChange={(v) =>
                  setFormState((prev) => ({ ...prev, employmentStatus: v }))
                }>
                  <SelectTrigger id="employment" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYED">Employed</SelectItem>
                    <SelectItem value="SELF_EMPLOYED">Self Employed</SelectItem>
                    <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="income" className="text-sm font-semibold">
                  Annual Income (₹)
                </Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="500000"
                  value={formState.annualIncome}
                  onChange={(e) => setFormState((prev) => ({ ...prev, annualIncome: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApplicationOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitApplication}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {decisionMode === 'approve' ? '✓ Process Application' : '✗ Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {decisionTarget?.accountNumber} • {decisionTarget?.cardType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {decisionMode === 'approve' ? (
              <>
                <div>
                  <Label htmlFor="decision" className="text-sm font-semibold">
                    Decision
                  </Label>
                  <Select value={formState.approvalDecision} onValueChange={(v) =>
                    setFormState((prev) => ({ ...prev, approvalDecision: v }))
                  }>
                    <SelectTrigger id="decision" className="mt-1">
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVE">Approve</SelectItem>
                      <SelectItem value="CONDITIONAL">Conditional Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="remarks" className="text-sm font-semibold">
                    Underwriting Remarks
                  </Label>
                  <Textarea
                    id="remarks"
                    placeholder="Credit profile analysis, income verification, etc."
                    value={formState.underwritingRemarks}
                    onChange={(e) => setFormState((prev) => ({ ...prev, underwritingRemarks: e.target.value }))}
                    className="mt-1 min-h-[100px]"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="reason" className="text-sm font-semibold">
                  Rejection Reason
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Credit score below threshold, income verification failed, etc."
                  value={formState.rejectionReason}
                  onChange={(e) => setFormState((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDecisionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDecision} className={
              decisionMode === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }>
              {decisionMode === 'approve' ? 'Submit Approval' : 'Submit Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
