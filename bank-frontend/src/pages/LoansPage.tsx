import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useLoans, useEMIs } from '@/hooks/useCards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardSkeleton } from '@/components/LoadingStates';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function LoansPage() {
  const { user } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null);

  // For now, we'll use demo data. In a real scenario, we'd fetch the user's customer ID
  const customerId = user?.userId?.toString() ?? '';
  
  const { data: loans, isLoading: loansLoading } = useLoans(customerId || undefined);
  const { data: emis, isLoading: emisLoading } = useEMIs(selectedLoan ?? undefined);
  const loanList = loans ?? [];
  const emiList = emis ?? [];

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'CLOSED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
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
        subtitle="Manage your loans and EMI payments"
      />

      <div className="space-y-6">
        <Tabs defaultValue="loans" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="loans">My Loans</TabsTrigger>
            <TabsTrigger value="emis">EMI Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-4">
            {loansLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : loanList.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No active loans found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {loanList.map((loan) => {
                  const progressPercentage = loan.loanAmount > 0 
                    ? ((loan.loanAmount - loan.outstandingAmount) / loan.loanAmount) * 100
                    : 0;

                  return (
                    <Card key={loan.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setSelectedLoan(loan.id)}>
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

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="default" className="flex-1">
                            Pay EMI
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            View Details
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
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Select a loan to view EMI schedule
                </CardContent>
              </Card>
            ) : emisLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : emiList.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No EMIs found for selected loan
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
                              <>
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-500/20">
                                  Overdue
                                </Badge>
                                <Button size="sm" variant="default">
                                  Pay Now
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20">
                                  Upcoming
                                </Badge>
                                <Button size="sm" variant="outline">
                                  Pay Now
                                </Button>
                              </>
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
