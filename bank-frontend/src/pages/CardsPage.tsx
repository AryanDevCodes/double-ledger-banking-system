import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { accountApi, creditPlanApi, debitCardApi, creditCardApi, API_BASE_URL } from '@/lib/api-client';
import { useCreditPlans, useDebitCards, useCreditCards } from '@/hooks/useCards';
import type { AccountResponseDTO } from '@/types/api';
import DebitCardRequestsPanel from '@/components/DebitCardRequestsPanel';
import CreditCardApplicationPanel from '@/components/CreditCardApplicationPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardSkeleton } from '@/components/LoadingStates';
import { Lock, Unlock, CreditCard, Eye, EyeOff, MoreVertical, ShieldCheck, ShieldX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CardsPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAccountNumber, setSelectedAccountNumber] = useState<string | null>(null);
  const [accountOptions, setAccountOptions] = useState<{ accountNumber: string; label: string }[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showCardNumbers, setShowCardNumbers] = useState<Record<number, boolean>>({});
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitTarget, setLimitTarget] = useState<{ type: 'debit' | 'credit'; id: number } | null>(null);
  const [limitDaily, setLimitDaily] = useState('');
  const [limitMonthly, setLimitMonthly] = useState('');
  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);
  const [merchantTarget, setMerchantTarget] = useState<{ type: 'debit' | 'credit'; id: number } | null>(null);
  const [merchantInput, setMerchantInput] = useState('');
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planTargetId, setPlanTargetId] = useState<number | null>(null);
  const [planCardId, setPlanCardId] = useState<number | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accounts = (await accountApi.getMy()) as AccountResponseDTO[];
        if (accounts.length > 0) {
          setSelectedAccountNumber(accounts[0].accountNumber);
          setAccountOptions(accounts.map((account) => ({
            accountNumber: account.accountNumber,
            label: `${account.accountNumber} · ${account.bankName ?? 'Bank'}`,
          })));
        }
      } catch (error) {
        console.error('Failed to load accounts:', error);
      } finally {
        setAccountsLoading(false);
      }
    };
    if (user?.userId && user?.roles?.includes('ROLE_USER')) {
      loadAccounts();
    } else {
      setAccountsLoading(false);
    }
  }, [user?.userId, user?.roles]);

  useEffect(() => {
    if (!token) return;
    const url = `${API_BASE_URL}/stream/events?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    const handleEvent = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { message?: string; type?: string };
        if (payload?.message) {
          toast.info(payload.message);
        }
      } catch {
        // Ignore malformed events.
      }
      queryClient.invalidateQueries({ queryKey: ['debitCards'] });
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
    };

    source.onmessage = handleEvent;
    source.addEventListener('card.freeze', handleEvent);
    source.addEventListener('card.unfreeze', handleEvent);
    source.addEventListener('card.replace', handleEvent);
    source.addEventListener('card.limits', handleEvent);
    source.addEventListener('card.merchantBlocks', handleEvent);
    source.addEventListener('credit.plan', handleEvent);

    return () => {
      source.close();
    };
  }, [token, queryClient]);

  const openLimitDialog = (type: 'debit' | 'credit', cardId: number, daily?: number, monthly?: number) => {
    setLimitTarget({ type, id: cardId });
    setLimitDaily(daily ? String(daily) : '');
    setLimitMonthly(monthly ? String(monthly) : '');
    setLimitDialogOpen(true);
  };

  const saveLimits = async () => {
    if (!limitTarget) return;
    const daily = limitDaily ? Number(limitDaily) : undefined;
    const monthly = limitMonthly ? Number(limitMonthly) : undefined;
    try {
      if (limitTarget.type === 'debit') {
        await debitCardApi.updateLimits(limitTarget.id, { dailyLimit: daily, monthlyLimit: monthly });
      } else {
        await creditCardApi.updateLimits(limitTarget.id, { dailyLimit: daily, monthlyLimit: monthly });
      }
      toast.success('Limits updated');
      queryClient.invalidateQueries({ queryKey: ['debitCards'] });
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      setLimitDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update limits');
      console.error(error);
    }
  };

  const openMerchantDialog = (type: 'debit' | 'credit', cardId: number, current: string[] | undefined) => {
    setMerchantTarget({ type, id: cardId });
    setMerchantInput(current?.join(', ') ?? '');
    setMerchantDialogOpen(true);
  };

  const saveMerchantBlocks = async () => {
    if (!merchantTarget) return;
    const categories = merchantInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    try {
      if (merchantTarget.type === 'debit') {
        await debitCardApi.updateMerchantBlocks(merchantTarget.id, categories);
      } else {
        await creditCardApi.updateMerchantBlocks(merchantTarget.id, categories);
      }
      toast.success('Merchant blocks updated');
      queryClient.invalidateQueries({ queryKey: ['debitCards'] });
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      setMerchantDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update merchant blocks');
      console.error(error);
    }
  };

  const applyPlan = async () => {
    if (!planTargetId || !planCardId) return;
    try {
      await creditPlanApi.assignToCard(planTargetId, planCardId);
      toast.success('Credit plan applied');
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      setPlanDialogOpen(false);
    } catch (error) {
      toast.error('Failed to apply plan');
      console.error(error);
    }
  };
  
  const { data: debitCards, isLoading: debitLoading } = useDebitCards(selectedAccountNumber ?? undefined);
  const { data: creditCards, isLoading: creditLoading } = useCreditCards(selectedAccountNumber ?? undefined);
  const { data: creditPlans } = useCreditPlans();
  const debitCardList = debitCards ?? [];
  const creditCardList = creditCards ?? [];

  const isApprover = Boolean(user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_MANAGER'));
  const isRequester = Boolean(user?.roles?.includes('ROLE_USER'));

  const maskCardNumber = (cardNumber: string) => `•••• •••• •••• ${cardNumber.slice(-4)}`;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'BLOCKED':
      case 'EXPIRED':
        return 'destructive' as const;
      case 'ACTIVE':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Cards & Payments"
        subtitle="Manage your debit and credit cards"
      />

      <div className="space-y-6">
        {accountsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : null}

        <Tabs defaultValue="debit" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="debit">Debit Cards</TabsTrigger>
            <TabsTrigger value="credit">Credit Cards</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="debit" className="space-y-4">
            {debitLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : debitCardList.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No debit cards found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {debitCardList.map((card) => (
                  <Card key={card.id} className="overflow-hidden border-indigo-100 dark:border-indigo-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{card.cardType}</CardTitle>
                          <CardDescription>Debit Card</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openLimitDialog('debit', card.id, card.dailyLimit, card.monthlyLimit)}
                            >
                              Set Limits
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openMerchantDialog('debit', card.id, card.merchantCategoryBlocks)
                              }
                            >
                              Merchant Blocks
                            </DropdownMenuItem>
                            {card.status === 'BLOCKED' ? (
                              <DropdownMenuItem onClick={async () => {
                                await debitCardApi.unfreeze(card.id);
                                queryClient.invalidateQueries({ queryKey: ['debitCards'] });
                              }}>
                                Unfreeze Card
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={async () => {
                                await debitCardApi.freeze(card.id, 'CUSTOMER_FREEZE');
                                queryClient.invalidateQueries({ queryKey: ['debitCards'] });
                              }}>
                                Freeze Card
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={async () => {
                                await debitCardApi.replace(card.id);
                                queryClient.invalidateQueries({ queryKey: ['debitCards'] });
                              }}
                            >
                              Replace Card
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={async () => {
                                await debitCardApi.freeze(card.id, 'LOST_OR_STOLEN');
                                queryClient.invalidateQueries({ queryKey: ['debitCards'] });
                              }}
                            >
                              Report Lost/Stolen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Card Number</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">
                            {showCardNumbers[card.id]
                              ? card.cardNumber
                              : maskCardNumber(card.cardNumber)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowCardNumbers((prev) => ({
                                ...prev,
                                [card.id]: !prev[card.id],
                              }))
                            }
                          >
                            {showCardNumbers[card.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Expiry</p>
                          <p className="font-semibold">{card.expiryDate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Holder</p>
                          <p className="font-semibold truncate">{card.cardHolderName}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Spending Limits</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs">Daily: ₹{card.dailyLimit?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Spent: ₹{card.spentToday?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs">Monthly: ₹{card.monthlyLimit?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Spent: ₹{card.spentMonth?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Badge variant={getStatusVariant(card.status)} className={getStatusColor(card.status)}>
                          {card.status}
                        </Badge>
                        {card.isContactlessEnabled && (
                          <Badge variant="outline" className="text-xs">
                            Contactless ✓
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            await debitCardApi.toggleContactless(card.id, !card.isContactlessEnabled);
                            queryClient.invalidateQueries({ queryKey: ['debitCards'] });
                          }}
                        >
                          {card.isContactlessEnabled ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" /> Disable Contactless
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3 mr-1" /> Enable Contactless
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            await debitCardApi.toggleOtp(card.id, !card.otpRequired);
                            queryClient.invalidateQueries({ queryKey: ['debitCards'] });
                          }}
                        >
                          {card.otpRequired ? (
                            <>
                              <ShieldCheck className="h-3 w-3 mr-1" /> OTP On
                            </>
                          ) : (
                            <>
                              <ShieldX className="h-3 w-3 mr-1" /> OTP Off
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="credit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Credit Plans</CardTitle>
                <CardDescription>Choose a plan that matches your spending style</CardDescription>
              </CardHeader>
              <CardContent>
                {creditPlans && creditPlans.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {creditPlans.map((plan) => (
                      <div key={plan.id} className="rounded-xl border border-border/60 p-4 bg-card/70">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{plan.cashbackPercentage}% cashback</Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">APR</p>
                            <p className="font-semibold">{plan.apr}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Annual Fee</p>
                            <p className="font-semibold">₹{plan.annualFee}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Limit Range</p>
                            <p className="font-semibold">₹{plan.minLimit} - ₹{plan.maxLimit}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Grace</p>
                            <p className="font-semibold">{plan.gracePeriodDays} days</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="mt-4 w-full"
                          disabled={creditCardList.length === 0}
                          onClick={() => {
                            if (creditCardList.length === 1) {
                              void (async () => {
                                try {
                                  await creditPlanApi.assignToCard(plan.id ?? 0, creditCardList[0].id);
                                  toast.success('Credit plan applied');
                                  queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                                } catch (error) {
                                  toast.error('Failed to apply plan');
                                  console.error(error);
                                }
                              })();
                              return;
                            }
                            setPlanTargetId(plan.id ?? null);
                            setPlanCardId(creditCardList[0]?.id ?? null);
                            setPlanDialogOpen(true);
                          }}
                        >
                          Apply Plan
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No credit plans available.</p>
                )}
              </CardContent>
            </Card>

            {creditLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : creditCardList.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No credit cards found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {creditCardList.map((card) => (
                  <Card key={card.id} className="overflow-hidden border-amber-100 dark:border-amber-500/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{card.cardType}</CardTitle>
                          <CardDescription>Credit Card</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openLimitDialog('credit', card.id, card.dailyLimit, card.monthlyLimit)}
                              >
                                Set Limits
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  openMerchantDialog('credit', card.id, card.merchantCategoryBlocks)
                                }
                              >
                                Merchant Blocks
                              </DropdownMenuItem>
                              {card.status === 'BLOCKED' ? (
                                <DropdownMenuItem onClick={async () => {
                                  await creditCardApi.unfreeze(card.id);
                                  queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                                }}>
                                  Unfreeze Card
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={async () => {
                                  await creditCardApi.freeze(card.id, 'CUSTOMER_FREEZE');
                                  queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                                }}>
                                  Freeze Card
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={async () => {
                                  await creditCardApi.replace(card.id);
                                  queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                                }}
                              >
                                Replace Card
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={async () => {
                                  await creditCardApi.freeze(card.id, 'LOST_OR_STOLEN');
                                  queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                                }}
                              >
                                Report Lost/Stolen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Card Number</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">
                            {showCardNumbers[card.id]
                              ? card.cardNumber
                              : maskCardNumber(card.cardNumber)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowCardNumbers((prev) => ({
                                ...prev,
                                [card.id]: !prev[card.id],
                              }))
                            }
                          >
                            {showCardNumbers[card.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Credit Limit</p>
                          <p className="font-semibold">₹{card.creditLimit?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="font-semibold text-green-600">₹{card.availableCredit?.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Current Balance</p>
                          <p className="font-semibold">₹{card.currentBalance?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Min Due</p>
                          <p className="font-semibold text-orange-600">₹{card.minimumDue?.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Daily Limit</p>
                          <p className="font-semibold">₹{card.dailyLimit?.toLocaleString() ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly Limit</p>
                          <p className="font-semibold">₹{card.monthlyLimit?.toLocaleString() ?? '-'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 flex-wrap">
                        <Badge variant={getStatusVariant(card.status)} className={getStatusColor(card.status)}>
                          {card.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {card.rewardPoints} Rewards
                        </Badge>
                        {card.planName && (
                          <Badge variant="outline" className="text-xs">
                            {card.planName} Plan
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            await creditCardApi.toggleContactless(card.id, !card.isContactlessEnabled);
                            queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                          }}
                        >
                          {card.isContactlessEnabled ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" /> Disable Contactless
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3 mr-1" /> Enable Contactless
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            await creditCardApi.toggleOtp(card.id, !card.otpRequired);
                            queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                          }}
                        >
                          {card.otpRequired ? (
                            <>
                              <ShieldCheck className="h-3 w-3 mr-1" /> OTP On
                            </>
                          ) : (
                            <>
                              <ShieldX className="h-3 w-3 mr-1" /> OTP Off
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <DebitCardRequestsPanel
                accountNumber={selectedAccountNumber}
                accountOptions={accountOptions}
                onAccountChange={(value) => setSelectedAccountNumber(value)}
                isApprover={isApprover}
                isRequester={isRequester}
              />
              <CreditCardApplicationPanel
                accountNumber={selectedAccountNumber}
                accountOptions={accountOptions}
                onAccountChange={(value) => setSelectedAccountNumber(value)}
                isApprover={isApprover}
                isRequester={isRequester}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Update Spending Limits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily limit (INR)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={limitDaily}
                onChange={(e) => setLimitDaily(e.target.value)}
                placeholder="e.g. 20000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyLimit">Monthly limit (INR)</Label>
              <Input
                id="monthlyLimit"
                type="number"
                value={limitMonthly}
                onChange={(e) => setLimitMonthly(e.target.value)}
                placeholder="e.g. 100000"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLimitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveLimits}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={merchantDialogOpen} onOpenChange={setMerchantDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Merchant Category Blocks</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="merchantBlocks">Blocked categories</Label>
            <Input
              id="merchantBlocks"
              value={merchantInput}
              onChange={(e) => setMerchantInput(e.target.value)}
              placeholder="e.g. Gambling, Crypto, Travel"
            />
            <p className="text-xs text-muted-foreground">Separate categories with commas.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMerchantDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMerchantBlocks}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Select a credit card</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="planCard">Apply plan to</Label>
            <select
              id="planCard"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={planCardId ? String(planCardId) : ''}
              onChange={(e) => setPlanCardId(Number(e.target.value))}
            >
              {creditCardList.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.cardType} •••• {card.cardNumber.slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyPlan} disabled={!planCardId || !planTargetId}>
              Apply Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
