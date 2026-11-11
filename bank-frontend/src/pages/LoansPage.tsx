import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useLoans, useEMIs } from '@/hooks/useCards';
import { accountApi, getApiErrorMessage } from '@/lib/api-client';
import type { AccountResponseDTO } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardSkeleton } from '@/components/LoadingStates';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CalendarDays, CheckCircle2, Wallet } from 'lucide-react';

export default function LoansPage() {
  const { user } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'loans' | 'emis'>('loans');

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isError: accountsError,
    error: accountsLoadError,
    refetch: refetchAccounts,
  } = useQuery<AccountResponseDTO[], Error>({
    queryKey: ['accounts', 'mine', user?.userId],
    queryFn: accountApi.getMy,
    enabled: Boolean(user?.userId),
  });
  const customerId = accounts[0]?.customerId;
  const {
    data: loans,
    isLoading: loansLoading,
    isError: loansError,
    error: loansLoadError,
    refetch: refetchLoans,
  } = useLoans(customerId);
  const {
    data: emis,
    isLoading: emisLoading,
    isError: emisError,
    error: emisLoadError,
    refetch: refetchEmis,
  } = useEMIs(selectedLoan ?? undefined);
  const loanList = loans ?? [];
  const emiList = emis ?? [];

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'CLOSED':
        return 'bg-info/15 text-info';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
    }
  };

  const getLoanTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      PERSONAL: 'Personal Loan',
      HOME: 'Home Loan',
      AUTO: 'Auto Loan',
      EDUCATION: 'Education Loan',
    };
    return types[type] || type;
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Loans & EMI"
        subtitle="Track outstanding balances and your EMI schedule"
      />

      <div className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'loans' || value === 'emis') setActiveTab(value);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="loans">My Loans</TabsTrigger>
            <TabsTrigger value="emis">EMI Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-4">
            {accountsLoading || loansLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : accountsError || loansError ? (
              <Card role="alert">
                <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Loan details could not be loaded</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getApiErrorMessage(accountsError ? accountsLoadError : loansLoadError, 'Please try again.')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void (accountsError ? refetchAccounts() : refetchLoans())}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : accounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/50 text-primary">
                    <Wallet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">No linked bank account</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Link a bank account to view any loans associated with your customer profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !customerId ? (
              <Card role="alert">
                <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
                  We could not resolve the customer profile linked to your account. Please contact support.
                </CardContent>
              </Card>
            ) : loanList.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/50 text-primary">
                    <Wallet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">No loans to show</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Loan details will appear here when they are linked to your profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {loanList.map((loan) => {
                  const progressPercentage = loan.loanAmount > 0 
                    ? ((loan.loanAmount - loan.outstandingAmount) / loan.loanAmount) * 100
                    : 0;

                  return (
                    <Card key={loan.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{getLoanTypeLabel(loan.loanType)}</CardTitle>
                            <CardDescription>
                              Loan ID: {loan.id} • {loan.tenureMonths} months tenure
                            </CardDescription>
                          </div>
                          <Badge variant={loan.status?.toUpperCase() === 'ACTIVE' ? 'secondary' : loan.status?.toUpperCase() === 'CLOSED' ? 'outline' : 'destructive'} className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Loan Amount</p>
                            <p className="text-lg font-semibold">₹{loan.loanAmount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Outstanding</p>
                            <p className="text-lg font-semibold text-orange-600">
                              ₹{loan.outstandingAmount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">EMI Amount</p>
                            <p className="text-lg font-semibold">₹{loan.emiAmount?.toLocaleString()}/month</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Repayment Progress</span>
                            <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>

                        <div className="grid gap-2 md:grid-cols-4 text-xs">
                          <div>
                            <p className="text-muted-foreground">Interest Rate</p>
                            <p className="font-semibold">{loan.interestRate}% p.a.</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">EMIs Paid</p>
                            <p className="font-semibold">{loan.emisPaid} of {loan.tenureMonths}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Start Date</p>
                            <p className="font-semibold">{new Date(loan.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next EMI</p>
                            <p className="font-semibold">
                              {loan.nextEmiDate ? new Date(loan.nextEmiDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedLoan(loan.id);
                              setActiveTab('emis');
                            }}
                          >
                            View EMI schedule
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="emis" className="space-y-4">
            {selectedLoan === null ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/50 text-primary">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Choose a loan</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Select “View EMI schedule” on a loan to see its due dates and amounts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : emisLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : emisError ? (
              <Card role="alert">
                <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">EMI schedule could not be loaded</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getApiErrorMessage(emisLoadError, 'Please try again.')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void refetchEmis()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : emiList.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/50 text-primary">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">No instalments to show</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This loan does not have an EMI schedule available yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {emiList.map((emi) => {
                  const isPaid = emi.status?.toUpperCase() === 'PAID';
                  const isOverdue = !isPaid && new Date(emi.dueDate) < new Date();
                  
                  return (
                    <Card key={emi.id} className={isPaid ? 'opacity-60' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">EMI #{emi.emiNumber}</span>
                              <Badge variant="outline">
                                ₹{emi.emiAmount?.toLocaleString()}
                              </Badge>
                              {isPaid && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                              {isOverdue && (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div className="grid gap-2 md:grid-cols-3 text-xs text-muted-foreground">
                              <div>
                                Due: {new Date(emi.dueDate).toLocaleDateString()}
                              </div>
                              <div>
                                Principal: ₹{emi.principalComponent?.toLocaleString()}
                              </div>
                              <div>
                                Interest: ₹{emi.interestComponent?.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPaid ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20">
                                Paid
                              </Badge>
                            ) : isOverdue ? (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-500/20">
                                Overdue
                              </Badge>
                            ) : (
                              <Badge className="bg-info/15 text-info">
                                Upcoming
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
